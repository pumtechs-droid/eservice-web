
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

import "./dashboard.css";

async function AdminDashboardContent() {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

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

  if (!admin || !admin.isActive) redirect("/admin/login");

  const [
    totalRequests,
    newRequests,
    activeRequests,
    completedRequests,
    totalCustomers,
    totalAdmins,
    recentRequests,
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

    prisma.serviceRequest.findMany({
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
    }),
  ]);

  const completionRate =
    totalRequests > 0
      ? Math.round((completedRequests / totalRequests) * 100)
      : 0;

  const statistics = [
    {
      label: "Total Requests",
      value: totalRequests,
      icon: "▤",
      color: "blue",
      description: "All submitted requests",
    },
    {
      label: "New Requests",
      value: newRequests,
      icon: "✦",
      color: "gold",
      description: "Awaiting attention",
    },
    {
      label: "Active Requests",
      value: activeRequests,
      icon: "◷",
      color: "purple",
      description: "Currently being processed",
    },
    {
      label: "Completed Requests",
      value: completedRequests,
      icon: "✓",
      color: "green",
      description: "Successfully completed",
    },
    {
      label: "Total Customers",
      value: totalCustomers,
      icon: "♙",
      color: "cyan",
      description: "Registered customers",
    },
    {
      label: "Active Administrators",
      value: totalAdmins,
      icon: "♧",
      color: "dark",
      description: "Active admin accounts",
    },
  ];

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
    <main className="esh-dashboard">
      <aside className="esh-sidebar">
        <Link href="/admin/dashboard" className="esh-brand">
          <span className="esh-logo">ESH</span>
          <strong>E-SERVICE HUB</strong>
          <small>& DIGITAL CYBER</small>
          <span className="esh-tagline">
            Quality. Commitment. Excellence.
          </span>
        </Link>

        <div className="esh-nav-label">MAIN WORKSPACE</div>

        <nav className="esh-navigation">
          <Link href="/admin/dashboard" className="esh-nav-link active">
            <span>▦</span> Dashboard
          </Link>

          <Link href="/admin/requests" className="esh-nav-link">
            <span>▤</span> Service Requests
          </Link>

          <Link href="/admin/customers" className="esh-nav-link">
            <span>♙</span> Customers
          </Link>

          <div className="esh-nav-label">MANAGEMENT</div>

          <Link href="/admin/staff" className="esh-nav-link">
            <span>♧</span> Staff & Administrators
          </Link>

          <Link href="/admin/finance" className="esh-nav-link">
            <span>▣</span> Finance & Payments
          </Link>
        </nav>

        <div className="esh-sidebar-bottom">
          <div className="esh-support">
            <span>◉</span>
            <div>
              <strong>Administration</strong>
              <small>Secure workspace</small>
            </div>
          </div>

          <div className="esh-user">
            <div className="esh-avatar">
              {admin.fullName.charAt(0).toUpperCase()}
            </div>

            <div className="esh-user-details">
              <strong>{admin.fullName}</strong>
              <small>{admin.role.replaceAll("_", " ")}</small>
            </div>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="esh-logout">
              Sign out <span>→</span>
            </button>
          </form>
        </div>
      </aside>

      <section className="esh-main">
        <header className="esh-topbar">
          <div>
            <span className="esh-breadcrumb">
              ADMINISTRATION / OVERVIEW
            </span>
            <h1>Dashboard</h1>
          </div>

          <div className="esh-topbar-right">
            <span className="esh-online">
              <i /> System operational
            </span>
            <div className="esh-admin-chip">
              <span className="esh-admin-chip-icon">♛</span>
              <div>
                <strong>SUPER ADMINISTRATION</strong>
                <small>{admin.email}</small>
              </div>
            </div>
          </div>
        </header>

        <section className="esh-welcome">
          <div>
            <span className="esh-eyebrow">CONTROL CENTRE</span>
            <h2>Welcome back, {admin.fullName.split(" ")[0]}!</h2>
            <p>
              Your central workspace for monitoring services,
              customers and business operations.
            </p>
          </div>

          <div className="esh-welcome-mark">
            <span>ESH</span>
            <small>QUALITY. COMMITMENT. EXCELLENCE.</small>
          </div>
        </section>

        <div className="esh-section-title">
          <div>
            <h2>Operational Overview</h2>
            <p>Your organisation&apos;s current performance at a glance.</p>
          </div>
          <span className="esh-live-label">LIVE DATABASE STATISTICS</span>
        </div>

        <section className="esh-stat-grid">
          {statistics.map((stat) => (
            <article
              className={`esh-stat-card esh-${stat.color}`}
              key={stat.label}
            >
              <div className="esh-stat-heading">
                <span>{stat.label}</span>
                <span className="esh-stat-icon">{stat.icon}</span>
              </div>

              <strong className="esh-stat-value">
                {stat.value.toLocaleString("en-KE")}
              </strong>

              <small>{stat.description}</small>
            </article>
          ))}
        </section>

        <section className="esh-content-grid">
          <article className="esh-panel esh-performance">
            <div className="esh-panel-heading">
              <div>
                <h2>Service Performance</h2>
                <p>Completed requests against all submitted requests.</p>
              </div>
              <span className="esh-panel-icon">◈</span>
            </div>

            <div className="esh-completion-number">
              {completionRate}%
              <small>Completion rate</small>
            </div>

            <div
              className="esh-progress-track"
              role="progressbar"
              aria-label="Request completion rate"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="esh-progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>

            <div className="esh-progress-details">
              <span>
                <i className="esh-dot-green" /> {completedRequests} completed
              </span>
              <span>{totalRequests} total requests</span>
            </div>

            <div className="esh-performance-footer">
              <div>
                <strong>{newRequests.toLocaleString("en-KE")}</strong>
                <small>New requests</small>
              </div>
              <div>
                <strong>{activeRequests.toLocaleString("en-KE")}</strong>
                <small>Active requests</small>
              </div>
              <div>
                <strong>{totalCustomers.toLocaleString("en-KE")}</strong>
                <small>Customers</small>
              </div>
            </div>
          </article>

          <article className="esh-panel esh-quick-actions">
            <div className="esh-panel-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Navigate to key administration areas.</p>
              </div>
              <span className="esh-panel-icon">⚡</span>
            </div>

            <div className="esh-action-grid">
              <Link href="/admin/requests" className="esh-action-card">
                <span>＋</span>
                <strong>View Requests</strong>
                <small>Manage submissions</small>
              </Link>

              <Link href="/admin/customers" className="esh-action-card">
                <span>♙</span>
                <strong>Customers</strong>
                <small>Customer records</small>
              </Link>

              <Link href="/admin/staff" className="esh-action-card">
                <span>♧</span>
                <strong>Manage Staff</strong>
                <small>Team administration</small>
              </Link>

              <Link href="/admin/finance" className="esh-action-card">
                <span>▣</span>
                <strong>Finance</strong>
                <small>Payments & reports</small>
              </Link>
            </div>
          </article>
        </section>

        <section className="esh-panel esh-recent">
          <div className="esh-panel-heading">
            <div>
              <h2>Recent Service Requests</h2>
              <p>The eight most recent customer submissions.</p>
            </div>

            <Link href="/admin/requests" className="esh-view-all">
              View all requests →
            </Link>
          </div>

          <div className="esh-table-scroll">
            <table className="esh-table">
              <thead>
                <tr>
                  <th>REFERENCE</th>
                  <th>CUSTOMER</th>
                  <th>SERVICE</th>
                  <th>STATUS</th>
                  <th>DATE SUBMITTED</th>
                </tr>
              </thead>

              <tbody>
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <tr key={request.reference}>
                      <td>
                        <strong className="esh-reference">
                          {request.reference}
                        </strong>
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
                        <span
                          className={`esh-status esh-status-${request.status.toLowerCase()}`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </td>

                      <td>{formatDate(request.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="esh-empty">
                      No service requests have been submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="esh-footer">
          <span>QUALITY. COMMITMENT. EXCELLENCE.</span>
          <span>E-SERVICE HUB & DIGITAL CYBER © 2026</span>
        </footer>
      </section>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="esh-loading">
          Loading administration dashboard...
        </main>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
