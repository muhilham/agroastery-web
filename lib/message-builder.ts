import { numberToIdr } from "@/lib/numberToIdr";

function normalizePhoneID(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function createWhatsAppMessage(opts: {
  productTitle: string;
  size: string;
  grind: string;
  qty: number;
  unitPrice: number;
  fullName: string;
  phone: string;
  address: string;
}) {
  const {
    productTitle,
    size,
    grind,
    qty,
    unitPrice,
    fullName,
    phone,
    address,
  } = opts;
  const subtotal = unitPrice * qty;

  const lines = [
    "Halo Agroastery,",
    "",
    `Saya mau pesan ${productTitle.toUpperCase()} (${size}) , Grind Level (${grind}).`,
    "",
    `Qty: ${qty} x ${numberToIdr({ nominal: unitPrice })} = ${numberToIdr({ nominal: subtotal })}`,
    "",
    `Alamat : ${address} (${phone}) - ${fullName}`,
    "",
    "Terima kasih",
  ];

  return lines.join("\n");
}

function buildWhatsAppUrl({
  storePhone,
  text,
}: {
  storePhone: string;
  text: string;
}) {
  const phone = normalizePhoneID(storePhone);
  const url = new URL(`https://wa.me/${phone}`);
  url.searchParams.set("text", text);
  return url.toString();
}

export { createWhatsAppMessage, buildWhatsAppUrl, normalizePhoneID };
