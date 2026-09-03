/**
 * JSON-LD builders for /konsultasi (issue #123, extracted for tests per #133).
 *
 * Returning a dangerouslySetInnerHTML payload keeps the page thin; tests assert
 * the object structure directly (see jsonld.test.ts) — same pattern as
 * lib/consultations/calendar.ts.
 */
import {
  CONSULTATION_FEE_IDR,
  CONSULTATION_TIME_SLOTS,
} from "@/lib/consultations/constants";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";
const OG_IMAGE =
  "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";

/** Latest session end: last slot start + 2-hour session. */
const LAST_SLOT_START =
  CONSULTATION_TIME_SLOTS[CONSULTATION_TIME_SLOTS.length - 1];
const SESSION_CLOSE = `${String(Number(LAST_SLOT_START.split(":")[0]) + 2).padStart(2, "0")}:00`;

export function consultationJsonLd() {
  const postalAddress = {
    "@type": "PostalAddress",
    streetAddress: "Jl. Kemang Barat No.7I, RT.9/RW.1, Bangka, Kec. Mampang Prpt.",
    addressLocality: "Kota Jakarta Selatan",
    addressRegion: "DKI Jakarta",
    postalCode: "12730",
    addressCountry: "ID",
  };
  const business = {
    "@type": "LocalBusiness",
    name: "Agroastery",
    url: SITE_URL,
    image: OG_IMAGE,
    description:
      "Specialty coffee roastery dan supplier biji kopi untuk cafe di Jakarta Selatan.",
    address: postalAddress,
    telephone: "+628****2726",
    openingHours: "Mo-Su 10:00-20:00",
    priceRange: `Rp${CONSULTATION_FEE_IDR.toLocaleString("id-ID")}`,
    geo: { "@type": "GeoCoordinates", latitude: -6.2637061, longitude: 106.8194468 },
  };
  return {
    __html: JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Konsultasi Kopi untuk Cafe",
        serviceType:
          "Konsultasi menu kopi, peracikan blend, dan penawaran wholesale",
        description:
          "Sesi privat 2 jam di roastery Jakarta Selatan untuk pemilik cafe: diskusi menu, cicip blend, dan penawaran harga wholesale.",
        provider: business,
        areaServed: { "@type": "City", name: "Jakarta" },
        availableChannel: {
          "@type": "Channel",
          serviceType: "Offline — di roastery Agroastery, Jakarta Selatan",
        },
        offers: {
          "@type": "Offer",
          price: CONSULTATION_FEE_IDR,
          priceCurrency: "IDR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/konsultasi`,
        },
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Tuesday", "Wednesday", "Thursday"],
          opens: `${CONSULTATION_TIME_SLOTS[0]}:00`,
          closes: SESSION_CLOSE,
        },
      },
      { "@context": "https://schema.org", ...business },
    ]),
  };
}
