
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import CustomerAccountManagement from "./CustomerAccountManagement";

type CustomerProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

async function CustomerProfileContent({
  params,
}: CustomerProfilePageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const currentAdmin = await prisma.adminUser.findUnique({
    where: {
      id: session.id,
    },
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

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      createdAt: true,
      updatedAt: true,

      requests: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          reference: true,
          department: true,
          service: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const totalRequests = customer.requests.length;

  const completedRequests = customer.requests.filter(
    (request) => request.status === "COMPLETED"
  ).length;

  const activeRequests = customer.requests.filter(
    (request) =>
      request.status === "IN_PROGRESS" ||
      request.status === "UNDER_REVIEW" ||
      request.status === "QUOTED" ||
      request.status === "AWAITING_PAYMENT"
  ).length;

  const newRequests = customer.requests.filter(
    (request) => request.status === "NEW"
  ).length;

  const cancelledRequests = customer.requests.filter(
    (request) => request.status === "CANCELLED"
  ).length;

  const initial = customer.fullName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="admin-dashboard customer-profile-layout">
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-brand">
          <strong>ESH</strong>

          <span>
            E-SERVICE HUB
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <div className="admin-sidebar-section">
          WORKSPACE
        </div>

        <nav className="admin-nav">
          <Link href="/admin/dashboard">
            ▦ Dashboard
          </Link>

          <Link href="/admin/requests">
            ▤ Service Requests
          </Link>

          <Link href="/admin/customers" className="active">
            ♙ Customers
          </Link>
        </nav>

        <div className="admin-sidebar-section">
          MANAGEMENT
        </div>

        <nav className="admin-nav">
          <Link href="/admin/staff">
            ♧ Staff & Administrators
          </Link>

          <Link href="/admin/analytics">
            ▥ Analytics & Reports
          </Link>

          <Link href="/admin/settings">
            ⚙ Settings
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <strong>E-SERVICE HUB & DIGITAL CYBER</strong>
          <span>Quality. Commitment. Excellence.</span>
        </div>
      </aside>

      <section className="admin-main customer-profile-main">
        <header className="admin-topbar">
          <div>
            <strong>Administration</strong>
            <span>{currentAdmin.role.replaceAll("_", " ")}</span>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit">
              Sign Out →
            </button>
          </form>
        </header>

        <div className="admin-content customer-profile-page">
          {/* BREADCRUMB */}
          <div className="customer-profile-breadcrumb">
            <Link href="/admin/dashboard">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/customers">Customers</Link>
            <span>/</span>
            <strong>Customer Profile</strong>
          </div>

          {/* CUSTOMER IDENTITY */}
          <section className="customer-profile-hero">
            <div className="customer-profile-identity">
              <div className="customer-profile-avatar">
                {initial}
              </div>

              <div>
                <span className="customer-profile-eyebrow">
                  CUSTOMER ACCOUNT
                </span>

                <h1>{customer.fullName}</h1>

                <p>
                  Customer ID: {customer.id}
                </p>
              </div>
            </div>

            <Link
              href="/admin/customers"
              className="customer-profile-back"
            >
              ← Back to Customers
            </Link>
          </section>

          {/* CUSTOMER STATISTICS */}
          <section className="customer-profile-stats">
            <article>
              <span>Total Requests</span>
              <strong>{totalRequests}</strong>
              <small>All submitted requests</small>
            </article>

            <article>
              <span>Active Requests</span>
              <strong>{activeRequests}</strong>
              <small>Currently being processed</small>
            </article>

            <article>
              <span>Completed Requests</span>
              <strong>{completedRequests}</strong>
              <small>Successfully completed</small>
            </article>

            <article>
              <span>New Requests</span>
              <strong>{newRequests}</strong>
              <small>Awaiting initial review</small>
            </article>
          </section>

          {/* CUSTOMER INFORMATION */}
          <section className="customer-profile-information">
            <div className="customer-profile-section-heading">
              <div>
                <span>ACCOUNT INFORMATION</span>
                <h2>Customer Details</h2>
              </div>
            </div>

            <div className="customer-profile-details-grid">
              <div>
                <span>Full Name</span>
                <strong>{customer.fullName}</strong>
              </div>

              <div>
                <span>Phone Number</span>
                <strong>{customer.phone}</strong>
              </div>

              <div>
                <span>Email Address</span>
                <strong>
                  {customer.email || "Not provided"}
                </strong>
              </div>

              <div>
                <span>Registration Date</span>
                <strong>{formatDate(customer.createdAt)}</strong>
              </div>

              <div>
                <span>Last Record Update</span>
                <strong>{formatDateTime(customer.updatedAt)}</strong>
              </div>

              <div>
                <span>Cancelled Requests</span>
                <strong>{cancelledRequests}</strong>
              </div>
            </div>
          </section>

          {/* CUSTOMER ACCOUNT MANAGEMENT */}
          <CustomerAccountManagement
            customerId={customer.id}
            initialFullName={customer.fullName}
            initialPhone={customer.phone}
            initialEmail={customer.email}
          />

          {/* REQUEST HISTORY */}
          <section className="customer-profile-history">
            <div className="customer-profile-section-heading">
              <div>
                <span>SERVICE ENGAGEMENT</span>
                <h2>Service Request History</h2>
                <p>
                  All service requests submitted by this customer.
                </p>
              </div>

              <span className="customer-profile-history-count">
                {totalRequests} REQUESTS
              </span>
            </div>

            {customer.requests.length === 0 ? (
              <div className="customer-profile-empty">
                <span>▤</span>
                <strong>No service requests yet</strong>
                <p>
                  This customer has not submitted any service requests.
                </p>
              </div>
            ) : (
              <div className="customer-profile-request-list">
                {customer.requests.map((request) => (
                  <article
                    key={request.id}
                    className="customer-profile-request-card"
                  >
                    <div className="customer-profile-request-top">
                      <div>
                        <span className="customer-profile-request-reference">
                          {request.reference}
                        </span>

                        <h3>{request.service}</h3>

                        <p>{request.department}</p>
                      </div>

                      <span
                        className={`customer-profile-status status-${request.status.toLowerCase()}`}
                      >
                        {formatStatus(request.status)}
                      </span>
                    </div>

                    <div className="customer-profile-request-description">
                      {request.description}
                    </div>

                    <div className="customer-profile-request-bottom">
                      <span>
                        Submitted: {formatDateTime(request.createdAt)}
                      </span>

                      <span>
                        Updated: {formatDateTime(request.updatedAt)}
                      </span>

                      <Link
                        href={`/admin/requests/${request.id}`}
                      >
                        Manage Request →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="customer-profile-footer">
            <strong>E-SERVICE HUB & DIGITAL CYBER</strong>
            <span>Quality. Commitment. Excellence.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function CustomerProfilePage(
  props: CustomerProfilePageProps
) {
  return (
    <Suspense
      fallback={
        <main className="admin-loading">
          Loading customer profile...
        </main>
      }
    >
      <CustomerProfileContent {...props} />
    </Suspense>
  );
}
