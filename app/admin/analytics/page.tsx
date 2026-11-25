import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const instant = false;

export default async function AnalyticsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const admin = await prisma.adminUser.findUnique({ where: { id: session.id }, select: { role: true, isActive: true } });
  if (!admin || !admin.isActive) redirect("/admin/login");

  const [requests, customers, quotations, payments, staff] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.customer.count(),
    prisma.serviceQuotation.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "CONFIRMED" } }),
    prisma.adminUser.count({ where: { isActive: true } }),
  ]);

  const cards = [
    ["Service requests", requests],
    ["Customers", customers],
    ["Quotations", quotations],
    ["Active staff", staff],
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/dashboard" className="text-sm text-slate-500">← Dashboard</Link>
        <h1 className="mt-2 text-3xl font-bold text-[#061B42]">Analytics &amp; Reports</h1>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => <article key={String(label)} className="rounded-xl border bg-white p-6"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-3xl text-[#061B42]">{String(value)}</strong></article>)}
        </div>
        <article className="mt-5 rounded-xl border bg-white p-6">
          <p className="text-sm text-slate-500">Confirmed payment value</p>
          <strong className="mt-2 block text-3xl text-[#061B42]">KES {Number(payments._sum.amount ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</strong>
        </article>
      </div>
    </main>
  );
}
