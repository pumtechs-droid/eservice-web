"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Department = { id: string; name: string };
type Manager = { id: string; fullName: string; staffId: string };

type Props = {
  departments: Department[];
  managers: Manager[];
};

export default function EmployeeCreateForm({
  departments,
  managers,
}: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [managerId, setManagerId] = useState("");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [employmentStatus, setEmploymentStatus] = useState("ACTIVE");
  const [joiningDate, setJoiningDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          alternatePhone,
          jobTitle,
          departmentId,
          managerId,
          employmentType,
          employmentStatus,
          joiningDate,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to register employee.");
      }

      setSuccess(`Employee registered successfully. Staff ID: ${result.employee.staffId}`);
      router.refresh();
      router.push("/admin/hr");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="personnel-create-card">
      <div className="personnel-create-card-header">
        <div>
          <span className="personnel-form-eyebrow">EMPLOYEE RECORD</span>
          <h2>Employee Information</h2>
          <p>Fields marked * are required.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="personnel-create-form">
        <div className="personnel-form-grid">
          <div className="personnel-field">
            <label>Full Name *</label>
            <input required minLength={2} maxLength={100}
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Employee full name" />
          </div>

          <div className="personnel-field">
            <label>Email Address</label>
            <input type="email" maxLength={254}
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" />
          </div>

          <div className="personnel-field">
            <label>Phone Number *</label>
            <input required maxLength={30}
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+254..." />
          </div>

          <div className="personnel-field">
            <label>Alternative Phone</label>
            <input maxLength={30}
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="Alternative contact" />
          </div>

          <div className="personnel-field">
            <label>Job Title *</label>
            <input required maxLength={100}
              value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Data Analyst" />
          </div>

          <div className="personnel-field">
            <label>Department *</label>
            <select required value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="personnel-field">
            <label>Employment Type *</label>
            <select value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
              <option value="TEMPORARY">Temporary</option>
            </select>
          </div>

          <div className="personnel-field">
            <label>Employment Status *</label>
            <select value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="personnel-field">
            <label>Joining Date *</label>
            <input type="date" required value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)} />
          </div>

          <div className="personnel-field">
            <label>Reporting Manager</label>
            <select value={managerId}
              onChange={(e) => setManagerId(e.target.value)}>
              <option value="">No manager assigned</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName} ({manager.staffId})
                </option>
              ))}
            </select>
          </div>

          <div className="personnel-field" style={{ gridColumn: "1 / -1" }}>
            <label>Additional Notes</label>
            <textarea rows={4} maxLength={2000}
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional employment notes" />
          </div>
        </div>

        <p>
          <strong>Staff ID:</strong> Generated automatically after registration
          in the format ESH-2026-001.
        </p>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <button type="submit" disabled={loading || !departments.length}>
          {loading ? "Registering..." : "Register Employee"}
        </button>
      </form>
    </section>
  );
}
