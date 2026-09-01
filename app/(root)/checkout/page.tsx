import type { Metadata } from "next";
import CheckoutPageContent from "./checkout-page-content";

export const metadata: Metadata = {
  title: "Checkout | Agroastery",
  description: "Selesaikan pemesanan kopi spesialti Anda",
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
