import Navigation from "@/components/navigation";
import BookingFlow from "./booking-flow";

export const metadata = {
  title: "Konsultasi Kopi — Agroastery",
  description:
    "Konsultasi kopi 2 jam di Jakarta Selatan untuk cafe — diskusi menu, coba blend, penawaran harga wholesale. Peralatan profesional: espresso machine, EK43, Mazzer Super Jolly.",
  alternates: { canonical: "/konsultasi" },
};

function jsonLdSchema() {
  return {
    __html: JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Konsultasi Kopi untuk Cafe",
        description:
          "Konsultasi kopi 2 jam di Jakarta Selatan untuk cafe — diskusi menu, coba blend, penawaran harga wholesale.",
        provider: {
          "@type": "LocalBusiness",
          name: "Agroastery",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Jl. Kemang Barat No.7I",
            addressLocality: "Jakarta Selatan",
            addressRegion: "DKI Jakarta",
            postalCode: "12730",
            addressCountry: "ID",
          },
          telephone: "+628979092726",
          openingHours: "Mo-Su 10:00-20:00",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Agroastery",
        image:
          "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Jl. Kemang Barat No.7I",
          addressLocality: "Jakarta Selatan",
          addressRegion: "DKI Jakarta",
          postalCode: "12730",
          addressCountry: "ID",
        },
        telephone: "+628979092726",
        openingHours: "Mo-Su 10:00-20:00",
        priceRange: "Rp30,000-Rp150,000",
      },
    ]),
  };
}

export default function KonsultasiPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdSchema()} />
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <BookingFlow />
      </main>
    </div>
  );
}
