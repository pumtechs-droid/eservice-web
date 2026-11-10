
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const departments = {
  "education-student-support": {
    title: "Education & Student Support",
    description:
      "Professional assistance with student applications, admissions, academic administration and education-related digital services.",
    services: [
      "HELB applications and student funding support",
      "KUCCPS applications and course selection guidance",
      "KMTC and TVET applications",
      "University and college admissions assistance",
      "Institution transfers and course changes",
      "Scholarship and bursary application guidance",
      "Student portal and academic administrative support",
    ],
  },
  "digital-government-services": {
    title: "Digital & Government Services",
    description:
      "Convenient support with digital government platforms, statutory compliance and online administrative services.",
    services: [
      "KRA PIN registration and tax return assistance",
      "SHA registration and account updates",
      "eCitizen services and applications",
      "Good Conduct certificate application guidance",
      "NSSF registration and updates",
      "NTSA online services",
      "Online forms and digital applications",
    ],
  },
  "web-design-software-development": {
    title: "Web Design & Software Development",
    description:
      "Modern digital solutions that help individuals, businesses and organizations establish and grow their online presence.",
    services: [
      "Professional business and corporate websites",
      "E-commerce website development",
      "Web applications and customer portals",
      "Custom business management systems",
      "Website redesign and maintenance",
      "Domain and hosting assistance",
      "Website optimization and technical support",
    ],
  },
  "data-analytics-business-intelligence": {
    title: "Data Analytics & Business Intelligence",
    description:
      "Transforming raw data into meaningful insights that support informed decisions, research and business growth.",
    services: [
      "Data cleaning and processing",
      "Microsoft Excel analysis and reporting",
      "Statistical data analysis",
      "Power BI dashboards",
      "Data visualization",
      "Research data analysis",
      "Business intelligence reporting",
    ],
  },
  "creative-branding-academic-services": {
    title: "Creative, Branding & Academic Services",
    description:
      "Creative design, professional documentation and academic support services tailored to your needs.",
    services: [
      "Logo and brand identity design",
      "Posters, flyers and brochures",
      "Social media graphics",
      "Professional CV and portfolio design",
      "Typing and document formatting",
      "Proofreading and editing",
      "Academic guidance and research support",
    ],
  },
  "ai-ict-digital-innovation": {
    title: "AI, ICT & Digital Innovation",
    description:
      "Practical technology solutions that use innovation, automation and modern ICT to improve how people and organizations work.",
    services: [
      "AI integration and implementation",
      "Business process automation",
      "AI-powered chatbot solutions",
      "ICT support and troubleshooting",
      "Networking and cybersecurity guidance",
      "Internet of Things (IoT) solutions",
      "System integration and digital transformation consultancy",
    ],
  },
};

type DepartmentSlug = keyof typeof departments;

async function ServicePageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!Object.prototype.hasOwnProperty.call(departments, slug)) {
    notFound();
  }

  const department = departments[slug as DepartmentSlug];

  const whatsappMessage = encodeURIComponent(
    `Hello E-SERVICE HUB & DIGITAL CYBER. I would like to enquire about ${department.title}. Kindly assist me.`
  );

  const whatsappLink = `https://wa.me/254713019045?text=${whatsappMessage}`;

  return (
    <main className="service-page">
      <header className="service-header">
        <Link href="/" className="service-brand">
          E-SERVICE HUB
          <span>& DIGITAL CYBER</span>
        </Link>

        <Link href="/" className="back-home">
          ← Back to Home
        </Link>
      </header>

      <section className="service-hero">
        <p className="eyebrow">OUR SERVICE DEPARTMENTS</p>

        <h1>{department.title}</h1>

        <p className="service-intro">
          {department.description}
        </p>

        <div className="service-hero-actions">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="service-primary-button"
          >
            Enquire on WhatsApp →
          </a>

          <Link
            href={`/request-service?department=${slug}`}
            className="service-online-button"
          >
            Submit a Service Request Online →
          </Link>
        </div>
      </section>

      <section className="service-content">
        <div className="service-section-heading">
          <p className="eyebrow">WHAT WE OFFER</p>

          <h2>Services under this department</h2>

          <p>
            Explore the services available and contact our team
            for professional assistance.
          </p>
        </div>

        <div className="service-list">
          {department.services.map((service, index) => {
            const message = encodeURIComponent(
              `Hello E-SERVICE HUB & DIGITAL CYBER. I need assistance with: ${service}, under ${department.title}. Kindly guide me on the requirements and charges.`
            );

            return (
              <div className="service-list-item" key={service}>
                <span className="service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="service-item-name">
                  {service}
                </span>

                <a
                  href={`https://wa.me/254713019045?text=${message}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-item-link"
                >
                  Enquire ↗
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="service-process">
        <p className="eyebrow">SIMPLE AND CONVENIENT</p>

        <h2>How to get started</h2>

        <div className="service-process-grid">
          <article>
            <span>01</span>
            <h3>Make an enquiry</h3>
            <p>
              Tell us the service you need and what you want to achieve.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Receive guidance</h3>
            <p>
              Our team will explain the requirements and next steps.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Proceed with service</h3>
            <p>
              Review the quotation and confirm how you wish to proceed.
            </p>
          </article>
        </div>
      </section>

      <section className="service-contact">
        <h2>Ready to get started?</h2>

        <p>
          Talk to E-SERVICE HUB & DIGITAL CYBER.
          We are here to help.
        </p>

        <div className="service-hero-actions">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="service-primary-button"
          >
            Chat With Us on WhatsApp
          </a>

          <Link
            href={`/request-service?department=${slug}`}
            className="service-online-button"
          >
            Submit Online Request
          </Link>
        </div>
      </section>

      <footer className="service-footer">
        <p>QCE  Quality. Commitment. Excellence.</p>
        <p>Fast • Reliable • Affordable Digital Services</p>
        <p>© 2026 E-SERVICE HUB & DIGITAL CYBER</p>
      </footer>
    </main>
  );
}

export default function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading department...</div>}>
      <ServicePageContent params={params} />
    </Suspense>
  );
}
