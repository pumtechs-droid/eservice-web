"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    const token = window.location.hash.slice(1);
    if (!token) {
      setErrorMessage("This password reset link is invalid or incomplete.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to reset the password.");
      }

      setPassword("");
      setConfirmPassword("");
      window.history.replaceState(
        null,
        "",
        "/admin/reset-password?completed=1"
      );
      setSuccessMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset the password."
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
          <p className="admin-login-eyebrow">SECURE ACCOUNT RECOVERY</p>
          <h1>Set a new password</h1>
          <p className="admin-login-description">
            Use at least 12 characters. Reset links expire after 20 minutes and
            can only be used once.
          </p>

          {errorMessage && (
            <div className="admin-login-error" role="alert">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="admin-login-success" role="status">
              {successMessage}
              {" "}
              <Link href="/admin/login">Continue to sign in</Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="admin-new-password">New password</label>
            <input
              id="admin-new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              disabled={isLoading || Boolean(successMessage)}
            />

            <label htmlFor="admin-confirm-password">
              Confirm new password
            </label>
            <input
              id="admin-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              disabled={isLoading || Boolean(successMessage)}
            />

            <button
              type="submit"
              className="admin-login-submit"
              disabled={isLoading || Boolean(successMessage)}
            >
              {isLoading ? "Updating password..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
