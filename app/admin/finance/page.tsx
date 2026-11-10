
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

async function FinanceDashboardContent() {
  const session = await getAdminSession();

  if (!session) redirect("/admin/login");

  const currentAdmin = await prisma.adminUser.findUnique({
    where: { id: session.id },
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

  const [
    totalQuotations,
    acceptedQuotations,
    pendingQuotations,
    totalPayments,
    pendingPayments,
    confirmedPayments,
    failedPayments,
    refundedPayments,
    revenueAggregate,
    pendingAggregate,
    recentPayments,
    recentQuotations,
    acceptedQuotationAmounts,
    confirmedPaymentAmounts,
  ] = await Promise.all([
    prisma.serviceQuotation.count(),
    prisma.serviceQuotation.count({
      where: { status: "ACCEPTED" },
    }),
    prisma.serviceQuotation.count({
      where: { status: "SENT" },
    }),
    prisma.payment.count(),
    prisma.payment.count({
      where: { status: "PENDING" },
    }),
    prisma.payment.count({
      where: { status: "CONFIRMED" },
    }),
    prisma.payment.count({
      where: { status: "FAILED" },
    }),
    prisma.payment.count({
      where: { status: "REFUNDED" },
    }),
    prisma.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        transactionReference: true,
        createdAt: true,
        request: {
          select: {
            reference: true,
            service: true,
            customer: {
              select: { fullName: true },
            },
          },
        },
      },
    }),
    prisma.serviceQuotation.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        quotationNumber: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        request: {
          select: {
            reference: true,
            service: true,
            customer: {
              select: { fullName: true },
            },
          },
        },
      },
    }),
    prisma.serviceQuotation.findMany({
      where: { status: "ACCEPTED" },
      select: {
        requestId: true,
        amount: true,
      },
    }),
    prisma.payment.findMany({
      where: { status: "CONFIRMED" },
      select: {
        requestId: true,
        amount: true,
      },
    }),
  ]);

  const totalRevenue = Number(revenueAggregate._sum.amount ?? 0);
  const pendingPaymentAmount = Number(pendingAggregate._sum.amount ?? 0);

  const quotationTotals = new Map<string, number>();
  const paymentTotals = new Map<string, number>();

  for (const quotation of acceptedQuotationAmounts) {
    quotationTotals.set(
      quotation.requestId,
      (quotationTotals.get(quotation.requestId) ?? 0) +
        Number(quotation.amount)
    );
  }

  for (const payment of confirmedPaymentAmounts) {
    paymentTotals.set(
      payment.requestId,
      (paymentTotals.get(payment.requestId) ?? 0) +
        Number(payment.amount)
    );
  }

  let outstandingBalance = 0;

  for (const [requestId, quotedAmount] of quotationTotals) {
    const paidAmount = paymentTotals.get(requestId) ?? 0;
    outstandingBalance += Math.max(0, quotedAmount - paidAmount);
  }

  const adminInitial = currentAdmin.fullName
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="staff-management-layout finance-workspace">
      <aside className="staff-management-sidebar">
        <Link href="/admin/dashboard" className="staff-sidebar-brand">
          <span className="staff-sidebar-logo">ESH</span>
          <span>
            <strong>E-SERVICE HUB</strong>
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <div className="staff-sidebar-label">WORKSPACE</div>

        <nav className="staff-sidebar-nav">
          <Link href="/admin/dashboard">
            <span>▦</span> Dashboard
          </Link>
          <Link href="/admin/requests">
            <span>▤</span> Service Requests
          </Link>
          <Link href="/admin/customers">
            <span>♙</span> Customers
          </Link>
        </nav>

        <div className="staff-sidebar-label">MANAGEMENT</div>

        <nav className="staff-sidebar-nav">
          <Link href="/admin/staff">
            <span>♧</span> Staff & Administrators
          </Link>
          <Link href="/admin/finance" className="active">
            <span>▣</span> Financial Management
          </Link>
          <Link href="/admin/analytics">
            <span>▥</span> Analytics & Reports
          </Link>
          <Link href="/admin/settings">
            <span>⚙</span> Settings
          </Link>
        </nav>

        <div className="staff-sidebar-account">
          <span className="finance-workspace-avatar">{adminInitial}</span>
          <div>
            <strong>{currentAdmin.fullName}</strong>
            <small>{currentAdmin.role.replaceAll("_", " ")}</small>
          </div>
        </div>
      </aside>

      <section className="staff-management-main">
        <header className="staff-management-topbar">
          <div>
            <strong>Financial Management</strong>
            <span className="staff-topbar-role">
              {currentAdmin.role.replaceAll("_", " ")}
            </span>
          </div>

          <form action="/api/admin/logout" method="POST">
            <button type="submit">Sign Out <span>→</span></button>
          </form>
        </header>

        <div className="staff-management-content finance-workspace-content">
          <section className="staff-page-heading finance-workspace-heading">
            <div>
              <span className="staff-page-eyebrow">
                WORKSPACE / FINANCE & ACCOUNTING
              </span>
              <h1>Financial Overview</h1>
              <p>
                Monitor quotations, payments, revenue and outstanding
                customer balances from one central workspace.
              </p>
            </div>

            <div className="finance-workspace-date">
              <span>REPORTING DATE</span>
              <strong>{formatDate(new Date())}</strong>
            </div>
          </section>

          <section className="finance-workspace-primary">
            <article className="finance-workspace-primary-card finance-revenue-card">
              <div className="finance-workspace-card-top">
                <span>CONFIRMED REVENUE</span>
                <span className="finance-workspace-icon">↗</span>
              </div>
              <strong>{formatCurrency(totalRevenue)}</strong>
              <small>{confirmedPayments} confirmed payments</small>
              <div className="finance-workspace-card-foot">
                Recorded confirmed payments
              </div>
            </article>

            <article className="finance-workspace-primary-card finance-outstanding-card">
              <div className="finance-workspace-card-top">
                <span>OUTSTANDING BALANCES</span>
                <span className="finance-workspace-icon">◷</span>
              </div>
              <strong>{formatCurrency(outstandingBalance)}</strong>
              <small>Accepted quotations less confirmed payments</small>
              <div className="finance-workspace-card-foot">
                Estimated amount yet to be collected
              </div>
            </article>

            <article className="finance-workspace-primary-card finance-pending-card">
              <div className="finance-workspace-card-top">
                <span>PENDING PAYMENTS</span>
                <span className="finance-workspace-icon">⌛</span>
              </div>
              <strong>{formatCurrency(pendingPaymentAmount)}</strong>
              <small>{pendingPayments} awaiting confirmation</small>
              <div className="finance-workspace-card-foot">
                Payments awaiting verification
              </div>
            </article>
          </section>

          <section className="finance-workspace-section">
            <div className="finance-workspace-section-heading">
              <div>
                <span>FINANCIAL PERFORMANCE</span>
                <h2>Account Statistics</h2>
                <p>A snapshot of recorded quotations and payments.</p>
              </div>
            </div>

            <div className="finance-workspace-stat-grid">
              <article>
                <span>Total Quotations</span>
                <strong>{totalQuotations}</strong>
                <small>All recorded quotations</small>
              </article>
              <article>
                <span>Accepted Quotations</span>
                <strong>{acceptedQuotations}</strong>
                <small>Approved service quotations</small>
              </article>
              <article>
                <span>Sent Quotations</span>
                <strong>{pendingQuotations}</strong>
                <small>Awaiting customer response</small>
              </article>
              <article>
                <span>Total Payments</span>
                <strong>{totalPayments}</strong>
                <small>All payment records</small>
              </article>
              <article>
                <span>Failed Payments</span>
                <strong>{failedPayments}</strong>
                <small>Payments not completed</small>
              </article>
              <article>
                <span>Refunded Payments</span>
                <strong>{refundedPayments}</strong>
                <small>Recorded refunds</small>
              </article>
            </div>
          </section>

          <section className="finance-workspace-section">
            <div className="finance-workspace-section-heading">
              <div>
                <span>FINANCIAL OPERATIONS</span>
                <h2>Finance Workspace</h2>
                <p>Access the tools for managing your financial operations.</p>
              </div>
            </div>

            <div className="finance-workspace-tools">
              <Link href="/admin/finance/quotations">
                <span className="finance-workspace-tool-icon">▤</span>
                <strong>Service Quotations</strong>
                <small>Create and manage customer quotations.</small>
                <b>Open Quotations <span>→</span></b>
              </Link>

              <Link href="/admin/finance/payments">
                <span className="finance-workspace-tool-icon">▣</span>
                <strong>Payment Management</strong>
                <small>Record and monitor customer payments.</small>
                <b>Open Payments <span>→</span></b>
              </Link>

              <Link href="/admin/finance/transactions">
                <span className="finance-workspace-tool-icon">⇄</span>
                <strong>Transactions</strong>
                <small>Review financial transaction records.</small>
                <b>View Transactions <span>→</span></b>
              </Link>

              <Link href="/admin/finance/reports">
                <span className="finance-workspace-tool-icon">▥</span>
                <strong>Financial Reports</strong>
                <small>Review financial performance and summaries.</small>
                <b>View Reports <span>→</span></b>
              </Link>
            </div>
          </section>

          <section className="finance-workspace-section">
            <div className="finance-workspace-section-heading finance-workspace-table-heading">
              <div>
                <span>PAYMENT ACTIVITY</span>
                <h2>Recent Payments</h2>
                <p>The latest recorded customer payments.</p>
              </div>
              <Link href="/admin/finance/payments">View All <span>→</span></Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="finance-workspace-empty">
                <span>▣</span>
                <strong>No payments recorded yet</strong>
                <p>Customer payments will appear here when records are created.</p>
              </div>
            ) : (
              <div className="finance-workspace-table-wrap">
                <table className="finance-workspace-table">
                  <thead>
                    <tr>
                      <th>RECEIPT</th>
                      <th>CUSTOMER</th>
                      <th>SERVICE REQUEST</th>
                      <th>METHOD</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td><strong>{payment.receiptNumber}</strong></td>
                        <td>{payment.request.customer.fullName}</td>
                        <td>{payment.request.reference}</td>
                        <td>{formatStatus(payment.method)}</td>
                        <td><strong>{formatCurrency(Number(payment.amount))}</strong></td>
                        <td>
                          <span className={`finance-workspace-status status-${payment.status.toLowerCase()}`}>
                            {formatStatus(payment.status)}
                          </span>
                        </td>
                        <td>{formatDate(payment.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="finance-workspace-section">
            <div className="finance-workspace-section-heading finance-workspace-table-heading">
              <div>
                <span>QUOTATION ACTIVITY</span>
                <h2>Recent Quotations</h2>
                <p>The latest quotations prepared for customers.</p>
              </div>
              <Link href="/admin/finance/quotations">View All <span>→</span></Link>
            </div>

            {recentQuotations.length === 0 ? (
              <div className="finance-workspace-empty">
                <span>▤</span>
                <strong>No quotations created yet</strong>
                <p>New service quotations will appear here.</p>
              </div>
            ) : (
              <div className="finance-workspace-table-wrap">
                <table className="finance-workspace-table">
                  <thead>
                    <tr>
                      <th>QUOTATION</th>
                      <th>CUSTOMER</th>
                      <th>SERVICE REQUEST</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuotations.map((quotation) => (
                      <tr key={quotation.id}>
                        <td><strong>{quotation.quotationNumber}</strong></td>
                        <td>{quotation.request.customer.fullName}</td>
                        <td>{quotation.request.reference}</td>
                        <td><strong>{formatCurrency(Number(quotation.amount))}</strong></td>
                        <td>
                          <span className={`finance-workspace-status status-${quotation.status.toLowerCase()}`}>
                            {formatStatus(quotation.status)}
                          </span>
                        </td>
                        <td>{formatDate(quotation.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="staff-management-footer finance-workspace-footer">
            <span>E-SERVICE HUB & DIGITAL CYBER</span>
            <span>QCE — Quality. Commitment. Excellence.</span>
            <span>Financial Management Workspace</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default function FinanceDashboardPage() {
  return (
    <Suspense fallback={<main className="admin-loading">Loading financial dashboard...</main>}>
      <FinanceDashboardContent />
    </Suspense>
  );
}
