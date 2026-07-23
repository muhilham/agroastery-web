/** Shop WhatsApp in wa.me format (country code, no +). */
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "628979092726";

/** Build a wa.me click-to-chat link with a pre-filled message. */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
