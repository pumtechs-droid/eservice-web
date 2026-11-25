import { Resend } from "resend";

type QuotationEmailInput = {
  to: string;
  customerName: string;
  quotationNumber: string;
  amount: string;
  validUntil: string;
  description?: string | null;
};

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
