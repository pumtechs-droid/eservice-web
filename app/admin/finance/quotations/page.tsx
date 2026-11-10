
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type QuotationsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

const validStatuses = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

function formatCurrency(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

async function QuotationsContent({
  searchParams,
}: QuotationsPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const selectedStatus = params.status ?? "";

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

  const statusFilter = validStatuses.includes(
    selectedStatus as (typeof validStatuses)[number]
  )
    ? (selectedStatus as (typeof validStatuses)[number])
    : undefined;

  const quotations = await prisma.serviceQuotation.findMany({
    where: statusFilter
      ? { status: statusFilter }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      quotationNumber: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
      validUntil: true,
      request: {
        select: {
          reference: true,
          service: true,
          customer: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  const filteredQuotations = quotations.filter((quotation) => {
    if (!search) return true;

    const searchText = [
      quotation.quotationNumber,
      quotation.request.reference,
      quotation.request.service,
      quotation.request.customer.fullName,
      quotation.request.customer.phone,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  const [
    totalQuotations,
    draftCount,
    sentCount,
    acceptedCount,
    rejectedCount,
    expiredCount,
  ] = await Promise.all([
    prisma.serviceQuotation.count(),
    prisma.serviceQuotation.count({ where: { status: "DRAFT" } }),
    prisma.serviceQuotation.count({ where: { status: "SENT" } }),
    prisma.serviceQuotation.count({ where: { status: "ACCEPTED" } }),
    prisma.serviceQuotation.count({ where: { status: "REJECTED" } }),
    prisma.serviceQuotation.count({ where: { status: "EXPIRED" } }),
  ]);

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
          <Link href="/admin/finance">
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
            <strong>Service Quotations</strong>
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
                WORKSPACE / FINANCE / QUOTATIONS
              </span>
              <h1>Service Quotations</h1>
              <p>
                Prepare, review and manage quotations issued for customer
                service requests.
              </p>
            </div>

            <Link
              href="/admin/finance/quotations/new"
              className="finance-workspace-create-button"
            >
              + Create Quotation
            </Link>
          </section>

          <section className="finance-workspace-stat-grid">
            <article>
              <span>Total Quotations</span>
              <strong>{totalQuotations}</strong>
              <small>All quotation records</small>
            </article>
            <article>
              <span>Draft</span>
              <strong>{draftCount}</strong>
              <small>Being prepared</small>
            </article>
            <article>
              <span>Sent</span>
              <strong>{sentCount}</strong>
              <small>Awaiting response</small>
            </article>
            <article>
              <span>Accepted</span>
              <strong>{acceptedCount}</strong>
              <small>Customer-approved</small>
            </article>
            <article>
              <span>Rejected</span>
              <strong>{rejectedCount}</strong>
              <small>Not accepted</small>
            </article>
            <article>
              <span>Expired</span>
              <strong>{expiredCount}</strong>
              <small>Past validity period</small>
            </article>
          </section>

          <section className="finance-workspace-section">
            <div className="finance-workspace-section-heading">
              <div>
                <span>QUOTATION REGISTER</span>
                <h2>All Quotations</h2>
                <p>
                  Search and filter quotation records across customer
                  requests.
                </p>
              </div>
            </div>

            <form
              method="GET"
              action="/admin/finance/quotations"
              className="finance-quotation-filters"
            >
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search quotation, customer or request..."
              />

              <select
                name="status"
                defaultValue={statusFilter ?? ""}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>

              <button type="submit">Apply Filters</button>

              <Link href="/admin/finance/quotations">
                Clear
              </Link>
            </form>

            <div className="finance-quotation-results">
              Showing <strong>{filteredQuotations.length}</strong> of{" "}
              <strong>{totalQuotations}</strong> quotations
            </div>

            {filteredQuotations.length === 0 ? (
              <div className="finance-workspace-empty">
                <span>▤</span>
                <strong>No quotations found</strong>
                <p>
                  {search || statusFilter
                    ? "Try changing your search or filter criteria."
                    : "Create your first quotation to get started."}
                </p>
                <Link href="/admin/finance/quotations/new">
                  Create a Quotation →
                </Link>
              </div>
            ) : (
              <div className="finance-workspace-table-wrap">
                <table className="finance-workspace-table">
                  <thead>
                    <tr>
                      <th>QUOTATION</th>
                      <th>CUSTOMER</th>
                      <th>SERVICE REQUEST</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                      <th>DATE CREATED</th>
                      <th>VALID UNTIL</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredQuotations.map((quotation) => (
                      <tr key={quotation.id}>
                        <td>
                          <strong>{quotation.quotationNumber}</strong>
                        </td>
                        <td>
                          <strong>
                            {quotation.request.customer.fullName}
                          </strong>
                          <small>
                            {quotation.request.customer.phone}
                          </small>
                        </td>
                        <td>
                          <strong>{quotation.request.reference}</strong>
                          <small>{quotation.request.service}</small>
                        </td>
                        <td>
                          <strong>
                            {formatCurrency(
                              Number(quotation.amount),
                              quotation.currency
                            )}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`finance-workspace-status status-${quotation.status.toLowerCase()}`}
                          >
                            {formatStatus(quotation.status)}
                          </span>
                        </td>
                        <td>{formatDate(quotation.createdAt)}</td>
                        <td>
                          {quotation.validUntil
                            ? formatDate(quotation.validUntil)
                            : "Not specified"}
                        </td>
                        <td>
                          <Link
                            href={`/admin/finance/quotations/${quotation.id}`}
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

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

export default function QuotationsPage(props: QuotationsPageProps) {
  return (
    <Suspense
      fallback={
        <main className="admin-loading">
          Loading quotations register...
        </main>
      }
    >
      <QuotationsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
