/**
 * Normalize Indonesian phone numbers to wa.me-compatible format (62... without +).
 * Mirrors the normalization logic in lib/pivot/client.ts formatPhoneForPivot.
 */
export function formatPhoneForWaMe(phone: string): string | null {
  let number = phone.trim().replace(/[\s-]/g, "");

  if (number.startsWith("+62")) number = number.slice(1); // keep 62...
  else if (number.startsWith("62")) {
    /* already 62... — keep as-is after dash/space strip */
  } else if (number.startsWith("0")) {
    number = "62" + number.slice(1);
  } else if (/^\d+$/.test(number)) {
    number = "62" + number;
  }

  if (!/^\d+$/.test(number)) return null;
  if (number.length < 10 || number.length > 15) return null;
  return number;
}

/** Build a wa.me click-to-chat link with a pre-filled message.
 * Uses ORIGIN_CONTACT_PHONE (strips leading + if present).
 */
export function buildWhatsAppLink(message: string): string {
  const raw = process.env.ORIGIN_CONTACT_PHONE ?? "+628979092726";
  const number = raw.replace(/^\+/, ""); // wa.me needs country code without +
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
