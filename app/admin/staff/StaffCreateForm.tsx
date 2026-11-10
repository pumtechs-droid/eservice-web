
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AdminRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

type Props = {
  currentRole: AdminRole;
};

export default function StaffCreateForm({ currentRole }: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to create personnel account."
        );
      }

      setSuccess("Personnel account created successfully.");
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      setShowPassword(false);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="personnel-create-card">
      <div className="personnel-create-card-header">
        <div>
          <span className="personnel-form-eyebrow">
            NEW ACCOUNT REGISTRATION
          </span>
          <h2>Account Information</h2>
          <p>
            Enter the details below to register a new team member.
          </p>
        </div>

        <div className="personnel-create-icon">
          <span>+</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="personnel-create-form">
        <div className="personnel-form-grid">
          <div className="personnel-field">
            <label htmlFor="staffFullName">
              Full Name <span>*</span>
            </label>

            <input
              id="staffFullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter the team member's full name"
              minLength={2}
              maxLength={100}
              autoComplete="name"
              required
            />
          </div>

          <div className="personnel-field">
            <label htmlFor="staffEmail">
              Official Email Address <span>*</span>
            </label>

            <input
              id="staffEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              maxLength={254}
              autoComplete="email"
              required
            />
          </div>

          <div className="personnel-field personnel-field-full">
            <label htmlFor="staffPassword">
              Temporary Password <span>*</span>
            </label>

            <div className="personnel-password-wrapper">
              <input
                id="staffPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a strong temporary password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="personnel-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <small>
              Minimum 12 characters. Use a unique password and
              communicate it securely to the account holder.
            </small>
          </div>

          <div className="personnel-field personnel-field-full">
            <label htmlFor="staffRole">
              Account Role <span>*</span>
            </label>

            <select
              id="staffRole"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "ADMIN" | "STAFF")
              }
              required
            >
              <option value="STAFF">Staff Member</option>

              {currentRole === "SUPER_ADMIN" && (
                <option value="ADMIN">Administrator</option>
              )}
            </select>

            <small>
              {currentRole === "SUPER_ADMIN"
                ? "Choose the appropriate access level for this team member."
                : "Your account is authorised to create Staff accounts only."}
            </small>
          </div>
        </div>

        {error && (
          <div className="personnel-form-alert error" role="alert">
            <strong>Account Registration Failed</strong>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="personnel-form-alert success" role="status">
            <strong>Registration Successful</strong>
            <p>{success}</p>
            <button
              type="button"
              onClick={() => router.push("/admin/staff")}
            >
              View Personnel Directory →
            </button>
          </div>
        )}

        <div className="personnel-form-actions">
          <button
            type="submit"
            className="personnel-submit-button"
            disabled={loading}
          >
            {loading ? (
              "Creating Account..."
            ) : (
              <>
                Create Account <span>→</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="personnel-reset-button"
            disabled={loading}
            onClick={() => {
              setFullName("");
              setEmail("");
              setPassword("");
              setRole("STAFF");
              setError("");
              setSuccess("");
              setShowPassword(false);
            }}
          >
            Clear Form
          </button>
        </div>
      </form>
    </section>
  );
}
