import type { Metadata } from "next";
import CheckoutPageContent from "./checkout-page-content";

export const metadata: Metadata = {
  title: "Checkout | Agroastery",
  description: "Selesaikan pemesanan kopi spesialti Anda",
  // Issue #177: make follow explicit — "noindex, follow" (was bare index:false).
  robots: { index: false, follow: true },
  alternates: { canonical: "/checkout" },
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
