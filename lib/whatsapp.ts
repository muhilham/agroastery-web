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

/** Pre-filled WA message for a courier swap on a paid order (issue #200 A2/A4).
 * Max one "choice" (accept the new courier / ask questions) — never the full
 * ranked list. Returns null when the phone can't be normalized for wa.me, so
 * callers can fall back to manual contact. Sender number is ORIGIN_CONTACT_PHONE
 * (customer taps and messages the roastery). */
export function buildCourierChangeWhatsAppLink(params: {
  phone: string;
  customerName: string;
  orderNumber: string;
  oldCourier: string;
  oldService: string;
  newCourier: string;
  newService: string;
  newServiceName?: string;
  newEta?: string;
  orderId?: string;
}): string | null {
  const cleanPhone = formatPhoneForWaMe(params.phone);
  if (!cleanPhone) return null;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com").replace(/\/$/, "");
  const newName = joinCourierServiceName(params.newCourier, params.newService, params.newServiceName);

  let message = `Halo ${params.customerName || "Kak"}, pesanan ${params.orderNumber} kami pindahkan ke kurir ${newName}`;
  message += ` karena kurir ${params.oldCourier.toUpperCase()} ${params.oldService} sedang tidak tersedia untuk rute ini.`;
  if (params.newEta) message += `\nEstimasi tiba: ${params.newEta}.`;
  message += `\n\nBalas pesan ini jika ada pertanyaan.`;
  if (params.orderId) message += ` Lacak pesanan: ${appUrl}/track/${params.orderId}/`;
  message += `\n\nTerima kasih! 🙏`;

  return buildWhatsAppLink(message);
}

function joinCourierServiceName(courier: string, service: string, serviceName?: string): string {
  const display = (serviceName ?? service).trim();
  if (!display || display.toLowerCase() === courier.toLowerCase()) return service.toUpperCase();
  if (display.toLowerCase().startsWith(courier.toLowerCase())) return display;
  return `${courier.toUpperCase()} ${display}`;
}

type PaymentWhatsAppItem = {
  productName: string;
  quantity: number;
};

type BuildPaymentWhatsAppLinkParams = {
  phone: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: PaymentWhatsAppItem[];
  total: number;
  appUrl?: string;
};

export function buildPaymentWhatsAppLink(params: BuildPaymentWhatsAppLinkParams): string | null {
  const cleanPhone = formatPhoneForWaMe(params.phone);
  if (!cleanPhone) return null;

  const appUrl = (params.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com").replace(/\/$/, "");

  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(params.total);

  let message = `Halo ${params.customerName}, order ${params.orderNumber} sudah dikonfirmasi.`;

  if (params.items.length > 0) {
    const itemLines = params.items
      .map((i) => `• ${i.productName} ×${i.quantity}`)
      .join("\n");
    message += `\n\n${itemLines}`;
  }

  message += `\n\nTotal: ${formattedTotal}`;
  message += `\nTracking: ${appUrl}/track/${params.orderId}/`;
  message += `\n\nTerima kasih sudah order di Agroastery! 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
