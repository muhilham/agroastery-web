import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400"],
});

export const metadata: Metadata = {
  title: "AGROASTERY",
  description:
    "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
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
      "At AGROASTERY w`e are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
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
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
