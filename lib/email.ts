import "server-only";

import { randomUUID } from "node:crypto";
import { Resend } from "resend";

export const SUPER_ADMIN_EMAIL = "aylatechs.hub@gmail.com";
const EMAIL_REQUEST_TIMEOUT_MS = 8_000;

type QuotationEmailInput = {
  to: string;
  customerName: string;
  quotationNumber: string;
  amount: string;
  validUntil: string;
  description?: string | null;
};

export type AdminNotificationEmailInput = {
  id: string;
  eventType: string;
  subject: string;
  details: Record<string, string>;
  occurredAt: Date;
  occurrences: number;
};

type TransactionalEmailInput = {
  idempotencyKey: string;
  to: string;
  subject: string;
  html: string;
};

function isResendConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.RESEND_FROM_EMAIL?.trim()
  );
}

function isGoogleAppsScriptConfigured() {
  return Boolean(
    process.env.GOOGLE_APPS_SCRIPT_URL?.trim() &&
      process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim()
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function getConfiguredResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return {
    resend: new Resend(apiKey),
    from,
  };
}

function getTransactionalEmailProviderLabel() {
  const resendConfigured = isResendConfigured();
  const googleAppsScriptConfigured = isGoogleAppsScriptConfigured();

  if (resendConfigured && googleAppsScriptConfigured) {
    return "Resend with Gmail Apps Script fallback";
  }

  if (resendConfigured) {
    return "Resend";
  }

  if (googleAppsScriptConfigured) {
    return "Gmail via Apps Script";
  }

  return "Email provider not configured";
}

export function isTransactionalEmailConfigured() {
  return isResendConfigured() || isGoogleAppsScriptConfigured();
}

async function sendWithGoogleAppsScript(
  input: TransactionalEmailInput
) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim();

  if (!url || !secret) {
    throw new Error("Google Apps Script email delivery is not configured.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret,
      idempotencyKey: input.idempotencyKey,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
    signal: AbortSignal.timeout(EMAIL_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Google Apps Script email delivery returned HTTP ${response.status}.`
    );
  }

  const result: unknown = await response.json();
  if (
    typeof result !== "object" ||
    result === null ||
    !("success" in result) ||
    result.success !== true
  ) {
    const errorMessage =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "Google Apps Script email delivery failed.";
    throw new Error(errorMessage);
  }
}

async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const googleAppsScriptConfigured = isGoogleAppsScriptConfigured();

  if (isResendConfigured()) {
    try {
      const { resend, from } = getConfiguredResend();
      const { error } = await resend.emails.send(
        {
          from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
        },
        {
          idempotencyKey: input.idempotencyKey,
          signal: AbortSignal.timeout(EMAIL_REQUEST_TIMEOUT_MS),
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      return;
    } catch (error) {
      if (!googleAppsScriptConfigured) {
        throw error;
      }

      console.error(
        "RESEND_EMAIL_DELIVERY_ERROR; USING_GOOGLE_APPS_SCRIPT_FALLBACK:",
        error instanceof Error ? error.message : "Unknown email delivery error."
      );
    }
  }

  if (googleAppsScriptConfigured) {
    await sendWithGoogleAppsScript(input);
    return;
  }

  throw new Error("No transactional email provider is configured.");
}

export async function sendAdminNotificationEmail(
  input: AdminNotificationEmailInput
) {
  const detailRows = Object.entries(input.details)
    .map(
      ([key, value]) =>
        `<tr><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5eaf1">${escapeHtml(key)}</th><td style="padding:8px 12px;border-bottom:1px solid #e5eaf1">${escapeHtml(value)}</td></tr>`
    )
    .join("");
  const occurrenceNotice =
    input.occurrences > 1
      ? `<p>This alert represents ${input.occurrences} similar security events in a short period.</p>`
      : "";

  await sendTransactionalEmail({
    idempotencyKey: `system-notification-${input.id}`,
    to: SUPER_ADMIN_EMAIL,
    subject: `[E-SERVICE HUB] ${input.subject}`,
    html: `
        <div style="font-family:Arial,sans-serif;color:#192b46;max-width:620px;margin:auto">
          <h1 style="color:#061b42">E-SERVICE HUB &amp; DIGITAL CYBER</h1>
          <h2>${escapeHtml(input.subject)}</h2>
          <p><strong>Event:</strong> ${escapeHtml(input.eventType)}</p>
          <p><strong>Time:</strong> ${escapeHtml(input.occurredAt.toISOString())}</p>
          ${occurrenceNotice}
          <table style="width:100%;border-collapse:collapse">${detailRows}</table>
          <p style="color:#748198;font-size:12px">Automated system activity alert.</p>
        </div>
      `,
  });
}

export async function sendAdminPasswordResetEmail(resetUrl: string) {
  const safeResetUrl = escapeHtml(resetUrl);

  await sendTransactionalEmail({
    idempotencyKey: `admin-password-reset-${randomUUID()}`,
    to: SUPER_ADMIN_EMAIL,
    subject: "Reset your E-SERVICE HUB administrator password",
    html: `
        <div style="font-family:Arial,sans-serif;color:#192b46;max-width:620px;margin:auto">
          <h1 style="color:#061b42">E-SERVICE HUB &amp; DIGITAL CYBER</h1>
          <h2>Administrator password reset</h2>
          <p>A password reset was requested for the super administrator account.</p>
          <p><a href="${safeResetUrl}" style="display:inline-block;background:#061b42;color:#fff;padding:13px 20px;border-radius:8px;text-decoration:none">Reset password</a></p>
          <p>This one-time link expires in 20 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
  });
}

export async function sendQuotationEmail(input: QuotationEmailInput) {
  if (!isTransactionalEmailConfigured()) {
    return {
      sent: false,
      reason: "No transactional email provider is configured.",
    };
  }

  await sendTransactionalEmail({
    idempotencyKey: `quotation-${input.quotationNumber}`,
    to: input.to,
    subject: `Quotation ${input.quotationNumber} from E-SERVICE HUB`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#192b46;max-width:620px;margin:auto">
        <h1 style="color:#061b42">E-SERVICE HUB &amp; DIGITAL CYBER</h1>
        <p>Hello ${escapeHtml(input.customerName)},</p>
        <p>Your quotation <strong>${input.quotationNumber}</strong> is ready.</p>
        <p><strong>Amount:</strong> ${escapeHtml(input.amount)}</p>
        <p><strong>Valid until:</strong> ${escapeHtml(input.validUntil)}</p>
        ${input.description ? `<p>${escapeHtml(input.description)}</p>` : ""}
        <p>Please keep this quotation for your records. Reply to this email if you have questions.</p>
        <p><strong>QCE — Quality. Commitment. Excellence.</strong></p>
      </div>
    `,
  });

  return { sent: true };
}

export { getTransactionalEmailProviderLabel };
