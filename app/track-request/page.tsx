
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

type RequestStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "QUOTED"
  | "AWAITING_PAYMENT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TrackedRequest = {
  reference: string;
  department: string;
  service: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

const statusSteps: {
  value: Exclude<RequestStatus, "CANCELLED">;
  label: string;
  description: string;
}[] = [
  {
    value: "NEW",
    label: "Request Received",
    description: "Your request has been successfully submitted.",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
    description: "Our team is reviewing your requirements.",
  },
  {
    value: "QUOTED",
    label: "Quotation Prepared",
    description: "Your service quotation has been prepared.",
  },
  {
    value: "AWAITING_PAYMENT",
    label: "Awaiting Payment",
    description: "Your request is awaiting payment confirmation.",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    description: "Our team is working on your request.",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Your service request has been completed.",
  },
];

function formatStatus(status: RequestStatus) {
  if (status === "CANCELLED") return "Cancelled";

  return statusSteps.find((step) => step.value === status)?.label ?? status;
}

export default function TrackRequestPage() {
  const [reference, setReference] = useState("");
  const [trackedRequest, setTrackedRequest] =
    useState<TrackedRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) return;

    const cleanReference = reference.trim().toUpperCase();

    setReference(cleanReference);
    setTrackedRequest(null);
    setErrorMessage("");

    if (!/^ESH-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(cleanReference)) {
      setErrorMessage(
        "Please enter a valid ESH reference number."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/requests?reference=${encodeURIComponent(cleanReference)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to find your service request."
        );
      }

      setTrackedRequest(result.request as TrackedRequest);
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

  const currentStatusIndex = trackedRequest
    ? statusSteps.findIndex(
        (step) => step.value === trackedRequest.status
      )
    : -1;

  return (
    <main className="tracking-page">
      <header className="tracking-header">
        <Link href="/" className="tracking-brand">
          <span className="tracking-brand-mark">ESH</span>
          <span>
            <strong>E-SERVICE HUB</strong>
            <small>& DIGITAL CYBER</small>
          </span>
        </Link>

        <Link href="/" className="tracking-home-link">
          ← Back to Home
        </Link>
      </header>

      <section className="tracking-hero">
        <span className="tracking-eyebrow">
          CUSTOMER SERVICE PORTAL
        </span>

        <h1>Track Your Service Request</h1>

        <p>
          Stay informed about your service request. Enter your
          unique reference number below to check its latest status.
        </p>
      </section>

      <section className="tracking-search-section">
        <div className="tracking-search-card">
          <div className="tracking-card-heading">
            <span className="tracking-search-icon">⌕</span>
            <div>
              <h2>Request Status Checker</h2>
              <p>Enter the ESH reference number sent after submission.</p>
            </div>
          </div>

          <form onSubmit={handleTracking} className="tracking-form">
            <label htmlFor="request-reference">
              Your Request Reference Number
            </label>

            <input
              id="request-reference"
              type="text"
              placeholder="ESH-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              autoComplete="off"
              required
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Checking Request..." : "Track My Request →"}
            </button>
          </form>

          {errorMessage && (
            <div className="tracking-error" role="alert">
              <strong>Unable to retrieve request</strong>
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="tracking-security-note">
            <span>🔒</span>
            <p>
              Your reference number provides access to limited
              information about your request. Keep it private.
            </p>
          </div>
        </div>
      </section>

      {trackedRequest && (
        <section className="tracking-results">
          <div className="tracking-result-header">
            <div>
              <span className="tracking-result-label">
                REQUEST FOUND
              </span>
              <h2>Request Details</h2>
            </div>

            <span
              className={`tracking-status-badge ${
                trackedRequest.status === "COMPLETED"
                  ? "status-completed"
                  : trackedRequest.status === "CANCELLED"
                    ? "status-cancelled"
                    : "status-active"
              }`}
            >
              {formatStatus(trackedRequest.status)}
            </span>
          </div>

          <div className="tracking-details-grid">
            <div className="tracking-detail">
              <span>REFERENCE NUMBER</span>
              <strong>{trackedRequest.reference}</strong>
            </div>

            <div className="tracking-detail">
              <span>DEPARTMENT</span>
              <strong>{trackedRequest.department}</strong>
            </div>

            <div className="tracking-detail">
              <span>SERVICE REQUESTED</span>
              <strong>{trackedRequest.service}</strong>
            </div>

            <div className="tracking-detail">
              <span>SUBMISSION DATE</span>
              <strong>
                {new Date(trackedRequest.createdAt).toLocaleString(
                  "en-KE",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                )}
              </strong>
            </div>
          </div>

          <div className="tracking-progress">
            <h3>Service Progress</h3>

            {trackedRequest.status === "CANCELLED" ? (
              <div className="tracking-cancelled-message">
                <strong>Request Cancelled</strong>
                <p>
                  This service request has been marked as cancelled.
                  Please contact our team if you need clarification.
                </p>
              </div>
            ) : (
              <div className="tracking-timeline">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;

                  return (
                    <div
                      className={`tracking-timeline-item ${
                        isCompleted ? "timeline-completed" : ""
                      } ${isCurrent ? "timeline-current" : ""}`}
                      key={step.value}
                    >
                      <div className="tracking-timeline-marker">
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      <div className="tracking-timeline-content">
                        <strong>{step.label}</strong>
                        <p>{step.description}</p>
                        {isCurrent && (
                          <span className="tracking-current-label">
                            CURRENT STATUS
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="tracking-last-updated">
            Last updated:{" "}
            {new Date(trackedRequest.updatedAt).toLocaleString(
              "en-KE",
              {
                dateStyle: "medium",
                timeStyle: "short",
              }
            )}
          </p>
        </section>
      )}

      <section className="tracking-help">
        <h3>Need assistance?</h3>
        <p>
          Our support team is available to help you with your service
          request.
        </p>

        <a
          href="https://wa.me/254713019045"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact Support on WhatsApp →
        </a>
      </section>

      <footer className="tracking-footer">
        <strong>E-SERVICE HUB & DIGITAL CYBER</strong>
        <p>Quality. Commitment. Excellence.</p>
        <span>Fast • Reliable • Affordable Digital Services</span>
        <small>© 2026 E-SERVICE HUB & DIGITAL CYBER. All rights reserved.</small>
      </footer>
    </main>
  );
}
