import "server-only";

import { prisma } from "@/lib/prisma";
import { sendAdminNotificationEmail } from "@/lib/email";

type NotificationDetails = Record<
  string,
  string | number | boolean | null
>;

type AdminSystemEventType =
  | "ADMIN_LOGIN_FAILED"
  | "ADMIN_LOGIN_SUCCEEDED"
  | "ADMIN_LOGOUT"
  | "ADMIN_PASSWORD_CHANGED"
  | "ADMIN_PASSWORD_RESET_COMPLETED"
  | "CMS_CONTENT_CREATED"
  | "CMS_CONTENT_UPDATED"
  | "CMS_CONTENT_DELETED"
  | "CUSTOMER_ACCOUNT_CREATED"
  | "CUSTOMER_CONTACT_UPDATED"
  | "CUSTOMER_LOGIN_FAILED"
  | "CUSTOMER_LOGIN_SUCCEEDED"
  | "CUSTOMER_LOGOUT"
  | "CUSTOMER_PASSWORD_CHANGED"
  | "MANUAL_PAYMENT_SUBMITTED"
  | "MPESA_PAYMENT_INITIATED"
  | "MPESA_PAYMENT_CONFIRMED"
  | "MPESA_PAYMENT_FAILED"
  | "PERSONNEL_ACCOUNT_CREATED"
  | "PERSONNEL_ACCOUNT_UPDATED"
  | "EMPLOYEE_REGISTERED"
  | "QUOTATION_CREATED"
  | "QUOTATION_UPDATED"
  | "QUOTATION_SENT"
  | "REQUEST_STATUS_CHANGED"
  | "REQUEST_INTERNAL_NOTE_ADDED"
  | "SERVICE_REQUEST_SUBMITTED";

export type AdminSystemEvent = {
  eventType: AdminSystemEventType;
  subject: string;
  details: NotificationDetails;
  dedupeKey?: string;
};

const STALE_LOCK_AGE_MS = 10 * 60 * 1000;
const MAX_RETRY_DELAY_MINUTES = 6 * 60;

function sanitizeDetails(details: NotificationDetails) {
  const safeDetails: NotificationDetails = {};

  for (const [key, value] of Object.entries(details)) {
    if (/password|token|secret|authorization|payload/i.test(key)) {
      continue;
    }

    safeDetails[key.slice(0, 100)] =
      typeof value === "string" ? value.slice(0, 500) : value;
  }

  return safeDetails;
}

function getEmailDetails(details: unknown): Record<string, string> {
  if (
    typeof details !== "object" ||
    details === null ||
    Array.isArray(details)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === "string" ? value : String(value),
    ])
  );
}

async function dispatchNotification(id: string) {
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - STALE_LOCK_AGE_MS);
  const claim = await prisma.systemNotification.updateMany({
    where: {
      id,
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", lockedAt: { lt: staleLockBefore } },
      ],
    },
    data: {
      status: "PROCESSING",
      lockedAt: now,
      attempts: { increment: 1 },
    },
  });

  if (claim.count !== 1) {
    return false;
  }

  const notification = await prisma.systemNotification.findUnique({
    where: { id },
  });

  if (!notification) {
    console.error("SUPER_ADMIN_NOTIFICATION_MISSING_AFTER_CLAIM:", id);
    return false;
  }

  try {
    await sendAdminNotificationEmail({
      id: notification.id,
      eventType: notification.eventType,
      subject: notification.subject,
      details: getEmailDetails(notification.details),
      occurredAt: notification.createdAt,
      occurrences: notification.occurrences,
    });

    await prisma.systemNotification.update({
      where: { id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    });

    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error.";
    const delayMinutes = Math.min(
      2 ** Math.min(Math.max(notification.attempts, 1) - 1, 8),
      MAX_RETRY_DELAY_MINUTES
    );

    try {
      await prisma.systemNotification.update({
        where: { id },
        data: {
          status: "PENDING",
          availableAt: new Date(Date.now() + delayMinutes * 60_000),
          lockedAt: null,
          lastError: message.slice(0, 500),
        },
      });
    } catch (updateError) {
      console.error(
        "SUPER_ADMIN_NOTIFICATION_RETRY_SCHEDULE_ERROR:",
        updateError
      );
    }

    console.error("SUPER_ADMIN_NOTIFICATION_DELIVERY_ERROR:", {
      notificationId: id,
      error,
    });

    return false;
  }
}

export async function notifySuperAdmin(event: AdminSystemEvent) {
  const details = sanitizeDetails(event.details);
  let notificationId: string;

  try {
    const notification = event.dedupeKey
      ? await prisma.systemNotification.upsert({
          where: { dedupeKey: event.dedupeKey },
          create: {
            eventType: event.eventType,
            subject: event.subject.slice(0, 200),
            details,
            dedupeKey: event.dedupeKey,
          },
          update: {
            occurrences: { increment: 1 },
          },
          select: { id: true },
        })
      : await prisma.systemNotification.create({
          data: {
            eventType: event.eventType,
            subject: event.subject.slice(0, 200),
            details,
          },
          select: { id: true },
        });

    notificationId = notification.id;
  } catch (error) {
    console.error("SUPER_ADMIN_NOTIFICATION_QUEUE_ERROR:", {
      eventType: event.eventType,
      error,
    });
    return;
  }

  try {
    await dispatchNotification(notificationId);
  } catch (error) {
    console.error("SUPER_ADMIN_NOTIFICATION_DISPATCH_ERROR:", {
      notificationId,
      error,
    });
  }
}

export async function retryPendingAdminNotifications() {
  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - STALE_LOCK_AGE_MS);
  const pending = await prisma.systemNotification.findMany({
    where: {
      OR: [
        { status: "PENDING", availableAt: { lte: now } },
        { status: "PROCESSING", lockedAt: { lt: staleLockBefore } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: { id: true },
  });

  let processed = 0;
  for (const notification of pending) {
    if (await dispatchNotification(notification.id)) {
      processed += 1;
    }
  }

  return processed;
}

