
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type QuotationDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    updated?: string;
    sent?: string;
    sendError?: string;
  }>;
};

function formatCurrency(amount: unknown, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(date: Date | null) {
  if (!date) return "Not specified";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "quotation-status-draft";
    case "SENT":
      return "quotation-status-sent";
    case "ACCEPTED":
      return "quotation-status-accepted";
    case "REJECTED":
      return "quotation-status-rejected";
    case "EXPIRED":
      return "quotation-status-expired";
    default:
      return "";
  }
}

async function QuotationDetailsContent({
  params,
  searchParams,
}: QuotationDetailsPageProps) {
  const { id } = await params;
  const { updated, sent, sendError } = await searchParams;

  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const admin = await prisma.adminUser.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    redirect("/admin/login");
  }

  if (
    admin.role !== "SUPER_ADMIN" &&
    admin.role !== "ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  const quotation = await prisma.serviceQuotation.findUnique({
    where: {
      id,
    },
    include: {
      request: {
        include: {
          customer: true,
        },
      },
      createdBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  return (
    <main className="quotation-detail-page">
      <div className="quotation-detail-topbar">
        <div>
          <Link
            href="/admin/finance/quotations"
            className="quotation-back-link"
          >
            ← Back to Quotations
          </Link>

          <h1>Quotation Details</h1>

          <p>
            Review the quotation and its associated service request.
          </p>
        </div>

        <span
          className={`quotation-detail-status ${getStatusClass(
            quotation.status
          )}`}
        >
          {quotation.status.replaceAll("_", " ")}
        </span>
      </div>

      {updated === "1" && (
        <div className="quotation-update-success">
          <strong>✓ Quotation updated successfully.</strong>
          <span>
            Your changes have been saved to the database.
          </span>
        </div>
      )}

      {sent === "1" && (
        <div className="quotation-update-success">
          <strong>✓ Quotation marked as sent.</strong>
          <span>
            The sending administrator and timestamp have been recorded.
            Customer notification has not yet been configured.
          </span>
        </div>
      )}

      {sendError === "1" && (
        <div className="quotation-send-error">
          <strong>Quotation could not be sent.</strong>
          <span>
            It may no longer be a draft, may have expired, or may
            already have been processed. Refresh and review its
            current status.
          </span>
        </div>
      )}

      <section className="quotation-detail-card">
        <div className="quotation-detail-heading">
          <div>
            <span className="quotation-detail-label">
              QUOTATION NUMBER
            </span>

            <h2>{quotation.quotationNumber}</h2>
          </div>

          <div className="quotation-detail-amount">
            <span>Quotation Amount</span>

            <strong>
              {formatCurrency(
                quotation.amount,
                quotation.currency
              )}
            </strong>
          </div>
        </div>

        <div className="quotation-detail-divider" />

        <div className="quotation-detail-grid">
          <div>
            <span className="quotation-detail-label">
              CUSTOMER NAME
            </span>

            <strong>
              {quotation.request.customer.fullName}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              CUSTOMER PHONE
            </span>

            <strong>
              {quotation.request.customer.phone}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              CUSTOMER EMAIL
            </span>

            <strong>
              {quotation.request.customer.email || "Not provided"}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              SERVICE REQUEST REFERENCE
            </span>

            <strong>
              {quotation.request.reference}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              SERVICE
            </span>

            <strong>
              {quotation.request.service}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              REQUEST STATUS
            </span>

            <strong>
              {quotation.request.status.replaceAll("_", " ")}
            </strong>
          </div>
        </div>
      </section>

      <section className="quotation-detail-card">
        <h2>Quotation Description</h2>

        <div className="quotation-description">
          {quotation.description || "No description provided."}
        </div>

        {quotation.notes && (
          <div className="quotation-notes">
            <span className="quotation-detail-label">
              INTERNAL NOTES
            </span>

            <p>{quotation.notes}</p>
          </div>
        )}
      </section>

      <section className="quotation-detail-card">
        <h2>Quotation Information</h2>

        <div className="quotation-detail-grid">
          <div>
            <span className="quotation-detail-label">
              DATE CREATED
            </span>

            <strong>
              {formatDateTime(quotation.createdAt)}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              LAST UPDATED
            </span>

            <strong>
              {formatDateTime(quotation.updatedAt)}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              VALID UNTIL
            </span>

            <strong>
              {formatDate(quotation.validUntil)}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              CREATED BY
            </span>

            <strong>
              {quotation.createdBy.fullName}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              ADMIN EMAIL
            </span>

            <strong>
              {quotation.createdBy.email}
            </strong>
          </div>

          <div>
            <span className="quotation-detail-label">
              CURRENCY
            </span>

            <strong>
              {quotation.currency}
            </strong>
          </div>
        </div>
      </section>

      {quotation.status === "SENT" && (
        <section className="quotation-detail-card">
          <h2>Quotation Sending Record</h2>

          <div className="quotation-detail-grid">
            <div>
              <span className="quotation-detail-label">
                DATE AND TIME SENT
              </span>

              <strong>
                {quotation.sentAt
                  ? formatDateTime(quotation.sentAt)
                  : "Not recorded"}
              </strong>
            </div>

            <div>
              <span className="quotation-detail-label">
                SENT BY
              </span>

              <strong>
                {quotation.sentByName || "Not recorded"}
              </strong>
            </div>

            <div>
              <span className="quotation-detail-label">
                ADMINISTRATOR ID
              </span>

              <strong>
                {quotation.sentById || "Not recorded"}
              </strong>
            </div>
          </div>
        </section>
      )}

      <div className="quotation-detail-actions">
        <Link
          href="/admin/finance/quotations"
          className="quotation-detail-secondary-button"
        >
          Back to Register
        </Link>

        {quotation.status === "DRAFT" && (
          <>
            <Link
              href={`/admin/finance/quotations/${quotation.id}/edit`}
              className="quotation-edit-button"
            >
              Edit Quotation →
            </Link>

            <form
              action={`/api/admin/finance/quotations/${quotation.id}/send`}
              method="POST"
            >
              <button
                type="submit"
                className="quotation-send-button"
              >
                Send Quotation →
              </button>
            </form>
          </>
        )}

        <span className="quotation-detail-notice">
          This quotation is currently{" "}
          {quotation.status.toLowerCase().replaceAll("_", " ")}.
        </span>
      </div>
    </main>
  );
}

export default function QuotationDetailsPage(
  props: QuotationDetailsPageProps
) {
  return (
    <Suspense
      fallback={
        <main className="quotation-detail-page">
          Loading quotation details...
        </main>
      }
    >
      <QuotationDetailsContent {...props} />
    </Suspense>
  );
}
