import Link from "next/link";
import { redirect } from "next/navigation";

import CmsWorkspace from "./cms-workspace";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminCmsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const content = await prisma.cmsContent.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      body: true,
      status: true,
      updatedAt: true,
    },
  });

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

        <nav className="admin-sidebar-section" aria-label="Administration">
          <p className="admin-sidebar-heading">WORKSPACE</p>
          <Link href="/admin/dashboard" className="admin-sidebar-link">
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
            <span>♧</span> Staff &amp; Administrators
          </Link>
          <Link href="/admin/analytics" className="admin-sidebar-link">
            <span>▥</span> Analytics &amp; Reports
          </Link>
          <Link href="/admin/cms" className="admin-sidebar-link active">
            <span>◇</span> Content Management
          </Link>
          <Link href="/admin/settings" className="admin-sidebar-link">
            <span>⚙</span> Settings
          </Link>
        </nav>

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
            <p>ADMINISTRATION / MANAGEMENT</p>
            <h1>Content Management</h1>
          </div>
          <Link href="/cms" className="admin-view-all">
            View published content →
          </Link>
        </header>

        <CmsWorkspace
          adminName={admin.fullName}
          initialItems={content.map((item) => ({
            ...item,
            updatedAt: item.updatedAt.toISOString(),
          }))}
        />

        <footer className="admin-dashboard-footer">
          QUALITY. COMMITMENT. EXCELLENCE.
          <span>E-SERVICE HUB &amp; DIGITAL CYBER © 2026</span>
        </footer>
      </section>
    </main>
  );
}
