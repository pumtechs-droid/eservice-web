
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function NewQuotationContent() {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  const currentAdmin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!currentAdmin || !currentAdmin.isActive) {
    redirect("/admin/login");
  }

  if (
    currentAdmin.role !== "SUPER_ADMIN" &&
    currentAdmin.role !== "ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  const requests = await prisma.serviceRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      reference: true,
      service: true,
      status: true,
      customer: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  });

  const adminInitial = currentAdmin.fullName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="staff-management-layout finance-workspace">
      <aside className="staff-management-sidebar">
        <Link href="/admin/dashboard" className="staff-sidebar-brand">
          <span className="staff-sidebar-logo">ESH</span>
          <span>
            <strong>E-SERVICE HUB</strong>
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <div className="staff-sidebar-label">WORKSPACE</div>

        <nav className="staff-sidebar-nav">
          <Link href="/admin/dashboard">
            <span>▦</span> Dashboard
          </Link>
          <Link href="/admin/requests">
            <span>▤</span> Service Requests
          </Link>
          <Link href="/admin/customers">
            <span>♙</span> Customers
          </Link>
        </nav>

        <div className="staff-sidebar-label">MANAGEMENT</div>

        <nav className="staff-sidebar-nav">
          <Link href="/admin/staff">
            <span>♧</span> Staff & Administrators
          </Link>
          <Link href="/admin/finance" className="active">
            <span>▣</span> Financial Management
          </Link>
          <Link href="/admin/analytics">
            <span>▥</span> Analytics & Reports
          </Link>
          <Link href="/admin/settings">
            <span>⚙</span> Settings
          </Link>
        </nav>

        <div className="staff-sidebar-account">
          <span className="finance-workspace-avatar">
            {adminInitial}
          </span>
          <div>
            <strong>{currentAdmin.fullName}</strong>
            <small>{currentAdmin.role.replaceAll("_", " ")}</small>
          </div>
        </div>
      </aside>

      <section className="staff-management-main">
        <header className="staff-management-topbar">
          <div>
            <strong>Create Service Quotation</strong>
            <span className="staff-topbar-role">
              {currentAdmin.role.replaceAll("_", " ")}
            </span>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit">
              Sign Out <span>→</span>
            </button>
          </form>
        </header>

        <div className="staff-management-content finance-workspace-content">
          <section className="staff-page-heading finance-workspace-heading">
            <div>
              <span className="staff-page-eyebrow">
                WORKSPACE / FINANCE / QUOTATIONS / NEW
              </span>
              <h1>Create Quotation</h1>
              <p>
                Prepare a service quotation against an existing customer
                request.
              </p>
            </div>

            <Link
              href="/admin/finance/quotations"
              className="finance-workspace-back-button"
            >
              ← Back to Quotations
            </Link>
          </section>

          {requests.length === 0 ? (
            <section className="finance-workspace-section">
              <div className="finance-workspace-empty">
                <span>▤</span>
                <strong>No service requests available</strong>
                <p>
                  A quotation must be linked to an existing customer
                  service request. Create or receive a service request
                  before preparing a quotation.
                </p>
                <Link href="/admin/requests">
                  View Service Requests →
                </Link>
              </div>
            </section>
          ) : (
            <section className="finance-quotation-form-card">
              <div className="finance-quotation-form-heading">
                <div>
                  <span>QUOTATION INFORMATION</span>
                  <h2>Quotation Details</h2>
                  <p>
                    Complete the details below. The quotation will be
                    created with DRAFT status.
                  </p>
                </div>
                <span className="finance-quotation-draft-label">
                  DRAFT
                </span>
              </div>

              <form
                action="/api/admin/finance/quotations"
                method="POST"
                className="finance-quotation-form"
              >
                <div className="finance-quotation-form-group">
                  <label htmlFor="requestId">
                    Customer Service Request <span>*</span>
                  </label>

                  <select
                    id="requestId"
                    name="requestId"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a customer service request
                    </option>

                    {requests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.reference} — {request.customer.fullName}
                        {" — "}
                        {request.service}
                      </option>
                    ))}
                  </select>

                  <small>
                    Select the request for which this quotation is being
                    prepared.
                  </small>
                </div>

                <div className="finance-quotation-form-grid">
                  <div className="finance-quotation-form-group">
                    <label htmlFor="amount">
                      Quotation Amount (KES) <span>*</span>
                    </label>

                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      max="9999999999"
                      step="0.01"
                      placeholder="e.g. 2500.00"
                      required
                    />
                    <small>
                      Enter the total amount payable by the customer.
                    </small>
                  </div>

                  <div className="finance-quotation-form-group">
                    <label htmlFor="validUntil">
                      Valid Until
                    </label>

                    <input
                      id="validUntil"
                      name="validUntil"
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                    />
                    <small>
                      Optional expiry date for this quotation.
                    </small>
                  </div>
                </div>

                <div className="finance-quotation-form-group">
                  <label htmlFor="description">
                    Quotation Description <span>*</span>
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    maxLength={5000}
                    placeholder="Describe the services, work to be performed and what the quotation covers..."
                    required
                  />
                </div>

                <div className="finance-quotation-form-group">
                  <label htmlFor="notes">
                    Internal Notes
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    maxLength={3000}
                    placeholder="Optional internal notes for the administration team..."
                  />

                  <small>
                    These notes are intended for internal administrative
                    use.
                  </small>
                </div>

                <div className="finance-quotation-security-note">
                  <strong>Before saving</strong>
                  <p>
                    Verify the selected customer request, quotation amount
                    and description. This quotation will be saved as a
                    draft and will not yet be sent to the customer.
                  </p>
                </div>

                <div className="finance-quotation-form-actions">
                  <Link href="/admin/finance/quotations">
                    Cancel
                  </Link>

                  <button type="submit">
                    Save Quotation Draft →
                  </button>
                </div>
              </form>
            </section>
          )}

          <footer className="staff-management-footer finance-workspace-footer">
            <span>E-SERVICE HUB & DIGITAL CYBER</span>
            <span>QCE — Quality. Commitment. Excellence.</span>
            <span>Quotations Management Workspace</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-loading">
          Loading quotation form...
        </main>
      }
    >
      <NewQuotationContent />
    </Suspense>
  );
}
