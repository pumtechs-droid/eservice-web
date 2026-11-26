"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../portal.module.css";

type RequestOption = {
  id: string;
  reference: string;
  service: string;
  status: string;
};

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestOption[]>([]);
  const [requestId, setRequestId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    fetch("/api/customer/requests", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (response.status === 401) {
          router.replace("/customer/login");
          return null;
        }
        if (!response.ok) {
          throw new Error(result.message || "Unable to load your requests.");
        }
        return result as { requests: RequestOption[] };
      })
      .then((result) => {
        if (!result) return;
        setRequests(result.requests);
        if (result.requests[0]) setRequestId(result.requests[0].id);
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof Error && error.name === "AbortError"
            ? "Loading requests timed out. Please try again."
            : error instanceof Error
              ? error.message
              : "Unable to load your requests."
        );
      })
      .finally(() => {
        window.clearTimeout(timeout);
        setIsLoadingRequests(false);
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !requestId) return;

    setIsSubmitting(true);
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const endpoint =
        method === "MPESA"
          ? "/api/payments/mpesa/initiate"
          : "/api/payments/manual";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount,
          phone,
          method,
          transactionReference: reference,
        }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace("/customer/login");
        return;
      }
      if (!response.ok) {
        throw new Error(result.message || "Unable to process payment.");
      }
      setMessage(result.message || "Payment submitted for verification.");
    } catch (error) {
      setMessage(
        error instanceof Error && error.name === "AbortError"
          ? "Payment request timed out. Please check your connection and try again."
          : error instanceof Error
            ? error.message
            : "Unable to process payment."
      );
    } finally {
      window.clearTimeout(timeout);
      setIsSubmitting(false);
    }
  }

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
          <Link href="/customer/dashboard" className={styles.headerLink}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className={`${styles.content} ${styles.paymentLayout}`}>
        <p className={styles.eyebrow}>CUSTOMER PORTAL / PAYMENTS</p>
        <h1 className={styles.pageTitle}>Make a payment</h1>
        <p className={styles.subtitle}>
          Select the request this payment is for and enter the amount.
        </p>

        {message && (
          <p role="status" className={`${styles.notice} ${styles.noticeInfo}`}>
            {message}
          </p>
        )}

        {isLoadingRequests ? (
          <section className={`${styles.card} ${styles.paymentCard}`}>
            <p className={styles.subtitle}>Loading your service requests...</p>
          </section>
        ) : requests.length === 0 ? (
          <section className={`${styles.card} ${styles.paymentCard}`}>
            <div className={styles.emptyState}>
              <h2>No requests available for payment</h2>
              <p>Submit a service request first, then return here to pay.</p>
              <Link href="/request-service" className={styles.primaryLink}>
                Submit a service request →
              </Link>
            </div>
          </section>
        ) : (
          <section className={`${styles.card} ${styles.paymentCard}`}>
            <form onSubmit={submit} className={`${styles.form} ${styles.paymentForm}`}>
              <label className={styles.field}>
                Service request
                <select
                  value={requestId}
                  onChange={(event) => setRequestId(event.target.value)}
                  required
                >
                  {requests.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.reference} — {item.service}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                Payment method
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                >
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="MPESA">M-Pesa STK Push</option>
                </select>
              </label>

              <label className={styles.field}>
                Amount (KES)
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </label>

              {method === "MPESA" ? (
                <label className={styles.field}>
                  M-Pesa phone number
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="254..."
                    required
                  />
                </label>
              ) : (
                <label className={styles.field}>
                  Bank or transaction reference
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Enter your payment reference"
                  />
                </label>
              )}

              <p className={styles.paymentFootnote}>
                Bank transfers are submitted as pending until an administrator
                confirms the payment.
              </p>

              <button
                type="submit"
                disabled={isSubmitting || !requestId}
                className={styles.submitButton}
              >
                {isSubmitting ? "Processing..." : "Continue"}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
