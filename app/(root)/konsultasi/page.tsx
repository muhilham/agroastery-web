import Navigation from "@/components/navigation";
import BookingFlow from "./booking-flow";
import { consultationJsonLd } from "@/lib/consultations/jsonld";
import type { Metadata } from "next";

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
