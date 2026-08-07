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
