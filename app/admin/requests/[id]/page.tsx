
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import RequestManagement from "./RequestManagement";

type RequestDetailsPageProps = {
  params: Promise<{ id: string }>;
};

async function RequestDetailsContent({
  params,
}: RequestDetailsPageProps) {
  // Verify administrator session.
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Confirm the administrator account is still active.
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

  const { id } = await params;

  // Retrieve the selected request and customer information.
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      department: true,
      service: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          fullName: true,
          phone: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  function formatStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  function formatDate(date: Date) {
    return date.toLocaleString("en-KE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="admin-dashboard">

      {/* ADMIN SIDEBAR */}
      <aside className="admin-sidebar">
        <Link
          href="/admin/dashboard"
          className="admin-sidebar-brand"
        >
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

          <Link
            href="/admin/staff"
            className="admin-sidebar-link"
          >
            <span>♧</span> Staff & Administrators
          </Link>

          <Link
            href="/admin/analytics"
            className="admin-sidebar-link"
          >
            <span>▥</span> Analytics & Reports
          </Link>

          <Link
            href="/admin/settings"
            className="admin-sidebar-link"
          >
            <span>⚙</span> Settings
          </Link>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">
            <div className="admin-avatar">
              {session.email.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>Administration</strong>
              <small>{session.role.replaceAll("_", " ")}</small>
            </div>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="admin-logout-button"
            >
              Sign Out →
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <section className="admin-main">

        {/* TOP HEADER */}
        <header className="admin-topbar">
          <div>
            <p>ADMINISTRATION / SERVICE REQUESTS</p>
            <h1>Request Details</h1>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-status-dot" />
            <span>Administrator</span>
          </div>
        </header>

        {/* PAGE HEADING */}
        <div className="admin-section-heading">
          <div>
            <h2>Customer Service Request</h2>
            <p>
              Review submitted information, manage processing
              and monitor the request history.
            </p>
          </div>

          <Link
            href="/admin/requests"
            className="admin-view-all"
          >
            ← Back to Requests
          </Link>
        </div>

        {/* REQUEST OVERVIEW */}
        <section className="admin-request-detail-card">
          <div className="admin-request-detail-header">
            <div>
              <p className="admin-welcome-label">
                REQUEST REFERENCE
              </p>

              <h2>{request.reference}</h2>
            </div>

            <span className="admin-status-label">
              {formatStatus(request.status)}
            </span>
          </div>

          <div className="admin-request-detail-grid">
            <article>
              <span>Department</span>
              <strong>{request.department}</strong>
            </article>

            <article>
              <span>Requested Service</span>
              <strong>{request.service}</strong>
            </article>

            <article>
              <span>Date Submitted</span>
              <strong>{formatDate(request.createdAt)}</strong>
            </article>

            <article>
              <span>Last Updated</span>
              <strong>{formatDate(request.updatedAt)}</strong>
            </article>
          </div>
        </section>

        {/* CUSTOMER INFORMATION */}
        <section className="admin-request-detail-card">
          <div className="admin-section-heading">
            <div>
              <h2>Customer Information</h2>
              <p>
                Contact details supplied with this request.
              </p>
            </div>
          </div>

          <div className="admin-request-detail-grid">
            <article>
              <span>Full Name</span>
              <strong>{request.customer.fullName}</strong>
            </article>

            <article>
              <span>Phone Number</span>
              <strong>{request.customer.phone}</strong>
            </article>

            <article>
              <span>Email Address</span>
              <strong>
                {request.customer.email || "Not provided"}
              </strong>
            </article>

            <article>
              <span>Customer Since</span>
              <strong>
                {formatDate(request.customer.createdAt)}
              </strong>
            </article>
          </div>
        </section>

        {/* CUSTOMER REQUEST DESCRIPTION */}
        <section className="admin-request-detail-card">
          <div className="admin-section-heading">
            <div>
              <h2>Request Description</h2>
              <p>
                Details submitted by the customer.
              </p>
            </div>
          </div>

          <div className="admin-request-description">
            {request.description}
          </div>
        </section>

        {/* LIVE REQUEST MANAGEMENT */}
        <section className="admin-request-detail-card">
          <div className="admin-section-heading">
            <div>
              <h2>Request Management</h2>
              <p>
                Manage the request, add internal notes and
                review its administrative history.
              </p>
            </div>
          </div>

          <RequestManagement
            requestId={request.id}
            initialStatus={request.status}
          />
        </section>

        {/* FOOTER */}
        <footer className="admin-dashboard-footer">
          QUALITY. COMMITMENT. EXCELLENCE.

          <span>
            E-SERVICE HUB & DIGITAL CYBER © 2026
          </span>
        </footer>

      </section>
    </main>
  );
}

export default function AdminRequestDetailsPage(
  props: RequestDetailsPageProps
) {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <section className="admin-main">
            <p>Loading request details...</p>
          </section>
        </main>
      }
    >
      <RequestDetailsContent {...props} />
    </Suspense>
  );
}
