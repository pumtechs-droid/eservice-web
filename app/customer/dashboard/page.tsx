import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "../portal.module.css";
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

  const activeRequests = customer.requests.filter(
    (request) => !["COMPLETED", "CANCELLED"].includes(request.status)
  ).length;
  const confirmedPayments = customer.requests
    .flatMap((request) => request.payments)
    .filter((payment) => payment.status === "CONFIRMED").length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandIcon}>ESH</span>
            <span className={styles.brandText}>
              E-SERVICE HUB
              <small>&amp; DIGITAL CYBER</small>
            </span>
          </Link>
          <div className={styles.headerActions}>
            <Link href="/customer/payments" className={styles.headerLink}>
              Payments
            </Link>
            <form action="/api/customer/logout" method="POST">
              <button type="submit" className={styles.headerButton}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.welcome}>
          <div>
            <p className={styles.eyebrow}>CUSTOMER PORTAL</p>
            <h1>Welcome back, {customer.fullName}</h1>
            <p>Here is the latest activity on your service requests.</p>
          </div>
          <Link href="/request-service" className={styles.primaryLink}>
            New service request <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={styles.statGrid} aria-label="Account overview">
          <article className={styles.statCard}>
            <span>Total requests</span>
            <strong>{customer.requests.length}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Active requests</span>
            <strong>{activeRequests}</strong>
          </article>
          <article className={styles.statCard}>
            <span>Confirmed payments</span>
            <strong>{confirmedPayments}</strong>
          </article>
        </section>

        <section>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>YOUR ACTIVITY</p>
              <h2>Service requests</h2>
              <p>Track progress, quotations and payment status.</p>
            </div>
          </div>

          {customer.requests.length > 0 ? (
            <div className={styles.requestList}>
              {customer.requests.map((request) => (
                <article key={request.id} className={styles.requestCard}>
                  <div className={styles.requestTop}>
                    <div>
                      <p className={styles.requestReference}>{request.reference}</p>
                      <h3>{request.service}</h3>
                      <p className={styles.requestDepartment}>{request.department}</p>
                    </div>
                    <span className={styles.status}>
                      {request.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  {(request.quotations.length > 0 ||
                    request.payments.length > 0) && (
                    <div className={styles.quoteList}>
                      {request.quotations.slice(0, 1).map((quotation) => (
                        <div key={quotation.id} className={styles.quote}>
                          <span>
                            Quotation <strong>{quotation.quotationNumber}</strong>
                          </span>
                          <span>
                            <strong>
                              {quotation.currency}{" "}
                              {Number(quotation.amount).toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                              })}
                            </strong>{" "}
                            · {quotation.status.toLowerCase()}
                          </span>
                        </div>
                      ))}
                      {request.payments.slice(0, 1).map((payment) => (
                        <div key={payment.id} className={styles.quote}>
                          <span>Payment {payment.receiptNumber}</span>
                          <span>
                            {payment.currency}{" "}
                            {Number(payment.amount).toLocaleString("en-KE", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            · {payment.status.toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.requestMeta}>
                    <span>Request updated {request.updatedAt.toLocaleDateString("en-KE")}</span>
                    {request.payments.some((payment) => payment.status === "PENDING") && (
                      <Link href="/customer/payments" className={styles.headerLink}>
                        Review payment status →
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h2>No service requests yet</h2>
              <p>Your requests and their updates will appear here.</p>
              <Link href="/request-service" className={styles.primaryLink}>
                Submit a service request →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
