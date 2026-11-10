
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const requestStatuses = [
  "NEW",
  "UNDER_REVIEW",
  "QUOTED",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

type RequestStatusFilter = (typeof requestStatuses)[number];

type RequestsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

async function RequestsPageContent({
  searchParams,
}: RequestsPageProps) {
  // Verify the administrator session.
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Verify the administrator is still active.
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  const query =
    typeof params.q === "string"
      ? params.q.trim().slice(0, 100)
      : "";

  const selectedStatus = requestStatuses.includes(
    params.status as RequestStatusFilter
  )
    ? (params.status as RequestStatusFilter)
    : "";

  // Build database filters.
  const where = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(query
      ? {
          OR: [
            {
              reference: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              department: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              service: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              customer: {
                is: {
                  fullName: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              customer: {
                is: {
                  phone: {
                    contains: query,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  // Retrieve matching requests and total count.
  const [requests, totalRequests] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      take: 50,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        reference: true,
        department: true,
        service: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    }),

    prisma.serviceRequest.count({
      where,
    }),
  ]);

  function formatStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-sidebar-brand">
          <span className="admin-brand-mark">ESH</span>

          <span>
            <strong>E-SERVICE HUB</strong>
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-heading">WORKSPACE</p>

          <Link
            href="/admin/dashboard"
            className="admin-sidebar-link"
          >
            <span>▦</span> Dashboard
          </Link>

          <Link
            href="/admin/requests"
            className="admin-sidebar-link active"
          >
            <span>▤</span> Service Requests
          </Link>

          <Link
            href="/admin/customers"
            className="admin-sidebar-link"
          >
            <span>♙</span> Customers
          </Link>

          <p className="admin-sidebar-heading">MANAGEMENT</p>

          <Link href="/admin/staff" className="admin-sidebar-link">
            <span>♧</span> Staff & Administrators
          </Link>

          <Link href="/admin/analytics" className="admin-sidebar-link">
            <span>▥</span> Analytics & Reports
          </Link>

          <Link href="/admin/settings" className="admin-sidebar-link">
            <span>⚙</span> Settings
          </Link>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">
            <div className="admin-avatar">A</div>

            <div>
              <strong>Administration</strong>
              <small>Secure workspace</small>
            </div>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="admin-logout-button">
              Sign Out →
            </button>
          </form>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>ADMINISTRATION / WORKSPACE</p>
            <h1>Service Requests</h1>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-status-dot" />
            <span>Administrator</span>
          </div>
        </header>

        <section className="admin-welcome">
          <div>
            <p className="admin-welcome-label">
              CUSTOMER OPERATIONS
            </p>

            <h2>Service Request Management</h2>

            <p>
              Review customer submissions, monitor application progress
              and manage incoming service requests.
            </p>
          </div>

          <div className="admin-welcome-badge">
            <span>📋</span>

            <div>
              <strong>{totalRequests.toLocaleString()}</strong>
              <small>Matching requests</small>
            </div>
          </div>
        </section>

        <section className="admin-recent-section">
          <div className="admin-section-heading">
            <div>
              <h2>Customer Submissions</h2>
              <p>
                Search and filter requests received by E-SERVICE HUB.
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="admin-view-all"
            >
              ← Dashboard
            </Link>
          </div>

          <form
            action="/admin/requests"
            method="GET"
            className="admin-request-filters"
          >
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search reference, customer, phone or service..."
              maxLength={100}
              aria-label="Search service requests"
            />

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filter by request status"
            >
              <option value="">All statuses</option>

              {requestStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <button type="submit">
              Search Requests
            </button>

            <Link href="/admin/requests">
              Clear Filters
            </Link>
          </form>

          <div className="admin-request-summary">
            <strong>
              {totalRequests.toLocaleString()} request(s) found
            </strong>

            <span>
              Showing up to 50 most recent matching records
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Service Details</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                  <th>Last Updated</th>
                </tr>
              </thead>

              <tbody>
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr key={request.id}>
                      <td>
  <Link
    href={`/admin/requests/${request.id}`}
    className="admin-request-reference"
  >
    <strong>{request.reference}</strong>
  </Link>
</td>

                      <td>
                        <strong>{request.customer.fullName}</strong>
                        <small>{request.customer.phone}</small>
                        {request.customer.email && (
                          <small>{request.customer.email}</small>
                        )}
                      </td>

                      <td>
                        <strong>{request.service}</strong>
                        <small>{request.department}</small>
                      </td>

                      <td>
                        <span className="admin-status-label">
                          {formatStatus(request.status)}
                        </span>
                      </td>

                      <td>{formatDate(request.createdAt)}</td>

                      <td>{formatDate(request.updatedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="admin-empty-state">
                      No service requests match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="admin-dashboard-footer">
          QUALITY. COMMITMENT. EXCELLENCE.
          <span>E-SERVICE HUB & DIGITAL CYBER © 2026</span>
        </footer>
      </section>
    </main>
  );
}

export default function AdminRequestsPage(props: RequestsPageProps) {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <section className="admin-main">
            <p>Loading service requests...</p>
          </section>
        </main>
      }
    >
      <RequestsPageContent {...props} />
    </Suspense>
  );
}
