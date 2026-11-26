export const OFFICIAL_CONTACTS = [
  { number: "+254751113277", display: "+254 751 113 277" },
  { number: "+254183270095", display: "+254 183 270 095" },
] as const;

export function createWhatsAppUrl(number: string, message?: string) {
  const whatsappNumber = number.replace(/\D/g, "");
  const messageQuery = message
    ? `?text=${encodeURIComponent(message)}`
    : "";

  return `https://wa.me/${whatsappNumber}${messageQuery}`;
}
