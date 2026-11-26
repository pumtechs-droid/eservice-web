import { createWhatsAppUrl, OFFICIAL_CONTACTS } from "@/lib/official-contacts";

export default function ContactDock() {
  return (
    <details className="official-contact-dock">
      <summary>Contact E-SERVICE HUB</summary>
      <div className="official-contact-panel">
        <p className="official-contact-intro">
          Calls, SMS and WhatsApp support
        </p>
        <div className="official-contact-list">
          {OFFICIAL_CONTACTS.map((contact) => (
            <section className="official-contact-item" key={contact.number}>
              <strong>{contact.display}</strong>
              <div className="official-contact-actions">
                <a href={`tel:${contact.number}`}>Call</a>
                <a href={`sms:${contact.number}`}>SMS</a>
                <a
                  href={createWhatsAppUrl(contact.number)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}
