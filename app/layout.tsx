import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { WebVitals } from "@/components/WebVitals";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import "./globals.css";
import "../style/embla.css";

export const metadata: Metadata = {
  title: "Agroastery",
  description:
    "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com"),
  openGraph: {
    title: "Agroastery",
    description:
      "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
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
    title: "Agroastery",
    description:
      "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
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
    <html lang="en">
      <head>
        {/* Preconnect to third-party origins used at checkout */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.gstatic.com" />
      </head>
      <body className="bg-background" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>
        {children}
        <WebVitals />
        <FloatingWhatsApp phone={process.env.ORIGIN_CONTACT_PHONE?.replace(/^\+/, "") ?? "628****2726"} />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
