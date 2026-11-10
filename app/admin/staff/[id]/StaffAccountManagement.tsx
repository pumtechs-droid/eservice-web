
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AdminRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

type Props = {
  personnelId: string;
  personnelName: string;
  personnelEmail: string;
  personnelRole: AdminRole;
  personnelIsActive: boolean;
  currentAdminId: string;
  currentAdminRole: AdminRole;
};

export default function StaffAccountManagement({
  personnelId,
  personnelName,
  personnelEmail,
  personnelRole,
  personnelIsActive,
  currentAdminId,
  currentAdminRole,
}: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState(personnelName);
  const [email, setEmail] = useState(personnelEmail);
  const [role, setRole] = useState<AdminRole>(personnelRole);
  const [isActive, setIsActive] = useState(personnelIsActive);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isOwnAccount = currentAdminId === personnelId;

  const isSuperAdmin = currentAdminRole === "SUPER_ADMIN";

  const canManage =
    isSuperAdmin ||
    (currentAdminRole === "ADMIN" &&
      personnelRole === "STAFF");

  const canManageAccess = isSuperAdmin && !isOwnAccount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!canManage) {
      setError("You are not authorised to manage this account.");
      return;
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError("Full name must contain 2 to 100 characters.");
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      normalizedEmail.length > 254
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    const updateData: Record<string, unknown> = {
      fullName: normalizedName,
      email: normalizedEmail,
    };

    if (canManageAccess) {
      updateData.role = role;
      updateData.isActive = isActive;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/staff/${encodeURIComponent(personnelId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update personnel account."
        );
      }

      setMessage("Personnel account updated successfully.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="staff-management-panel">
      <div className="staff-management-heading">
        <div>
          <span>PERSONNEL ACCOUNT CONTROL</span>
          <h2>Manage Personnel Account</h2>
          <p>
            Update personnel information and manage authorised
            account access.
          </p>
        </div>

        <div className="staff-management-icon">⚙</div>
      </div>

      {!canManage && (
        <div className="staff-management-warning">
          You do not have permission to modify this personnel account.
        </div>
      )}

      {isOwnAccount && (
        <div className="staff-management-warning">
          You are viewing your own account. You cannot change
          your own role or account activation status.
        </div>
      )}

      <form
        className="staff-management-form"
        onSubmit={handleSubmit}
      >
        <div className="staff-management-fields">
          <div className="staff-management-field">
            <label htmlFor="personnel-full-name">
              Full Name
            </label>

            <input
              id="personnel-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={100}
              disabled={!canManage || loading}
              required
            />
          </div>

          <div className="staff-management-field">
            <label htmlFor="personnel-email">
              Email Address
            </label>

            <input
              id="personnel-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              disabled={!canManage || loading}
              required
            />
          </div>

          <div className="staff-management-field">
            <label htmlFor="personnel-role">
              Account Role
            </label>

            <select
              id="personnel-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as AdminRole)
              }
              disabled={!canManageAccess || loading}
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN" disabled>
                SUPER ADMIN
              </option>
            </select>

            <small>
              Only a Super Admin can change personnel roles.
            </small>
          </div>

          <div className="staff-management-field">
            <label htmlFor="personnel-status">
              Account Status
            </label>

            <select
              id="personnel-status"
              value={isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(event) =>
                setIsActive(event.target.value === "ACTIVE")
              }
              disabled={!canManageAccess || loading}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <small>
              Inactive personnel cannot access the administration
              system after their session is revalidated.
            </small>
          </div>
        </div>

        {message && (
          <div className="staff-management-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="staff-management-error" role="alert">
            {error}
          </div>
        )}

        <div className="staff-management-actions">
          <button
            type="submit"
            disabled={!canManage || loading}
          >
            {loading ? "Saving Changes..." : "Save Personnel Changes"}
          </button>
        </div>
      </form>

      <div className="staff-management-security">
        <strong>Security Notice</strong>
        <p>
          All account modifications are subject to server-side
          permission checks. The system protects the last active
          Super Admin account from demotion or deactivation.
        </p>
      </div>
    </section>
  );
}
