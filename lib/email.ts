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

export function isTransactionalEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.RESEND_FROM_EMAIL?.trim()
  );
}

export async function sendAdminNotificationEmail(
  input: AdminNotificationEmailInput
) {
  const { resend, from } = getConfiguredResend();
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

  const { error } = await resend.emails.send(
    {
      from,
      to: [SUPER_ADMIN_EMAIL],
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
    },
    {
      idempotencyKey: `system-notification-${input.id}`,
      signal: AbortSignal.timeout(EMAIL_REQUEST_TIMEOUT_MS),
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendAdminPasswordResetEmail(resetUrl: string) {
  const { resend, from } = getConfiguredResend();
  const safeResetUrl = escapeHtml(resetUrl);

  const { error } = await resend.emails.send(
    {
      from,
      to: [SUPER_ADMIN_EMAIL],
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
    },
    {
      idempotencyKey: `admin-password-reset-${randomUUID()}`,
      signal: AbortSignal.timeout(EMAIL_REQUEST_TIMEOUT_MS),
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendQuotationEmail(input: QuotationEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "E-SERVICE HUB <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: [input.to],
    subject: `Quotation ${input.quotationNumber} from E-SERVICE HUB`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#192b46;max-width:620px;margin:auto">
        <h1 style="color:#061b42">E-SERVICE HUB &amp; DIGITAL CYBER</h1>
        <p>Hello ${input.customerName},</p>
        <p>Your quotation <strong>${input.quotationNumber}</strong> is ready.</p>
        <p><strong>Amount:</strong> ${input.amount}</p>
        <p><strong>Valid until:</strong> ${input.validUntil}</p>
        ${input.description ? `<p>${input.description}</p>` : ""}
        <p>Please keep this quotation for your records. Reply to this email if you have questions.</p>
        <p><strong>QCE — Quality. Commitment. Excellence.</strong></p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { sent: true };
}
