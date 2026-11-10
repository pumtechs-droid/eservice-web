
"use client";

import { useState, Suspense } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const departments = {
  "Education & Student Support": [
    "HELB applications and student funding support",
    "KUCCPS applications and course selection guidance",
    "KMTC and TVET applications",
    "University and college admissions assistance",
    "Institution transfers and course changes",
    "Scholarship and bursary application guidance",
    "Student portal and academic administrative support",
  ],
  "Digital & Government Services": [
    "KRA PIN registration and tax return assistance",
    "SHA registration and account updates",
    "eCitizen services and applications",
    "Good Conduct certificate application guidance",
    "NSSF registration and updates",
    "NTSA online services",
    "Online forms and digital applications",
  ],
  "Web Design & Software Development": [
    "Professional business and corporate websites",
    "E-commerce website development",
    "Web applications and customer portals",
    "Custom business management systems",
    "Website redesign and maintenance",
    "Domain and hosting assistance",
    "Website optimization and technical support",
  ],
  "Data Analytics & Business Intelligence": [
    "Data cleaning and processing",
    "Microsoft Excel analysis and reporting",
    "Statistical data analysis",
    "Power BI dashboards",
    "Data visualization",
    "Research data analysis",
    "Business intelligence reporting",
  ],
  "Creative, Branding & Academic Services": [
    "Logo and brand identity design",
    "Posters, flyers and brochures",
    "Social media graphics",
    "Professional CV and portfolio design",
    "Typing and document formatting",
    "Proofreading and editing",
    "Academic guidance and research support",
  ],
  "AI, ICT & Digital Innovation": [
    "AI integration and implementation",
    "Business process automation",
    "AI-powered chatbot solutions",
    "ICT support and troubleshooting",
    "Networking and cybersecurity guidance",
    "Internet of Things (IoT) solutions",
    "System integration and digital transformation consultancy",
  ],
};

type DepartmentName = keyof typeof departments;

const departmentSlugs: Partial<Record<string, DepartmentName>> = {
  "education-student-support": "Education & Student Support",
  "digital-government-services": "Digital & Government Services",
  "web-design-software-development": "Web Design & Software Development",
  "data-analytics-business-intelligence":
    "Data Analytics & Business Intelligence",
  "creative-branding-academic-services":
    "Creative, Branding & Academic Services",
  "ai-ict-digital-innovation": "AI, ICT & Digital Innovation",
};

function RequestServiceForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("department");

  const initialDepartment: DepartmentName | "" = slug
    ? departmentSlugs[slug] ?? ""
    : "";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] =
    useState<DepartmentName | "">(initialDepartment);
  const [service, setService] = useState("");
  const [details, setDetails] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successReference, setSuccessReference] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessReference("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          department,
          service,
          details,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit your request. Please try again."
        );
      }

      setSuccessReference(result.request.reference);

      // Clear the form after successful database submission.
      setFullName("");
      setPhone("");
      setEmail("");
      setDepartment("");
      setService("");
      setDetails("");

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="request-page">
      <header className="request-header">
        <Link href="/" className="request-brand">
          E-SERVICE HUB
          <span>& DIGITAL CYBER</span>
        </Link>

        <Link href="/" className="request-back">
          ← Back to Home
        </Link>
      </header>

      <section className="request-hero">
        <p className="eyebrow">CUSTOMER SERVICE PORTAL</p>

        <h1>How Can We Help You?</h1>

        <p>
          Submit your service request and let our team guide you
          through the requirements, quotation and next steps.
        </p>
      </section>

      <section className="request-form-section">
        <form className="request-form" onSubmit={handleSubmit}>
          {successReference && (
            <div
              className="request-success"
              role="status"
              aria-live="polite"
            >
              <h2>Request Submitted Successfully!</h2>

              <p>
                Thank you for choosing E-SERVICE HUB & DIGITAL CYBER.
                Your request has been saved successfully.
              </p>

              <strong>Your Request Reference:</strong>

              <p className="request-reference">
                {successReference}
              </p>

              <p>
                Please keep this reference number safe for future
                communication and request tracking.
              </p>
            </div>
          )}

          {errorMessage && (
            <div
              className="request-error"
              role="alert"
              aria-live="assertive"
            >
              <strong>Submission unsuccessful</strong>
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="request-form-heading">
            <span>01 — CUSTOMER INFORMATION</span>
            <h2>Your Contact Details</h2>
            <p>Tell us how we can reach you.</p>
          </div>

          <div className="request-fields">
            <label>
              Full Name *
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                required
              />
            </label>

            <label>
              Phone Number *
              <input
                type="tel"
                placeholder="e.g. 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                required
              />
            </label>

            <label className="full-field">
              Email Address (Optional)
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
              />
            </label>
          </div>

          <div className="request-divider" />

          <div className="request-form-heading">
            <span>02 — SERVICE SELECTION</span>
            <h2>What Service Do You Need?</h2>
            <p>Select the relevant department and service.</p>
          </div>

          <div className="request-fields">
            <label className="full-field">
              Select Department *
              <select
                value={department}
                onChange={(e) => {
                  const value = e.target.value;

                  if (
                    value === "" ||
                    Object.prototype.hasOwnProperty.call(
                      departments,
                      value
                    )
                  ) {
                    setDepartment(value as DepartmentName | "");
                    setService("");
                  }
                }}
                required
              >
                <option value="">Choose a department</option>

                {Object.keys(departments).map((name) => (
                  <option value={name} key={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="full-field">
              Select Service *
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                disabled={!department}
                required
              >
                <option value="">
                  {department
                    ? "Choose the service you need"
                    : "Select a department first"}
                </option>

                {department &&
                  departments[department].map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </label>

            <label className="full-field">
              Describe Your Request *
              <textarea
                rows={6}
                placeholder="Briefly explain what you need assistance with..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                minLength={10}
                maxLength={5000}
                required
              />
            </label>
          </div>

          <div className="request-privacy">
            <strong>Privacy and security notice</strong>
            <p>
              Do not include passwords, OTPs, PINs or other confidential
              account credentials in this form.
            </p>
          </div>

          <button
            type="submit"
            className="request-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting Your Request..."
              : "Submit Service Request →"}
          </button>

          <p className="request-note">
            Your information will be securely submitted to our
            service request database. Please keep your reference
            number after successful submission.
          </p>
        </form>
      </section>

      <footer className="request-footer">
        <p>QCE Quality. Commitment. Excellence.</p>
        <p>Fast • Reliable • Affordable Digital Services</p>
        <p>© 2026 E-SERVICE HUB & DIGITAL CYBER</p>
      </footer>
    </main>
  );
}

export default function RequestServicePage() {
  return (
    <Suspense
      fallback={
        <div className="request-page">
          Loading request form...
        </div>
      }
    >
      <RequestServiceForm />
    </Suspense>
  );
}
