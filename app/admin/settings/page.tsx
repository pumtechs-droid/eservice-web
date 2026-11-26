import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import {
  getTransactionalEmailProviderLabel,
  isTransactionalEmailConfigured,
  SUPER_ADMIN_EMAIL,
} from "@/lib/email";
import { MPESA_TILL_NUMBER } from "@/lib/payment-config";

export const instant = false;

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const admin = await prisma.adminUser.findUnique({ where: { id: session.id }, select: { role: true, isActive: true, fullName: true, email: true } });
  if (!admin || !admin.isActive) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") redirect("/admin/dashboard");

  const mailConfigured = isTransactionalEmailConfigured();
  const integrationStatus = [
    ["Database", Boolean(process.env.DATABASE_URL), "PostgreSQL"],
    ["Transactional email", mailConfigured, getTransactionalEmailProviderLabel()],
    ["Super-admin alerts", mailConfigured, SUPER_ADMIN_EMAIL],
    ["Notification retries", Boolean(process.env.CRON_SECRET), "Daily Vercel Cron"],
    ["M-Pesa Till", true, `Till ${MPESA_TILL_NUMBER}`],
    ["M-Pesa", Boolean(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_SHORTCODE), "Daraja"],
  ];

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/dashboard" className="text-sm text-slate-500">← Dashboard</Link>
        <h1 className="mt-2 text-3xl font-bold text-[#061B42]">System Settings</h1>
        <section className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-bold text-[#061B42]">Administrator</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Name</dt><dd className="font-semibold">{admin.fullName}</dd></div><div><dt className="text-sm text-slate-500">Email</dt><dd className="font-semibold">{admin.email}</dd></div></dl>
        </section>
        <section className="mt-5 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-bold text-[#061B42]">Integration Status</h2>
          <div className="mt-4 space-y-3">
            {integrationStatus.map(([label, configured, provider]) => <div key={String(label)} className="flex items-center justify-between rounded-lg border px-4 py-3"><div><strong>{label}</strong><p className="text-xs text-slate-500">{provider}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${configured ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{configured ? "Configured" : "Action required"}</span></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
