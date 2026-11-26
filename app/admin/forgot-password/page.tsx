"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/password/forgot", {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to request a reset link.");
      }

      setMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to request a reset link."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-container">
        <Link href="/" className="admin-login-brand">
          <span className="admin-brand-mark">ESH</span>
          <span>
            <strong>E-SERVICE HUB</strong>
            <small>& DIGITAL CYBER</small>
          </span>
        </Link>

        <section className="admin-login-card">
          <div className="admin-login-icon" aria-hidden="true">🔐</div>
          <p className="admin-login-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Forgot your password?</h1>
          <p className="admin-login-description">
            Request a one-time reset link for the super administrator account.
            It will be sent to aylatechs.hub@gmail.com and will expire after
            20 minutes.
          </p>

          {errorMessage && (
            <div className="admin-login-error" role="alert">
              {errorMessage}
            </div>
          )}
          {message && (
            <div className="admin-login-success" role="status">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="admin-login-submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending request..." : "Send password reset link"}
            </button>
          </form>
          <Link href="/admin/login" className="admin-password-reset-link">
            Return to administrator sign in
          </Link>
        </section>
      </div>
    </main>
  );
}
