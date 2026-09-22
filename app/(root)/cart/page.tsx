import type { Metadata } from "next";
import CartPageContent from "./cart-page-content";

export const metadata: Metadata = {
  title: "Keranjang Belanja | Agroastery",
  description: "Keranjang belanja kopi spesialti Anda",
  // Issue #177: make follow explicit — "noindex, follow".
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return <CartPageContent />;
}
