import type { Metadata } from "next";
import CartPageContent from "./cart-page-content";

export const metadata: Metadata = {
  title: "Keranjang Belanja | Agroastery",
  description: "Keranjang belanja kopi spesialti Anda",
};

export default function CartPage() {
  return <CartPageContent />;
}
