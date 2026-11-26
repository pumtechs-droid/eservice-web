"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../portal.module.css";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(`/api/customer/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, password }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to continue.");
      router.replace(
        result.mustChangePassword
          ? "/customer/change-password"
          : "/customer/dashboard"
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error && error.name === "AbortError"
          ? "The portal is taking too long to respond. Please try again shortly."
          : error instanceof Error
            ? error.message
            : "Unable to continue."
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
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
          <Link href="/" className={styles.headerLink}>Back to website</Link>
        </div>
      </header>

      <div className={`${styles.content} ${styles.loginLayout}`}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>CUSTOMER PORTAL</p>
          <h1 className={styles.pageTitle}>Your services, all in one place.</h1>
          <p className={styles.subtitle}>
            Follow your requests, review quotations and keep track of payments
            through your secure customer account.
          </p>
          <div className={styles.introBadge}>
            <span aria-hidden="true">✓</span>
            <span>Fast, reliable support with updates at every step.</span>
          </div>
        </section>

        <section className={styles.loginCard}>
          <p className={styles.eyebrow}>WELCOME</p>
          <h2 className={styles.cardHeading}>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className={styles.cardDescription}>
            {mode === "login"
              ? "Enter the email and password you registered with."
              : "Use the same email address you gave with your service request."}
          </p>

          <div className={styles.tabs} role="tablist" aria-label="Account options">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => { setMode("login"); setMessage(""); }}
              className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => { setMode("register"); setMessage(""); }}
              className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
            >
              Create Account
            </button>
          </div>

          {message && (
            <p role="alert" className={`${styles.notice} ${styles.noticeError}`}>
              {message}
            </p>
          )}

          <form onSubmit={submit} className={styles.form}>
          {mode === "register" && (
            <>
              <label className={styles.field}>
                Full name
                <input
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={120}
                  required
                />
              </label>
              <label className={styles.field}>
                Phone number
                <input
                  autoComplete="tel"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={20}
                  required
                />
              </label>
            </>
          )}

            <label className={styles.field}>
              Email address
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
            </label>

            <label className={styles.field}>
              Password
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                minLength={mode === "register" ? 8 : undefined}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {mode === "register" && (
                <small className={styles.passwordHint}>Use at least 8 characters.</small>
              )}
            </label>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading
                ? "Connecting..."
                : mode === "login"
                  ? "Sign in securely"
                  : "Create customer account"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className={styles.finePrint}>
            Your account is private. We will only show requests linked to your
            registered email address.
          </p>
        </section>
      </div>
    </main>
  );
}
