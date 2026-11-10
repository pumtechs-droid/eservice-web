
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type StaffPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
  }>;
};

const validRoles = ["SUPER_ADMIN", "ADMIN", "STAFF"] as const;

function formatDate(date: Date | null) {
  if (!date) return "Never";

  return date.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
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

async function StaffPageContent({
  searchParams,
}: StaffPageProps) {
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
      isActive: true,
      role: true,
    },
  });

  if (!currentAdmin || !currentAdmin.isActive) {
    redirect("/admin/login");
  }

  if (currentAdmin.role === "STAFF") {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;

  const query = params.q?.trim() ?? "";
  const selectedRole = params.role ?? "";
  const selectedStatus = params.status ?? "";

  const validRole = validRoles.includes(
    selectedRole as (typeof validRoles)[number]
  )
    ? (selectedRole as (typeof validRoles)[number])
    : undefined;

  const validStatus =
    selectedStatus === "active" || selectedStatus === "inactive"
      ? selectedStatus
      : undefined;

  const where = {
    ...(query
      ? {
          OR: [
            {
              fullName: {
                contains: query,
                mode: "insensitive" as const,
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
      : {}),
    ...(validRole ? { role: validRole } : {}),
    ...(validStatus
      ? { isActive: validStatus === "active" }
      : {}),
  };

  const [
    administrators,
    totalAdministrators,
    activeAdministrators,
    inactiveAdministrators,
  ] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      orderBy: [
        { role: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),

    prisma.adminUser.count(),

    prisma.adminUser.count({
      where: {
        isActive: true,
      },
    }),

    prisma.adminUser.count({
      where: {
        isActive: false,
      },
    }),
  ]);

  const canCreateAccounts =
    currentAdmin.role === "SUPER_ADMIN" ||
    currentAdmin.role === "ADMIN";

  return (
    <main className="admin-dashboard">
      {/* SIDEBAR */}
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
              {session.email.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>Administration</strong>
              <small>{formatRole(currentAdmin.role)}</small>
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

      {/* MAIN CONTENT */}
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>ADMINISTRATION / MANAGEMENT</p>
            <h1>Staff & Administrators</h1>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-status-dot" />
            <span>{formatRole(currentAdmin.role)}</span>
          </div>
        </header>

        <div className="admin-personnel-page">
          {/* PAGE HEADING */}
          <div className="admin-personnel-heading">
            <div>
              <span className="admin-personnel-eyebrow">
                HUMAN RESOURCE & ACCESS MANAGEMENT
              </span>

              <h2>Personnel Management</h2>

              <p>
                Manage your workforce, administrator accounts
                and organisational access from one workspace.
              </p>
            </div>

            {canCreateAccounts && (
              <Link
                href="/admin/staff/new"
                className="admin-personnel-add-button"
              >
                <span>＋</span>
                Add Personnel
              </Link>
            )}
          </div>

          {/* PERSONNEL STATISTICS */}
          <div className="admin-personnel-stats">
            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon navy">
                <span>♙</span>
              </div>

              <div>
                <span>Total Personnel</span>
                <strong>{totalAdministrators}</strong>
                <small>Registered accounts</small>
              </div>
            </article>

            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon green">
                <span>✓</span>
              </div>

              <div>
                <span>Active Accounts</span>
                <strong>{activeAdministrators}</strong>
                <small>Enabled personnel</small>
              </div>
            </article>

            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon amber">
                <span>Ⅱ</span>
              </div>

              <div>
                <span>Inactive Accounts</span>
                <strong>{inactiveAdministrators}</strong>
                <small>Disabled personnel</small>
              </div>
            </article>
          </div>

          {/* PERSONNEL DIRECTORY */}
          <section className="admin-personnel-directory">
            <div className="admin-personnel-directory-heading">
              <div>
                <h3>Personnel Directory</h3>

                <p>
                  Search, review and monitor registered team members.
                </p>
              </div>

              <span className="admin-personnel-count">
                {administrators.length}{" "}
                {administrators.length === 1 ? "record" : "records"}
              </span>
            </div>

            {/* SEARCH AND FILTERS */}
            <form
              action="/admin/staff"
              method="GET"
              className="admin-personnel-filters"
            >
              <div className="admin-personnel-search">
                <span>⌕</span>

                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name or email..."
                  aria-label="Search personnel"
                />
              </div>

              <select
                name="role"
                defaultValue={validRole ?? ""}
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Administrator</option>
                <option value="STAFF">Staff</option>
              </select>

              <select
                name="status"
                defaultValue={validStatus ?? ""}
                aria-label="Filter by account status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button type="submit">
                Apply Filters
              </button>

              <Link href="/admin/staff">
                Clear
              </Link>
            </form>

            {/* DIRECTORY RESULTS */}
            {administrators.length === 0 ? (
              <div className="admin-personnel-empty">
                <span>♙</span>

                <h3>No personnel found</h3>

                <p>
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="admin-personnel-list">
                {administrators.map((admin) => (
                  <article
                    className="admin-personnel-card"
                    key={admin.id}
                  >
                    {/* AVATAR */}
                    <div className="admin-personnel-avatar">
                      {getInitials(admin.fullName)}
                    </div>

                    {/* CLICKABLE PERSONNEL IDENTITY */}
                    <div className="admin-personnel-identity">
                      <Link
                        href={`/admin/staff/${admin.id}`}
                        className="admin-personnel-profile-link"
                      >
                        <h4>{admin.fullName}</h4>

                        <p>{admin.email}</p>

                        <span>
                          View personnel profile →
                        </span>
                      </Link>

                      <span className="admin-personnel-mobile-date">
                        Registered {formatDate(admin.createdAt)}
                      </span>
                    </div>

                    {/* ROLE */}
                    <div className="admin-personnel-role">
                      <span
                        className={`role-${admin.role.toLowerCase()}`}
                      >
                        {formatRole(admin.role)}
                      </span>
                    </div>

                    {/* ACCOUNT STATUS */}
                    <div className="admin-personnel-account-status">
                      <span
                        className={
                          admin.isActive
                            ? "admin-personnel-status active"
                            : "admin-personnel-status inactive"
                        }
                      >
                        <i />
                        {admin.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* LAST LOGIN */}
                    <div className="admin-personnel-login">
                      <small>LAST LOGIN</small>
                      <span>
                        {formatDate(admin.lastLoginAt)}
                      </span>
                    </div>

                    {/* REGISTRATION DATE */}
                    <div className="admin-personnel-registered">
                      <small>DATE REGISTERED</small>
                      <span>
                        {formatDate(admin.createdAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="admin-personnel-directory-footer">
              Showing {administrators.length} of{" "}
              {totalAdministrators} registered personnel
            </div>
          </section>

          {/* FOOTER */}
          <footer className="admin-dashboard-footer">
            QUALITY. COMMITMENT. EXCELLENCE.

            <span>
              E-SERVICE HUB & DIGITAL CYBER © 2026
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function AdminStaffPage({
  searchParams,
}: StaffPageProps) {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <section className="admin-main">
            <p>Loading personnel directory...</p>
          </section>
        </main>
      }
    >
      <StaffPageContent searchParams={searchParams} />
    </Suspense>
  );
}
