
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to sign in.");
      }

      setPassword("");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
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
          <div className="admin-login-icon">🔐</div>
          <p className="admin-login-eyebrow">
            SECURE ADMINISTRATION PORTAL
          </p>

          <h1>Administrator Sign In</h1>

          <p className="admin-login-description">
            Sign in using your authorised administrator credentials
            to access the E-SERVICE HUB management environment.
          </p>

          {errorMessage && (
            <div className="admin-login-error" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your administrator email"
              autoComplete="username"
              maxLength={254}
              required
              disabled={isLoading}
            />

            <label htmlFor="admin-password">Password</label>

            <div className="admin-password-wrapper">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                maxLength={128}
                required
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="admin-login-submit"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In Securely →"}
            </button>
          </form>

          <div className="admin-login-security">
            <span>🛡️</span>
            <p>
              This portal is restricted to authorised personnel.
              Never share your password or administrator session.
            </p>
          </div>
        </section>

        <Link href="/" className="admin-login-back">
          ← Return to public website
        </Link>

        <footer className="admin-login-footer">
          <p>QUALITY. COMMITMENT. EXCELLENCE.</p>
          <small>© 2026 E-SERVICE HUB & DIGITAL CYBER</small>
        </footer>
      </div>
    </main>
  );
}
