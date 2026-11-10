"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type CustomerAccountManagementProps = {
  customerId: string;
  initialFullName: string;
  initialPhone: string;
  initialEmail: string | null;
};

export default function CustomerAccountManagement({
  customerId,
  initialFullName,
  initialPhone,
  initialEmail,
}: CustomerAccountManagementProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail ?? "");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(customerId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            phone,
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update customer account.");
      }

      setFullName(data.customer.fullName);
      setPhone(data.customer.phone);
      setEmail(data.customer.email ?? "");

      setSuccess("Customer account updated successfully.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the customer."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFullName(initialFullName);
    setPhone(initialPhone);
    setEmail(initialEmail ?? "");
    setSuccess("");
    setError("");
  }

  return (
    <section className="customer-management-card">
      <div className="customer-management-header">
        <div>
          <span className="customer-management-eyebrow">
            CUSTOMER ADMINISTRATION
          </span>

          <h2>Manage Customer Account</h2>

          <p>
            Update the customer&apos;s contact information and account
            details.
          </p>
        </div>

        <span className="customer-management-icon">✎</span>
      </div>

      {success && (
        <div className="customer-management-alert success">
          {success}
        </div>
      )}

      {error && (
        <div className="customer-management-alert error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="customer-management-form">
        <div className="customer-management-field">
          <label htmlFor="customer-full-name">Full Name</label>

          <input
            id="customer-full-name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Enter customer's full name"
            minLength={2}
            maxLength={120}
            required
          />
        </div>

        <div className="customer-management-field">
          <label htmlFor="customer-phone">Phone Number</label>

          <input
            id="customer-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter phone number"
            minLength={7}
            maxLength={30}
            required
          />
        </div>

        <div className="customer-management-field">
          <label htmlFor="customer-email">Email Address</label>

          <input
            id="customer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email address (optional)"
            maxLength={254}
          />

          <small>
            Leave blank if the customer does not have an email address.
          </small>
        </div>

        <div className="customer-management-actions">
          <button
            type="button"
            className="customer-management-reset"
            onClick={resetForm}
            disabled={loading}
          >
            Reset Changes
          </button>

          <button
            type="submit"
            className="customer-management-save"
            disabled={loading}
          >
            {loading ? "Saving Changes..." : "Save Customer Changes"}
          </button>
        </div>
      </form>

      <div className="customer-management-security">
        <strong>Administrative Notice</strong>
        <p>
          Changes update the customer&apos;s contact information only.
          Existing service requests and their activity histories remain
          unchanged.
        </p>
      </div>
    </section>
  );
}