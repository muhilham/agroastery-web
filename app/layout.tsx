import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { WebVitals } from "@/components/WebVitals";
import "./globals.css";
import "../style/embla.css";

export const metadata: Metadata = {
  title: "Biji Kopi Specialty untuk Cafe — Agroastery",
  description:
    "Supplier biji kopi specialty untuk cafe di Jakarta Selatan. 100.000+ order, rating 5.0. Konsultasi menu gratis. Belanja langsung dari roastery.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com"),
  openGraph: {
    url: "/",
    title: "Biji Kopi Specialty untuk Cafe — Agroastery",
    description:
      "Supplier biji kopi specialty untuk cafe di Jakarta Selatan. 100.000+ order, rating 5.0. Konsultasi menu gratis. Belanja langsung dari roastery.",
    images: [
      {
        url: "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e",
        width: 1200,
        height: 630,
        alt: "Agroastery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Biji Kopi Specialty untuk Cafe — Agroastery",
    description:
      "Supplier biji kopi specialty untuk cafe di Jakarta Selatan. 100.000+ order, rating 5.0. Konsultasi menu gratis. Belanja langsung dari roastery.",
    images: [
      "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e",
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="id">
      <head>
        {/* Preconnect to third-party origins used at checkout */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.gstatic.com" />
      </head>
      <body className="bg-background" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>
        {children}
        <WebVitals />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
