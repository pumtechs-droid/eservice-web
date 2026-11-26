"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PasswordChangeFormProps = {
  accountType: "admin" | "customer";
};

export default function PasswordChangeForm({
  accountType,
}: PasswordChangeFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = accountType === "admin";
  const loginPath = isAdmin ? "/admin/login" : "/customer/login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/${accountType}/password/change`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update your password.");
      }

      setPassword("");
      setConfirmation("");
      router.replace(isAdmin ? "/admin/dashboard" : "/customer/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your password."
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
            <small>{isAdmin ? "TEAM PORTAL" : "CUSTOMER PORTAL"}</small>
          </span>
        </Link>

        <section className="admin-login-card">
          <div className="admin-login-icon" aria-hidden="true">🔐</div>
          <p className="admin-login-eyebrow">ACCOUNT SECURITY</p>
          <h1>Choose a new password</h1>
          <p className="admin-login-description">
            For your security, you must set a new password before using your
            account. Use at least 8 characters.
          </p>

          {message && (
            <div className="admin-login-error" role="alert">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isLoading}
            />

            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isLoading}
            />

            <button
              type="submit"
              className="admin-login-submit"
              disabled={isLoading}
            >
              {isLoading ? "Updating password..." : "Set new password"}
            </button>
          </form>

          <Link href={loginPath} className="admin-password-reset-link">
            Return to sign in
          </Link>
        </section>
      </div>
    </main>
  );
}
