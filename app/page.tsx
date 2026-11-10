
import Link from "next/link";

const departments = [
  {
    number: "01",
    slug: "education-student-support",
    icon: "🎓",
    title: "Education & Student Support",
    description:
      "Practical administrative support for students, applicants and learners navigating education opportunities.",
    services: [
      "HELB applications, appeals and status checks",
      "Loan clearance guidance",
      "KUCCPS applications and course revisions",
      "KMTC and TVET applications",
      "University admissions and transfers",
      "Scholarship and bursary guidance",
      "Student portal and academic administration support",
    ],
  },
  {
    number: "02",
    slug: "digital-government-services",
    icon: "🌐",
    title: "Digital & Government Services",
    description:
      "Convenient assistance with online government platforms, registrations, compliance and digital accounts.",
    services: [
      "KRA PIN registration and retrieval",
      "Tax returns filing assistance",
      "SHA registration and account updates",
      "eCitizen and Good Conduct application guidance",
      "NSSF and NTSA services assistance",
      "Google account recovery guidance",
      "Business till registration and online forms",
    ],
  },
  {
    number: "03",
    slug: "web-design-software-development",
    icon: "💻",
    title: "Web Design & Software Development",
    description:
      "Modern digital products and custom software solutions that help individuals, businesses and organisations grow.",
    services: [
      "Professional business and corporate websites",
      "E-commerce website development",
      "Web applications and customer portals",
      "Custom management systems",
      "Website redesign and maintenance",
      "Domain registration and hosting assistance",
      "Custom software development",
    ],
  },
  {
    number: "04",
    slug: "data-analytics-business-intelligence",
    icon: "📊",
    title: "Data Analytics & Business Intelligence",
    description:
      "Transforming raw data into meaningful insights that support better decisions, performance and business growth.",
    services: [
      "Data cleaning and processing",
      "Microsoft Excel analysis and reporting",
      "Statistical data analysis",
      "Power BI dashboards and reporting",
      "Data visualisation",
      "Research data analysis",
      "Business intelligence solutions",
    ],
  },
  {
    number: "05",
    slug: "creative-branding-academic-services",
    icon: "🎨",
    title: "Creative & Academic Support",
    description:
      "Professional creative, document and academic support for individuals, students and organisations.",
    services: [
      "Professional ATS-friendly CV writing",
      "Logo, poster and flyer design",
      "Social media graphics and branding",
      "Document typing and formatting",
      "Proofreading and editing",
      "Portfolio and presentation design",
      "Assignment guidance and academic support",
    ],
  },
  {
    number: "06",
    slug: "ai-ict-digital-innovation",
    icon: "🤖",
    title: "AI, ICT & Digital Innovation",
    description:
      "Practical technology, automation and innovation services designed to solve problems and improve productivity.",
    services: [
      "AI integration and workflow automation",
      "AI-powered chatbots and assistants",
      "ICT support and troubleshooting",
      "Computer networking solutions",
      "Cybersecurity guidance and awareness",
      "Internet of Things (IoT) solutions",
      "System integration and digital transformation",
    ],
  },
];

const values = [
  {
    number: "01",
    title: "Quality",
    description:
      "We aim for accurate, professional and carefully delivered work.",
  },
  {
    number: "02",
    title: "Commitment",
    description:
      "We value every customer and take responsibility for every service request.",
  },
  {
    number: "03",
    title: "Excellence",
    description:
      "We continuously improve our service standards and customer experience.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose a service",
    description: "Explore our catalogue and select the support you need.",
  },
  {
    number: "02",
    title: "Submit a request",
    description: "Tell us what you need through our service enquiry process.",
  },
  {
    number: "03",
    title: "Confirm your quotation",
    description:
      "Our team explains the service, requirements and applicable fee.",
  },
  {
    number: "04",
    title: "Track your request",
    description:
      "Receive updates as your request progresses towards completion.",
  },
];

