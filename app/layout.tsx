import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400"],
});


export const metadata: Metadata = {
  title: "Agroastery",
  description: "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
  openGraph: {
    title: "Agroastery",
    description: "t AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
    images: [
      {
        url: "https://agroastery.com/api/og",
        width: 1200,
        height: 630,
        alt: "Agroastery",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
