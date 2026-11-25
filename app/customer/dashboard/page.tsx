import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-auth";

export const instant = false;

export default async function CustomerDashboardPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/customer/login");

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    include: {
      requests: {
        orderBy: { createdAt: "desc" },
        include: {
          quotations: { orderBy: { createdAt: "desc" } },
          payments: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!customer || !customer.isActive) redirect("/customer/login");

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <header className="bg-[#061B42] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-bold">E-SERVICE HUB <span className="text-[#F4BD32]">&amp; DIGITAL CYBER</span></Link>
          <form action="/api/customer/logout" method="POST"><button className="rounded-lg border border-white/30 px-4 py-2 text-sm">Sign Out</button></form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-bold tracking-widest text-[#9A7414]">CUSTOMER PORTAL</p>
        <h1 className="mt-2 text-3xl font-bold text-[#061B42]">Welcome, {customer.fullName}</h1>
        <Link href="/customer/payments" className="mt-5 inline-block rounded-lg bg-[#061B42] px-5 py-3 text-sm font-bold text-white">Make a Payment</Link>
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border bg-white p-5"><span className="text-sm text-slate-500">Total requests</span><strong className="mt-2 block text-3xl text-[#061B42]">{customer.requests.length}</strong></article>
          <article className="rounded-xl border bg-white p-5"><span className="text-sm text-slate-500">Active requests</span><strong className="mt-2 block text-3xl text-[#061B42]">{customer.requests.filter((request) => !["COMPLETED", "CANCELLED"].includes(request.status)).length}</strong></article>
          <article className="rounded-xl border bg-white p-5"><span className="text-sm text-slate-500">Confirmed payments</span><strong className="mt-2 block text-3xl text-[#061B42]">{customer.requests.flatMap((request) => request.payments).filter((payment) => payment.status === "CONFIRMED").length}</strong></article>
        </section>
        <section className="mt-8 space-y-4">
          {customer.requests.length === 0 && (
            <div className="rounded-xl border bg-white p-8 text-center"><h2 className="text-xl font-bold text-[#061B42]">No service requests yet</h2><Link href="/request-service" className="mt-5 inline-block rounded-lg bg-[#061B42] px-5 py-3 font-bold text-white">Submit a Request</Link></div>
          )}
          {customer.requests.map((request) => (
            <article key={request.id} className="rounded-xl border bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-bold text-slate-500">{request.reference}</p><h2 className="mt-1 text-xl font-bold text-[#061B42]">{request.service}</h2><p className="text-sm text-slate-600">{request.department}</p></div>
                <span className="rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-bold text-[#806000]">{request.status.replaceAll("_", " ")}</span>
              </div>
              {request.quotations.length > 0 && <div className="mt-5 border-t pt-4"><strong className="text-sm">Latest quotation</strong>{request.quotations.slice(0, 1).map((quotation) => <p key={quotation.id} className="mt-1 text-sm text-slate-600">{quotation.quotationNumber} — {quotation.currency} {Number(quotation.amount).toLocaleString()} · {quotation.status}</p>)}</div>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