const whatsappLink =
  "https://wa.me/254713019045?text=" +
  encodeURIComponent(
    "Hello E-SERVICE HUB & DIGITAL CYBER. I would like to enquire about your services. Kindly assist me."
  );

function getDepartmentWhatsAppLink(title: string) {
  const message = encodeURIComponent(
    `Hello E-SERVICE HUB & DIGITAL CYBER. I would like to enquire about ${title}. Kindly assist me with the available services, requirements and charges.`
  );

  return `https://wa.me/254713019045?text=${message}`;
}

export default function Home() {
  return (
    <main>
      {/* MAIN WEBSITE HEADER */}
      <header className="site-header">
        <a href="#home" className="brand">
          <img
            src="/logo.jpeg"
            alt="E-SERVICE HUB & DIGITAL CYBER official logo"
            className="brand-logo"
          />

          <span className="brand-name">
            E-SERVICE HUB
            <small>& DIGITAL CYBER</small>
          </span>
        </a>

        <nav className="navigation">
          <a href="#home">Home</a>
          <a href="#services">Our Services</a>
          <a href="#about">About Us</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#contact">Contact</a>

          {/* NEW CUSTOMER TRACKING LINK */}
          <Link href="/track-request">
            Track My Request
          </Link>
        </nav>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="header-button"
        >
          Get Assistance <span>↗</span>
        </a>
      </header>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot"></span>
            YOUR TRUSTED DIGITAL SUPPORT CENTRE
          </div>

          <h1>
            Your digital
            <br />
            needs. Our
            <br />
            <span>commitment.</span>
          </h1>

          <p className="hero-description">
            Your premier one-stop digital administrative and technology
            support centre. From education and government services to
            professional documents, software development, data analytics and
            AI-powered solutions, we are here to make the process simpler.
          </p>

          <div className="hero-actions">
            <a href="#services" className="primary-button">
              Explore Our Services <span>→</span>
            </a>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-button"
            >
              Talk to Our Team
            </a>
          </div>

          <div className="hero-trust">
            <span className="trust-line"></span>
            FAST. RELIABLE. AFFORDABLE.
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-orbit orbit-one"></div>
          <div className="visual-orbit orbit-two"></div>

          <div className="hero-logo-frame">
            <img
              src="/logo.jpeg"
              alt="E-SERVICE HUB and DIGITAL CYBER QCE logo"
              className="hero-logo"
            />
          </div>

          <div className="floating-card card-top">
            <span className="floating-icon">🎓</span>
            <span>Student Support</span>
          </div>

          <div className="floating-card card-bottom">
            <span className="floating-icon">💻</span>
            <span>Digital Solutions</span>
          </div>

          <div className="visual-label">
            QUALITY. COMMITMENT. EXCELLENCE.
          </div>
        </div>
      </section>

      {/* QCE STATS STRIP */}
      <section className="stats-strip">
        <div>
          <strong>Q</strong>
          <span>Quality service</span>
        </div>

        <div>
          <strong>C</strong>
          <span>Committed support</span>
        </div>

        <div>
          <strong>E</strong>
          <span>Excellence in delivery</span>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="services-section" id="services">
        <div className="section-heading">
          <div>
            <span className="section-label">OUR SERVICE DEPARTMENTS</span>

            <h2>
              The support you need.
              <br />
              <span>All in one place.</span>
            </h2>
          </div>

          <p>
            Whether you are a student, professional, entrepreneur, business
            owner or member of the public, our service departments are
            designed to make everyday digital, administrative and technology
            tasks easier.
          </p>
        </div>

        <div className="department-grid">
          {departments.map((department) => (
            <article className="department-card" key={department.slug}>
              <div className="department-top">
                <span className="department-icon">
                  {department.icon}
                </span>

                <span className="department-number">
                  {department.number}
                </span>
              </div>

              <h3>{department.title}</h3>

              <p className="department-description">
                {department.description}
              </p>

              <div className="department-divider"></div>

              <h4>Available services</h4>

              <ul className="department-services">
                {department.services.map((service) => (
                  <li key={service}>
                    <span>✓</span>
                    {service}
                  </li>
                ))}
              </ul>

              <div className="department-actions">
                <Link
                  href={`/services/${department.slug}`}
                  className="department-details-link"
                >
                  View Department Details <span>→</span>
                </Link>

                <a
                  href={getDepartmentWhatsAppLink(department.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-link"
                >
                  Enquire about this department <span>↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="mission-section">
        <div className="mission-inner">
          <span className="section-label">OUR MISSION</span>

          <h2>
            Making digital administration
            <br />
            <span>simpler for everyone.</span>
          </h2>

          <p>
            To provide professional, accurate and timely digital
            administrative support for education, campus and compliance
            needs, while serving individuals, professionals and businesses
            through accessible, innovative and dependable digital services.
          </p>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="about-section" id="about">
        <div className="about-visual">
          <div className="about-brand-card">
            <img src="/logo.jpeg" alt="E-SERVICE HUB QCE brand" />
          </div>
        </div>

        <div className="about-content">
          <span className="section-label">WHO WE ARE</span>

          <h2>
            One hub.
            <br />
            <span>Many possibilities.</span>
          </h2>

          <p>
            E-SERVICE HUB & DIGITAL CYBER is a digital administrative,
            technology and professional support centre bringing together
            education assistance, government-related digital services,
            creative support, software development, data analytics and
            emerging technology solutions.
          </p>

          <p>
            Our goal is to make essential digital processes more accessible
            through professional guidance, convenient communication,
            innovation and responsible service delivery.
          </p>

          <a href="#contact" className="primary-button">
            Connect With Us <span>→</span>
          </a>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="values-section">
        <div className="values-heading">
          <span className="section-label">THE QCE STANDARD</span>
          <h2>Our promise to every customer.</h2>
        </div>

        <div className="values-grid">
          {values.map((value) => (
            <article className="value-card" key={value.number}>
              <span>{value.number}</span>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="process-section" id="how-it-works">
        <div className="values-heading">
          <span className="section-label">A SIMPLE PROCESS</span>
          <h2>Getting started is easy.</h2>

          <p>
            From your first enquiry to the completion of your service.
          </p>
        </div>

        <div className="process-grid">
          {steps.map((step) => (
            <article className="process-card" key={step.number}>
              <span className="process-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact-section" id="contact">
        <span className="section-label">WE ARE READY TO ASSIST</span>

        <h2>
          What can we
          <br />
          <span>help you accomplish?</span>
        </h2>

        <p>
          Speak to our team about student support, digital administration,
          creative services, software development, data analytics or any
          other service enquiry.
        </p>

        <div className="contact-actions">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button"
          >
            Chat on WhatsApp <span>↗</span>
          </a>

          <a href="tel:+254713019045" className="secondary-button">
            Call Our Team
          </a>
        </div>

        <div className="contact-details">
          <a href="tel:+254713019045">+254 713 019 045</a>
          <a href="tel:+254751113277">+254 751 113 277</a>
          <a href="tel:0183270095">0183270095</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <a href="#home" className="brand footer-brand">
          <img
            src="/logo.jpeg"
            alt="E-SERVICE HUB official logo"
            className="footer-logo"
          />

          <span className="brand-name">
            E-SERVICE HUB
            <small>& DIGITAL CYBER</small>
          </span>
        </a>

        <p>
          © 2026 E-SERVICE HUB & DIGITAL CYBER.
          <br />
          Quality. Commitment. Excellence.
        </p>

        <div className="footer-navigation">
          <Link href="/request-service">
            Submit a Request
          </Link>

          <Link href="/track-request">
            Track My Request
          </Link>
        </div>

        <a href="#home" className="back-top">
          Back to top ↑
        </a>
      </footer>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        className="whatsapp-float"
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact E-SERVICE HUB on WhatsApp"
      >
        WhatsApp ↗
      </a>
    </main>
  );
}
