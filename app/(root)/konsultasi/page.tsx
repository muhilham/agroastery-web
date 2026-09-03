import Navigation from "@/components/navigation";
import BookingFlow from "./booking-flow";
import {
  CONSULTATION_FEE_IDR,
  CONSULTATION_TIME_SLOTS,
} from "@/lib/consultations/constants";
import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";
const OG_IMAGE =
  "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";

export const metadata: Metadata = {
  title: "Konsultasi Kopi untuk Cafe di Jakarta Selatan — Agroastery",
  description:
    "Konsultasi kopi 2 jam di roastery Jakarta Selatan untuk cafe — diskusi menu, cicip blend, dan penawaran harga wholesale. Peralatan profesional: espresso machine, EK43, Mazzer Super Jolly.",
  alternates: { canonical: "/konsultasi" },
  openGraph: {
    title: "Konsultasi Kopi untuk Cafe di Jakarta Selatan — Agroastery",
    description:
      "Diskusi menu, cicip blend, dan penawaran harga wholesale dalam sesi privat 2 jam di roastery Agroastery, Jakarta Selatan.",
    url: "/konsultasi",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Bar espresso dan grinder EK43 di Agroastery, Jakarta Selatan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konsultasi Kopi untuk Cafe — Agroastery",
    description:
      "Diskusi menu, cicip blend, dan penawaran harga wholesale dalam sesi privat 2 jam di roastery Agroastery, Jakarta Selatan.",
    images: [OG_IMAGE],
  },
};

/** Latest session end: last slot start + 2-hour session. */
const LAST_SLOT_START = CONSULTATION_TIME_SLOTS[CONSULTATION_TIME_SLOTS.length - 1];
const SESSION_CLOSE = `${String(Number(LAST_SLOT_START.split(":")[0]) + 2).padStart(2, "0")}:00`;

function consultationJsonLd() {
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

export default function KonsultasiPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={consultationJsonLd()}
      />
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <BookingFlow />
      </main>
    </div>
  );
}
