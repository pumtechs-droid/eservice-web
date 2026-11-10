
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import StaffCreateForm from "../StaffCreateForm";

async function NewStaffPageContent() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const currentAdmin = await prisma.adminUser.findUnique({
    where: {
      id: session.id,
    },
    select: {
      fullName: true,
      email: true,
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

  const formattedRole = currentAdmin.role.replaceAll("_", " ");

  return (
    <main className="staff-management-layout">
      {/* SIDEBAR */}
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

        <div className="staff-sidebar-label">
          WORKSPACE
        </div>

        <nav className="staff-sidebar-nav">
          <Link href="/admin/dashboard">
            <span className="staff-nav-icon">▦</span>
            Dashboard
          </Link>

          <Link href="/admin/requests">
            <span className="staff-nav-icon">▤</span>
            Service Requests
          </Link>

          <Link
            href="/admin/staff"
            className="staff-nav-active"
          >
            <span className="staff-nav-icon">♙</span>
            Personnel Management
          </Link>
        </nav>

        <div className="staff-sidebar-account">
          <span className="staff-account-label">
            SIGNED IN AS
          </span>

          <strong>{currentAdmin.fullName}</strong>

          <span>{formattedRole}</span>

          <small>{currentAdmin.email}</small>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <section className="staff-management-main">
        <header className="staff-management-topbar">
          <div>
            <span>ADMINISTRATION / PERSONNEL</span>
            <strong>
              Human Resource & Access Management
            </strong>
          </div>

          <span className="staff-topbar-role">
            {formattedRole}
          </span>
        </header>

        <div className="staff-management-content">
          {/* PAGE HEADING */}
          <div className="staff-page-heading">
            <div>
              <div className="staff-breadcrumb">
                <Link href="/admin/staff">
                  Personnel Management
                </Link>

                <span>/</span>

                <span>New Account</span>
              </div>

              <span className="staff-page-eyebrow">
                PERSONNEL ONBOARDING
              </span>

              <h1>Create Staff Account</h1>

              <p>
                Register a new team member and assign the
                appropriate level of access to the E-SERVICE
                HUB & DIGITAL CYBER administration workspace.
              </p>
            </div>

            <Link
              href="/admin/staff"
              className="staff-back-link"
            >
              <span>←</span>
              Back to Personnel
            </Link>
          </div>

          {/* REGISTRATION CONTENT */}
          <div className="staff-registration-layout">
            <div className="staff-registration-main">
              <StaffCreateForm
                currentRole={currentAdmin.role}
              />
            </div>

            {/* SECURITY GUIDANCE */}
            <aside className="staff-registration-aside">
              <div className="staff-aside-icon">
                !
              </div>

              <span className="staff-aside-label">
                SECURITY & ACCESS CONTROL
              </span>

              <h2>
                Protect your workspace
              </h2>

              <p>
                Every team member must have an individual
                account. Never share login credentials between
                personnel.
              </p>

              <div className="staff-aside-divider" />

              <h3>Role assignment</h3>

              <p>
                Assign permissions according to each team
                member&apos;s responsibilities.
              </p>

              <ul>
                <li>
                  <strong>Administrator</strong>
                  <span>Management and administrative access</span>
                </li>

                <li>
                  <strong>Staff</strong>
                  <span>Operational workspace access</span>
                </li>
              </ul>

              <div className="staff-aside-notice">
                <strong>Account security reminder</strong>

                <p>
                  Use strong, unique passwords and provide
                  account credentials through a secure channel.
                </p>
              </div>

              <div className="staff-aside-footer">
                Quality. Commitment. Excellence.
              </div>
            </aside>
          </div>

          {/* FOOTER */}
          <footer className="staff-management-footer">
            <span>
              E-SERVICE HUB & DIGITAL CYBER
            </span>

            <span>
              Personnel & Administration Workspace
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function NewStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="staff-page-loading">
          Loading personnel workspace...
        </div>
      }
    >
      <NewStaffPageContent />
    </Suspense>
  );
}
