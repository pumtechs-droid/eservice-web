
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

type HRPageProps = {
  searchParams: Promise<{
    q?: string;
    department?: string;
    status?: string;
  }>;
};

const employmentStatuses = [
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "INACTIVE",
] as const;

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

async function HRPageContent({ searchParams }: HRPageProps) {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  const currentAdmin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      isActive: true,
      role: true,
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
  const departmentId = params.department ?? "";
  const selectedStatus = params.status ?? "";

  const validStatus = employmentStatuses.includes(
    selectedStatus as (typeof employmentStatuses)[number]
  )
    ? (selectedStatus as (typeof employmentStatuses)[number])
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
              staffId: {
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
            {
              jobTitle: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(validStatus ? { employmentStatus: validStatus } : {}),
  };

  const [
    employees,
    totalEmployees,
    activeEmployees,
    employeesOnLeave,
    suspendedEmployees,
    inactiveEmployees,
    departments,
  ] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        department: {
          select: { name: true },
        },
        manager: {
          select: { fullName: true },
        },
      },
    }),

    prisma.employee.count(),

    prisma.employee.count({
      where: { employmentStatus: "ACTIVE" },
    }),

    prisma.employee.count({
      where: { employmentStatus: "ON_LEAVE" },
    }),

    prisma.employee.count({
      where: { employmentStatus: "SUSPENDED" },
    }),

    prisma.employee.count({
      where: { employmentStatus: "INACTIVE" },
    }),

    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: { employees: true },
        },
      },
    }),
  ]);

  const roleLabel = formatLabel(currentAdmin.role);

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

          <Link href="/admin/dashboard" className="admin-sidebar-link">
            <span>â–¦</span>
            Dashboard
          </Link>

          <Link href="/admin/requests" className="admin-sidebar-link">
            <span>â–¤</span>
            Service Requests
          </Link>

          <Link href="/admin/customers" className="admin-sidebar-link">
            <span>â™™</span>
            Customers
          </Link>

          <p className="admin-sidebar-heading">MANAGEMENT</p>

          <Link href="/admin/hr" className="admin-sidebar-link active">
            <span>â™§</span>
            HR & Employees
          </Link>

          <Link href="/admin/staff" className="admin-sidebar-link">
            <span>â™™</span>
            Staff & Administrators
          </Link>

          <Link href="/admin/analytics" className="admin-sidebar-link">
            <span>â–¥</span>
            Analytics & Reports
          </Link>

          <Link href="/admin/settings" className="admin-sidebar-link">
            <span>âš™</span>
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
              <small>{roleLabel}</small>
            </div>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="admin-logout-button">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>ADMINISTRATION / HUMAN RESOURCES</p>
            <h1>HR & Employees</h1>
          </div>

          <div className="admin-topbar-account">
            <span className="admin-status-dot" />
            <span>{roleLabel}</span>
          </div>
        </header>

        <div className="admin-personnel-page">
          <div className="admin-personnel-heading">
            <div>
              <span className="admin-personnel-eyebrow">
                WORKFORCE & ORGANISATION MANAGEMENT
              </span>
              <h2>Employee Directory</h2>
              <p>
                Manage employee records, departments, employment
                information and reporting relationships.
              </p>
            </div>

            <Link href="/admin/hr/new" className="admin-personnel-add-button">+ Register Employee</Link>
          </div>

          <div className="admin-personnel-stats">
            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon navy">â™™</div>
              <div>
                <span>Total Employees</span>
                <strong>{totalEmployees}</strong>
                <small>All employee records</small>
              </div>
            </article>

            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon green">âœ“</div>
              <div>
                <span>Active Employees</span>
                <strong>{activeEmployees}</strong>
                <small>Currently active</small>
              </div>
            </article>

            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon amber">â…¡</div>
              <div>
                <span>On Leave</span>
                <strong>{employeesOnLeave}</strong>
                <small>Approved or current leave status</small>
              </div>
            </article>
          </div>

          <div className="admin-personnel-stats">
            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon amber">!</div>
              <div>
                <span>Suspended</span>
                <strong>{suspendedEmployees}</strong>
                <small>Suspended employee records</small>
              </div>
            </article>

            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon navy">â€”</div>
              <div>
                <span>Inactive</span>
                <strong>{inactiveEmployees}</strong>
                <small>Inactive employee records</small>
              </div>
            </article>

            <article className="admin-personnel-stat">
              <div className="admin-personnel-stat-icon green">âŒ‚</div>
              <div>
                <span>Departments</span>
                <strong>{departments.length}</strong>
                <small>Active departments</small>
              </div>
            </article>
          </div>

          <section className="admin-personnel-directory">
            <div className="admin-personnel-directory-heading">
              <div>
                <h3>Workforce Directory</h3>
                <p>
                  Employee records are independent of administrator
                  login accounts.
                </p>
              </div>

              <span className="admin-personnel-count">
                {employees.length} {employees.length === 1 ? "record" : "records"}
              </span>
            </div>

            <form
              action="/admin/hr"
              method="GET"
              className="admin-personnel-filters"
            >
              <div className="admin-personnel-search">
                <span>âŒ•</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search name, staff ID, email or job title..."
                  aria-label="Search employees"
                />
              </div>

              <select
                name="department"
                defaultValue={departmentId}
                aria-label="Filter by department"
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={validStatus ?? ""}
                aria-label="Filter by employment status"
              >
                <option value="">All statuses</option>
                {employmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>

              <button type="submit">Apply Filters</button>
              <Link href="/admin/hr">Clear</Link>
            </form>

            {employees.length === 0 ? (
              <div className="admin-personnel-empty">
                <span>â™™</span>
                <h3>No employee records found</h3>
                <p>
                  {totalEmployees === 0
                    ? "Your employee directory is ready. Employee records will appear here once registered."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              <div className="admin-personnel-list">
                {employees.map((employee) => (
                  <article className="admin-personnel-card" key={employee.id}>
                    <div className="admin-personnel-avatar">
                      {employee.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={employee.photoUrl}
                          alt={employee.fullName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "13px",
                          }}
                        />
                      ) : (
                        getInitials(employee.fullName)
                      )}
                    </div>

                    <div className="admin-personnel-identity">
                      <h4>{employee.fullName}</h4>
                      <p>{employee.staffId} Â· {employee.email || employee.phone}</p>
                      <span className="admin-personnel-mobile-date">
                        Joined {formatDate(employee.joiningDate)}
                      </span>
                    </div>

                    <div className="admin-personnel-role">
                      <span>{employee.jobTitle}</span>
                    </div>

                    <div className="admin-personnel-account-status">
                      <span
                        className={`admin-personnel-status ${
                          employee.employmentStatus === "ACTIVE"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <i />
                        {formatLabel(employee.employmentStatus)}
                      </span>
                    </div>

                    <div className="admin-personnel-login">
                      <small>DEPARTMENT</small>
                      <span>{employee.department.name}</span>
                    </div>

                    <div className="admin-personnel-registered">
                      <small>REPORTING MANAGER</small>
                      <span>{employee.manager?.fullName || "Not assigned"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="admin-personnel-directory-footer">
              Showing {employees.length} of {totalEmployees} employee records
            </div>
          </section>

          <section className="admin-personnel-directory" style={{ marginTop: 24 }}>
            <div className="admin-personnel-directory-heading">
              <div>
                <h3>Department Overview</h3>
                <p>Active departments and their registered workforce.</p>
              </div>
            </div>

            <div className="admin-personnel-list">
              {departments.length === 0 ? (
                <div className="admin-personnel-empty">
                  <h3>No departments configured</h3>
                  <p>Departments will appear here once created.</p>
                </div>
              ) : (
                departments.map((department) => (
                  <article className="admin-personnel-card" key={department.id}>
                    <div className="admin-personnel-avatar">D</div>
                    <div className="admin-personnel-identity">
                      <h4>{department.name}</h4>
                      <p>Organisation department</p>
                    </div>
                    <div className="admin-personnel-role">
                      <span>{department._count.employees} employees</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <footer className="admin-dashboard-footer">
            QUALITY. COMMITMENT. EXCELLENCE.
            <span>E-SERVICE HUB & DIGITAL CYBER Â© 2026</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function AdminHRPage({ searchParams }: HRPageProps) {
  return (
    <Suspense
      fallback={
        <main className="admin-dashboard">
          <section className="admin-main">
            <p>Loading employee directory...</p>
          </section>
        </main>
      }
    >
      <HRPageContent searchParams={searchParams} />
    </Suspense>
  );
}


