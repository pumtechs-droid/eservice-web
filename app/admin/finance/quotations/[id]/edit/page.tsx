
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type EditQuotationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function EditQuotationContent({
  params,
}: EditQuotationPageProps) {
  const { id } = await params;

  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    redirect("/admin/login");
  }

  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const quotation = await prisma.serviceQuotation.findUnique({
    where: { id },
    select: {
      id: true,
      quotationNumber: true,
      amount: true,
      description: true,
      notes: true,
      validUntil: true,
      currency: true,
      status: true,
    },
  });

  if (!quotation) {
    notFound();
  }

  if (quotation.status !== "DRAFT") {
    return (
      <main className="quotation-edit-page">
        <div className="quotation-edit-card">
          <h1>Quotation Cannot Be Edited</h1>
          <p>
            Only draft quotations can be edited. This quotation is currently
            {` ${quotation.status.toLowerCase().replaceAll("_", " ")}.`}
          </p>
          <Link href={`/admin/finance/quotations/${id}`}>
            Return to Quotation Details
          </Link>
        </div>
      </main>
    );
  }

  const validityDate = quotation.validUntil
    ? quotation.validUntil.toISOString().slice(0, 10)
    : "";

  return (
    <main className="quotation-edit-page">
      <div className="quotation-edit-header">
        <div>
          <Link
            href={`/admin/finance/quotations/${id}`}
            className="quotation-edit-back"
          >
            ← Back to Quotation
          </Link>

          <h1>Edit Draft Quotation</h1>
          <p>
            Update the quotation details before sending it to the customer.
          </p>
        </div>

        <span className="quotation-edit-draft-badge">
          DRAFT
        </span>
      </div>

      <section className="quotation-edit-card">
        <div className="quotation-edit-reference">
          <span>QUOTATION NUMBER</span>
          <strong>{quotation.quotationNumber}</strong>
        </div>

        <form
          action={`/api/admin/finance/quotations/${quotation.id}`}
          method="POST"
          className="quotation-edit-form"
        >
          <div className="quotation-edit-field">
            <label htmlFor="amount">Quotation Amount (KES)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              max="9999999999"
              step="0.01"
              defaultValue={Number(quotation.amount).toFixed(2)}
              required
            />
          </div>

          <div className="quotation-edit-field">
            <label htmlFor="validUntil">Valid Until</label>
            <input
              id="validUntil"
              name="validUntil"
              type="date"
              defaultValue={validityDate}
              min={new Date().toLocaleDateString("en-CA")}
            />
          </div>

          <div className="quotation-edit-field quotation-edit-full">
            <label htmlFor="description">
              Quotation Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={7}
              maxLength={5000}
defaultValue={quotation.description ?? ""}              required
            />
          </div>

          <div className="quotation-edit-field quotation-edit-full">
            <label htmlFor="notes">Internal Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={3000}
              defaultValue={quotation.notes ?? ""}
              placeholder="Enter internal notes for administrators..."
            />
            <small>
              Internal notes are for administrative use and should not be
              included in customer communications.
            </small>
          </div>

          <div className="quotation-edit-notice">
            <strong>Important:</strong> Changes will be saved to the draft.
            They will not send the quotation to the customer.
          </div>

          <div className="quotation-edit-actions">
            <Link
              href={`/admin/finance/quotations/${id}`}
              className="quotation-edit-cancel"
            >
              Cancel
            </Link>

            <button type="submit">
              Save Changes →
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function EditQuotationPage(
  props: EditQuotationPageProps
) {
  return (
    <Suspense
      fallback={
        <main className="quotation-edit-page">
          Loading quotation editor...
        </main>
      }
    >
      <EditQuotationContent {...props} />
    </Suspense>
  );
}
