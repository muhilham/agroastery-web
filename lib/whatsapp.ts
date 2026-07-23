/** Build a wa.me click-to-chat link with a pre-filled message.
 * Uses ORIGIN_CONTACT_PHONE (strips leading + if present).
 */
export function buildWhatsAppLink(message: string): string {
  const raw = process.env.ORIGIN_CONTACT_PHONE ?? "+628979092726";
  const number = raw.replace(/^\+/, ""); // wa.me needs country code without +
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
