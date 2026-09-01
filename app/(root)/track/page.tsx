import type { Metadata } from "next";
import TrackPageContent from "./track-page-content";

export const metadata: Metadata = {
  title: "Lacak Pesanan | Agroastery",
  description: "Lacak status pengiriman pesanan kopi Anda",
};

export default function TrackPage() {
  return <TrackPageContent />;
}
