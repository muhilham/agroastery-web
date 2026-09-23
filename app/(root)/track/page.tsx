import type { Metadata } from "next";
import TrackPageContent from "./track-page-content";

export const metadata: Metadata = {
  title: "Lacak Pesanan | Agroastery",
  description: "Lacak status pengiriman pesanan kopi Anda",
  // Issue #177: order tracking is private — noindex, keep links crawlable.
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return <TrackPageContent />;
}
