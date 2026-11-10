
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type RequestStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "QUOTED"
  | "AWAITING_PAYMENT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type Activity = {
  id: string;
  type: "STATUS_CHANGE" | "INTERNAL_NOTE";
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus | null;
  note: string | null;
  createdAt: string;
  admin: {
    fullName: string;
    role: string;
  };
};

type Props = {
  requestId: string;
  initialStatus: RequestStatus;
};

const statuses: RequestStatus[] = [
  "NEW",
  "UNDER_REVIEW",
  "QUOTED",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readApiResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

export default function RequestManagement({
  requestId,
  initialStatus,
}: Props) {
  const [status, setStatus] = useState<RequestStatus>(initialStatus);
  const [selectedStatus, setSelectedStatus] =
    useState<RequestStatus>(initialStatus);

  const [note, setNote] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const endpoint = `/api/admin/requests/${encodeURIComponent(requestId)}/activity`;

  // Load activity history.
  const loadActivities = useCallback(async () => {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load activity history."
        );
      }

      setActivities(
        Array.isArray(data.activities) ? data.activities : []
      );

      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load activity history."
      );

      return false;
    }
  }, [endpoint]);

  // Initial activity loading without calling a state-changing
  // callback directly from the effect.
  useEffect(() => {
    let cancelled = false;

    async function fetchInitialActivities() {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        const data = await readApiResponse(response);

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load activity history."
          );
        }

        if (!cancelled) {
          setActivities(
            Array.isArray(data.activities) ? data.activities : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load activity history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchInitialActivities();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  // Update request status.
  async function updateStatus() {
    if (savingStatus || savingNote) return;

    if (selectedStatus === status) {
      setError("Select a different status before updating.");
      return;
    }

    const confirmed = window.confirm(
      `Change request status from ${formatLabel(status)} to ${formatLabel(selectedStatus)}?`
    );

    if (!confirmed) return;

    setSavingStatus(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "STATUS_CHANGE",
          status: selectedStatus,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update request status."
        );
      }

      if (!statuses.includes(data.status as RequestStatus)) {
        throw new Error("The server returned an invalid request status.");
      }

      const updatedStatus = data.status as RequestStatus;

      setStatus(updatedStatus);
      setSelectedStatus(updatedStatus);
      setSuccess(data.message || "Request status updated successfully.");

      await loadActivities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update request status."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  // Save an internal administrative note.
  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingNote || savingStatus) return;

    const cleanNote = note.trim();

    if (!cleanNote) {
      setError("Enter an internal note before saving.");
      return;
    }

    if (cleanNote.length > 2000) {
      setError("Your note cannot exceed 2,000 characters.");
      return;
    }

    setSavingNote(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "INTERNAL_NOTE",
          note: cleanNote,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save internal note."
        );
      }

      setNote("");
      setSuccess(data.message || "Internal note saved successfully.");

      await loadActivities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save internal note."
      );
    } finally {
      setSavingNote(false);
    }
  }

  // Manually refresh activity history.
  async function refreshActivities() {
    if (loading || savingStatus || savingNote) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await loadActivities();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-request-management">

      {/* REQUEST STATUS MANAGEMENT */}
      <section className="admin-management-panel">
        <h3>Update Request Status</h3>

        <p>
          Select the new processing stage for this customer request.
          Changes will be recorded in the activity history.
        </p>

        <div className="admin-management-status">
          <div>
            <span>Current Status</span>
            <strong>{formatLabel(status)}</strong>
          </div>

          <div>
            <label htmlFor="request-status">
              New Status
            </label>

            <select
              id="request-status"
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as RequestStatus)
              }
              disabled={savingStatus || savingNote}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={updateStatus}
            disabled={
              savingStatus ||
              savingNote ||
              selectedStatus === status
            }
          >
            {savingStatus ? "Updating..." : "Update Status"}
          </button>
        </div>
      </section>

      {/* INTERNAL ADMINISTRATIVE NOTES */}
      <section className="admin-management-panel">
        <h3>Internal Administrative Notes</h3>

        <p>
          Record private observations, follow-ups and instructions.
          These notes are for authorised administrators only and
          are not displayed to customers.
        </p>

        <form onSubmit={saveNote}>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Enter an internal administrative note..."
            rows={5}
            maxLength={2000}
            disabled={savingNote || savingStatus}
          />

          <div className="admin-note-footer">
            <span>{note.length}/2000 characters</span>

            <button
              type="submit"
              disabled={
                savingNote ||
                savingStatus ||
                !note.trim()
              }
            >
              {savingNote ? "Saving..." : "Save Internal Note"}
            </button>
          </div>
        </form>
      </section>

      {/* SUCCESS AND ERROR MESSAGES */}
      {error && (
        <div
          className="admin-management-message error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="admin-management-message success"
          role="status"
        >
          {success}
        </div>
      )}

      {/* ACTIVITY HISTORY */}
      <section className="admin-management-panel">
        <div className="admin-activity-heading">
          <div>
            <h3>Request Activity History</h3>

            <p>
              Recorded administrative actions, internal notes
              and status changes.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshActivities}
            disabled={loading || savingStatus || savingNote}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="admin-activity-empty">
            Loading activity history...
          </p>
        ) : activities.length === 0 ? (
          <p className="admin-activity-empty">
            No administrative activities have been recorded yet.
          </p>
        ) : (
          <div className="admin-activity-list">
            {activities.map((activity) => (
              <article
                className="admin-activity-item"
                key={activity.id}
              >
                <div className="admin-activity-marker">
                  {activity.type === "STATUS_CHANGE" ? "↻" : "✎"}
                </div>

                <div className="admin-activity-content">
                  <strong>
                    {activity.type === "STATUS_CHANGE"
                      ? "Request Status Changed"
                      : "Internal Administrative Note"}
                  </strong>

                  {activity.type === "STATUS_CHANGE" ? (
                    <p>
                      {formatLabel(activity.fromStatus || "UNKNOWN")}
                      {" → "}
                      {formatLabel(activity.toStatus || "UNKNOWN")}
                    </p>
                  ) : (
                    <p className="admin-activity-note">
                      {activity.note}
                    </p>
                  )}

                  <div className="admin-activity-meta">
                    <span>
                      {activity.admin?.fullName || "Administrator"}
                    </span>

                    <span>
                      {activity.admin?.role
                        ? formatLabel(activity.admin.role)
                        : "ADMIN"}
                    </span>

                    <span>{formatDate(activity.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
