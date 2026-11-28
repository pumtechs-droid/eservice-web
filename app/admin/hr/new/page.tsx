import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import EmployeeCreateForm from "../EmployeeCreateForm";
export const instant = false;
export default async function NewEmployeePage() {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.id },
    select: { isActive: true, role: true },
  });

  if (!admin?.isActive) redirect("/admin/login");

  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
    redirect("/admin/dashboard");
  }

  const [departments, managers] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.employee.findMany({
      where: { employmentStatus: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, staffId: true },
    }),
  ]);

  return (
    <main className="admin-dashboard">
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p>ADMINISTRATION / HUMAN RESOURCES</p>
            <h1>Register Employee</h1>
          </div>
          <Link href="/admin/hr">Back to Employee Directory</Link>
        </header>

        <div className="admin-personnel-page">
          <div className="admin-personnel-heading">
            <div>
              <span className="admin-personnel-eyebrow">
                HUMAN RESOURCE MANAGEMENT
              </span>
              <h2>New Employee Registration</h2>
              <p>
                Create an employee record. This does not create an
                administrator login account.
              </p>
            </div>
          </div>

          {departments.length === 0 ? (
            <section className="admin-personnel-directory">
              <h3>No active departments available</h3>
              <p>
                Create and activate a department before registering
                an employee.
              </p>
            </section>
          ) : (
            <EmployeeCreateForm
              departments={departments}
              managers={managers}
            />
          )}
        </div>
      </section>
    </main>
  );
}
