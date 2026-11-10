
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

import StaffAccountManagement from "./StaffAccountManagement";

type StaffProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "Never";

  return date.toLocaleString("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRole(role: string) {
  return role.replaceAll("_", " ");
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

async function StaffProfileContent({
  params,
}: StaffProfilePageProps) {
  // Authenticate administrator.
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Verify administrator account against the database.
  const currentAdmin = await prisma.adminUser.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!currentAdmin || !currentAdmin.isActive) {
    redirect("/admin/login");
  }

  // Staff members cannot access personnel management.
  if (currentAdmin.role === "STAFF") {
    redirect("/admin/dashboard");
  }

  // Retrieve personnel ID.
  const { id } = await params;

  // Retrieve personnel information.
  const personnel = await prisma.adminUser.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!personnel) {
    notFound();
  }

  const formattedCurrentRole = formatRole(currentAdmin.role);
  const formattedPersonnelRole = formatRole(personnel.role);

  return (
    <main className="admin-dashboard">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <Link
          href="/admin/dashboard"
          className="admin-sidebar-brand"
        >
          <span className="admin-brand-mark">
            ESH
          </span>

          <span>
            <strong>E-SERVICE HUB</strong>
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <div className="admin-sidebar-section">
          <p className="admin-sidebar-heading">
            WORKSPACE
          </p>

          <Link
            href="/admin/dashboard"
            className="admin-sidebar-link"
          >
            <span>▦</span>
            Dashboard
          </Link>

          <Link
            href="/admin/requests"
            className="admin-sidebar-link"
          >
            <span>▤</span>
            Service Requests
          </Link>

          <Link
            href="/admin/customers"
            className="admin-sidebar-link"
          >
            <span>♙</span>
            Customers
          </Link>

          <p className="admin-sidebar-heading">
            MANAGEMENT
          </p>

          <Link
            href="/admin/staff"
            className="admin-sidebar-link active"
          >
            <span>♧</span>
            Staff & Administrators
          </Link>

          <Link
            href="/admin/analytics"
            className="admin-sidebar-link"
          >
            <span>▥</span>
            Analytics & Reports
          </Link>

          <Link
            href="/admin/settings"
            className="admin-sidebar-link"
          >
            <span>⚙</span>
            Settings
          </Link>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">
            <div className="admin-avatar">
              {currentAdmin.email.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>Administration</strong>
              <small>{formattedCurrentRole}</small>
            </div>
          </div>

          <form
            action="/api/admin/logout"
            method="POST"
          >
            <button
              type="submit"
              className="admin-logout-button"
            >
              Sign Out →
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <section className="admin-main">

        {/* TOP BAR */}
        <header className="admin-topbar">
          <div>
            <p>ADMINISTRATION / MANAGEMENT</p>
            <h1>Personnel Profile</h1>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-status-dot" />
            <span>{formattedCurrentRole}</span>
          </div>
        </header>

        <div className="staff-profile-workspace">

          {/* PAGE INTRODUCTION */}
          <div className="staff-profile-page-heading">
            <div>
              <div className="staff-profile-breadcrumb">
                <Link href="/admin/staff">
                  Personnel Management
                </Link>

                <span>/</span>

                <span>Personnel Profile</span>
              </div>

              <span className="staff-profile-eyebrow">
                HUMAN RESOURCE & ACCESS MANAGEMENT
              </span>

              <h2>Personnel Profile</h2>

              <p>
                Review personnel identity, account status and
                organisational access information.
              </p>
            </div>

            <Link
              href="/admin/staff"
              className="staff-profile-back"
            >
              <span>←</span>
              Back to Personnel
            </Link>
          </div>

          {/* PERSONNEL IDENTITY CARD */}
          <section className="staff-profile-identity">
            <div className="staff-profile-identity-main">
              <div className="staff-profile-avatar">
                {getInitials(personnel.fullName)}
              </div>

              <div className="staff-profile-identity-text">
                <span className="staff-profile-identity-label">
                  PERSONNEL ACCOUNT
                </span>

                <h1>{personnel.fullName}</h1>

                <p>{personnel.email}</p>

                <div className="staff-profile-tags">
                  <span
                    className={`staff-profile-role role-${personnel.role.toLowerCase()}`}
                  >
                    {formattedPersonnelRole}
                  </span>

                  <span
                    className={
                      personnel.isActive
                        ? "staff-profile-status active"
                        : "staff-profile-status inactive"
                    }
                  >
                    <i />

                    {personnel.isActive
                      ? "Active Account"
                      : "Inactive Account"}
                  </span>
                </div>
              </div>
            </div>

            <div className="staff-profile-identity-side">
              <span>ACCOUNT CREATED</span>

              <strong>
                {formatDate(personnel.createdAt)}
              </strong>
            </div>
          </section>

          {/* PERSONNEL DETAILS */}
          <section className="staff-profile-details">
            <div className="staff-profile-section-heading">
              <div>
                <span>ACCOUNT INFORMATION</span>

                <h2>Personnel Details</h2>

                <p>
                  Official identity and account information
                  recorded in the administration system.
                </p>
              </div>

              <div className="staff-profile-section-icon">
                ♙
              </div>
            </div>

            <div className="staff-profile-details-grid">

              <article className="staff-profile-detail">
                <span>FULL NAME</span>
                <strong>{personnel.fullName}</strong>
              </article>

              <article className="staff-profile-detail">
                <span>EMAIL ADDRESS</span>
                <strong>{personnel.email}</strong>
              </article>

              <article className="staff-profile-detail">
                <span>ACCOUNT ROLE</span>
                <strong>{formattedPersonnelRole}</strong>
              </article>

              <article className="staff-profile-detail">
                <span>ACCOUNT STATUS</span>

                <strong
                  className={
                    personnel.isActive
                      ? "staff-profile-value-active"
                      : "staff-profile-value-inactive"
                  }
                >
                  {personnel.isActive ? "Active" : "Inactive"}
                </strong>
              </article>

              <article className="staff-profile-detail">
                <span>LAST LOGIN</span>

                <strong>
                  {formatDate(personnel.lastLoginAt)}
                </strong>
              </article>

              <article className="staff-profile-detail">
                <span>REGISTRATION DATE</span>

                <strong>
                  {formatDate(personnel.createdAt)}
                </strong>
              </article>

              <article className="staff-profile-detail">
                <span>LAST ACCOUNT UPDATE</span>

                <strong>
                  {formatDate(personnel.updatedAt)}
                </strong>
              </article>

            </div>

            {/* UNIQUE PERSONNEL IDENTIFIER */}
            <div className="staff-profile-id-section">
              <div>
                <span>UNIQUE PERSONNEL IDENTIFIER</span>

                <p>
                  System-generated reference assigned to this account.
                </p>
              </div>

              <code>{personnel.id}</code>
            </div>
          </section>

          {/* PERSONNEL ACCOUNT MANAGEMENT */}
          <StaffAccountManagement
            personnelId={personnel.id}
            personnelName={personnel.fullName}
            personnelEmail={personnel.email}
            personnelRole={personnel.role}
            personnelIsActive={personnel.isActive}
            currentAdminId={currentAdmin.id}
            currentAdminRole={currentAdmin.role}
          />

          {/* ACCOUNT SECURITY NOTICE */}
          <section className="staff-profile-security">
            <div className="staff-profile-security-icon">
              !
            </div>

            <div>
              <strong>
                Account Security & Access
              </strong>

              <p>
                Personnel account information is restricted to
                authorised administrators. Protect account
                credentials and never share passwords between
                team members.
              </p>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="staff-profile-footer">
            <strong>
              E-SERVICE HUB & DIGITAL CYBER
            </strong>

            <span>
              Quality. Commitment. Excellence.
            </span>

            <small>
              Staff & Administrators
            </small>
          </footer>

        </div>
      </section>
    </main>
  );
}

export default function StaffProfilePage({
  params,
}: StaffProfilePageProps) {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <section className="admin-main">
            <p>Loading personnel profile...</p>
          </section>
        </main>
      }
    >
      <StaffProfileContent params={params} />
    </Suspense>
  );
}
