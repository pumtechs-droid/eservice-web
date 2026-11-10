
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type CustomersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function CustomersPageContent({
  searchParams,
}: CustomersPageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

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

  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const where = query
    ? {
        OR: [
          {
            fullName: {
              contains: query,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: query,
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const [
    totalCustomers,
    customersWithRequests,
    customersWithoutRequests,
    filteredCustomerCount,
    customers,
  ] = await Promise.all([
    prisma.customer.count(),

    prisma.customer.count({
      where: {
        requests: { some: {} },
      },
    }),

    prisma.customer.count({
      where: {
        requests: { none: {} },
      },
    }),

    prisma.customer.count({ where }),

    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            requests: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="staff-management-layout customer-workspace">
      <aside className="staff-management-sidebar">
        <Link
          href="/admin/dashboard"
          className="staff-sidebar-brand"
        >
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
          <Link href="/admin/customers" className="active">
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
          <span className="customer-workspace-avatar">
            {currentAdmin.fullName.trim().charAt(0).toUpperCase()}
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
            <strong>Customer Management</strong>
            <span className="staff-topbar-role">
              {currentAdmin.role.replaceAll("_", " ")}
            </span>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit">Sign Out <span>→</span></button>
          </form>
        </header>

        <div className="staff-management-content customer-workspace-content">
          <section className="staff-page-heading customer-workspace-heading">
            <div>
              <span className="staff-page-eyebrow">
                WORKSPACE / CUSTOMER MANAGEMENT
              </span>
              <h1>Customer Directory</h1>
              <p>
                Manage customer records, contact information and service
                engagement across E-SERVICE HUB.
              </p>
            </div>

            <div className="customer-workspace-heading-card">
              <span>♙</span>
              <div>
                <strong>Customer Management</strong>
                <small>Customer records and engagement</small>
              </div>
            </div>
          </section>

          <section
            className="customer-workspace-stats"
            aria-label="Customer statistics"
          >
            <article className="customer-workspace-stat">
              <div className="customer-workspace-stat-top">
                <span>Total Customers</span>
                <span className="customer-workspace-stat-icon">♙</span>
              </div>
              <strong>{totalCustomers.toLocaleString("en-KE")}</strong>
              <small>Registered customer records</small>
            </article>

            <article className="customer-workspace-stat">
              <div className="customer-workspace-stat-top">
                <span>Customers With Requests</span>
                <span className="customer-workspace-stat-icon">▤</span>
              </div>
              <strong>
                {customersWithRequests.toLocaleString("en-KE")}
              </strong>
              <small>Customers who have submitted requests</small>
            </article>

            <article className="customer-workspace-stat">
              <div className="customer-workspace-stat-top">
                <span>Without Requests</span>
                <span className="customer-workspace-stat-icon">◷</span>
              </div>
              <strong>
                {customersWithoutRequests.toLocaleString("en-KE")}
              </strong>
              <small>Registered without service requests</small>
            </article>
          </section>

          <section className="customer-workspace-directory">
            <div className="customer-workspace-directory-heading">
              <div>
                <span>CUSTOMER RECORDS</span>
                <h2>Registered Customers</h2>
                <p>
                  {query
                    ? `Found ${filteredCustomerCount} matching customer records.`
                    : `${totalCustomers} customers are registered in the system.`}
                </p>
              </div>

              <span className="customer-workspace-count">
                {filteredCustomerCount} RECORDS
              </span>
            </div>

            <form
              action="/admin/customers"
              method="GET"
              className="customer-workspace-search"
            >
              <label className="customer-workspace-search-field">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by customer name, phone number or email..."
                  aria-label="Search customers"
                />
              </label>

              <button type="submit">Search Customers</button>

              {query && (
                <Link href="/admin/customers">
                  Clear search
                </Link>
              )}
            </form>

            <div className="customer-workspace-table-wrap">
              <table className="customer-workspace-table">
                <thead>
                  <tr>
                    <th>CUSTOMER</th>
                    <th>PHONE NUMBER</th>
                    <th>EMAIL ADDRESS</th>
                    <th>REQUESTS</th>
                    <th>REGISTERED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="customer-workspace-empty">
                          <span>♙</span>
                          <strong>No customers found</strong>
                          <p>
                            Try another search or clear your search
                            to see all registered customers.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div className="customer-workspace-identity">
                            <span>
                              {customer.fullName
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <strong>{customer.fullName}</strong>
                          </div>
                        </td>

                        <td>{customer.phone}</td>

                        <td>
                          {customer.email || (
                            <span className="customer-workspace-muted">
                              Not provided
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="customer-workspace-request-count">
                            {customer._count.requests}
                          </span>
                        </td>

                        <td>{formatDate(customer.createdAt)}</td>

                        <td>
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="customer-workspace-profile-link"
                          >
                            View Profile <span>→</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="customer-workspace-table-footer">
              <span>
                Showing {customers.length} of {filteredCustomerCount} matching
                records
              </span>
              <span>Maximum 50 records per page</span>
            </div>
          </section>

          <footer className="staff-management-footer">
            <span>E-SERVICE HUB & DIGITAL CYBER</span>
            <span>QCE — Quality. Commitment. Excellence.</span>
            <span>Customer Management Workspace</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function CustomersPage(props: CustomersPageProps) {
  return (
    <Suspense
      fallback={
        <main className="admin-loading">
          Loading customer directory...
        </main>
      }
    >
      <CustomersPageContent {...props} />
    </Suspense>
  );
}
