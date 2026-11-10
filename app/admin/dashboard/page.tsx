
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function AdminDashboardContent() {
  // Verify the administrator session.
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Verify that the administrator still exists and is active.
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  });

  if (!admin || !admin.isActive) {
    redirect("/admin/login");
  }

  // Retrieve dashboard statistics.
  const [
    totalRequests,
    newRequests,
    activeRequests,
    completedRequests,
    totalCustomers,
    totalAdmins,
  ] = await Promise.all([
    prisma.serviceRequest.count(),

    prisma.serviceRequest.count({
      where: { status: "NEW" },
    }),

    prisma.serviceRequest.count({
      where: {
        status: {
          in: [
            "UNDER_REVIEW",
            "QUOTED",
            "AWAITING_PAYMENT",
            "IN_PROGRESS",
          ],
        },
      },
    }),

    prisma.serviceRequest.count({
      where: { status: "COMPLETED" },
    }),

    prisma.customer.count(),

    prisma.adminUser.count({
      where: { isActive: true },
    }),
  ]);

  // Retrieve the latest eight customer requests.
  const recentRequests = await prisma.serviceRequest.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      reference: true,
      department: true,
      service: true,
      status: true,
      createdAt: true,
      customer: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  });

  const statistics = [
    { label: "Total Requests", value: totalRequests, icon: "📋" },
    { label: "New Requests", value: newRequests, icon: "🆕" },
    { label: "Active Requests", value: activeRequests, icon: "⚙️" },
    { label: "Completed Requests", value: completedRequests, icon: "✅" },
    { label: "Total Customers", value: totalCustomers, icon: "👥" },
    { label: "Active Administrators", value: totalAdmins, icon: "🛡️" },
  ];

  function formatStatus(status: string) {
    return status.replaceAll("_", " ");
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
            className="admin-sidebar-link active"
          >
            <span>▦</span> Dashboard
          </Link>

          <Link href="/admin/requests" className="admin-sidebar-link">
            <span>▤</span> Service Requests
          </Link>

          <Link href="/admin/customers" className="admin-sidebar-link">
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
            <div className="admin-avatar">
              {admin.fullName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{admin.fullName}</strong>
              <small>{admin.role.replaceAll("_", " ")}</small>
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
            <p>ADMINISTRATION / OVERVIEW</p>
            <h1>Dashboard</h1>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-status-dot" />
            <span>Administrator</span>
          </div>
        </header>

        <div className="admin-welcome">
          <div>
            <p className="admin-welcome-label">CONTROL CENTRE</p>

            <h2>Welcome back, {admin.fullName}!</h2>

            <p>
              Monitor operations, manage customer requests and oversee
              E-SERVICE HUB activities from one secure workspace.
            </p>
          </div>

          <div className="admin-welcome-badge">
            <span>🛡️</span>

            <div>
              <strong>{admin.role.replaceAll("_", " ")}</strong>
              <small>Verified account</small>
            </div>
          </div>
        </div>

        <div className="admin-section-heading">
          <div>
            <h2>Operational Overview</h2>
            <p>Current service and administration statistics.</p>
          </div>
        </div>

        <div className="admin-stat-grid">
          {statistics.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <div className="admin-stat-top">
                <span>{stat.label}</span>
                <span className="admin-stat-icon">{stat.icon}</span>
              </div>

              <strong>{stat.value.toLocaleString()}</strong>
              <small>Database records</small>
            </article>
          ))}
        </div>

        <section className="admin-recent-section">
          <div className="admin-section-heading">
            <div>
              <h2>Recent Service Requests</h2>
              <p>The latest customer submissions.</p>
            </div>

            <Link href="/admin/requests" className="admin-view-all">
              View all requests →
            </Link>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date Submitted</th>
                </tr>
              </thead>

              <tbody>
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <tr key={request.reference}>
                      <td>
                        <strong>{request.reference}</strong>
                      </td>

                      <td>
                        <strong>{request.customer.fullName}</strong>
                        <small>{request.customer.phone}</small>
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

                      <td>
                        {request.createdAt.toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="admin-empty-state">
                      No service requests have been submitted yet.
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

// Suspense boundary handles session cookies during prerendering.
export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <section className="admin-main">
            <p>Loading administration dashboard...</p>
          </section>
        </main>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
