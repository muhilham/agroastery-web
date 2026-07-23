import Navigation from "@/components/navigation";
import BookingFlow from "./booking-flow";

export const metadata = {
  title: "Konsultasi Kopi — Agroastery",
  description:
    "Konsultasi 2 jam dengan peralatan profesional kami: espresso machine, EK43, Mazzer Super Jolly.",
};

export default function KonsultasiPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-10">
        <BookingFlow />
      </main>
    </div>
  );
}
