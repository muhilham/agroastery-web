import { numberToIdr } from "@/lib/numberToIdr";
import { $destinationGeo, type DestinationGeo } from "@/lib/stores/shipping";

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
  shipping: string;
  total: number;
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
    shipping,
    total,
  } = opts;
  const subtotal = unitPrice * qty;

  const lines = [
    "Halo Agroastery,",
    "",
    `Saya mau pesan *${productTitle.toUpperCase()}* (${size}) - Grind Level *${grind}*.`,
    "",
    "*Detail Pesanan:*",
    `- Qty: ${qty} x ${numberToIdr({ nominal: unitPrice })} = *${numberToIdr({ nominal: subtotal })}*`,
    `- Pengiriman: ${shipping}`,
    "",
    `*Total: ${numberToIdr({ nominal: total })}*`,
    "",
    "*Alamat Pengiriman:*",
    `${address}`,
    `(${fullName} - ${phone})`,
    "",
    // Additional Google Maps details (if available)
    ...((): string[] => {
      const dest: DestinationGeo = $destinationGeo.get();
      const { lat, lng, place_id, formatted_address, place_name, postal_code } = dest || {};

      if (lat == null && lng == null && !formatted_address && !place_name && !postal_code) return [] as string[];

      const mapsUrl =
        lat != null && lng != null
          ? place_id
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(place_id)}`
            : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : undefined;

      const extra: string[] = [];
      extra.push("— Detail Lokasi (Google Maps) —");
      if (place_name) extra.push(`- Lokasi/Nama: ${place_name}`);
      if (formatted_address) extra.push(`- Alamat (Maps): ${formatted_address}`);
      if (postal_code) extra.push(`- Kode Pos: ${postal_code}`);
      if (mapsUrl) extra.push(`- Link: ${mapsUrl}`);
      extra.push("");
      return extra;
    })(),
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
