import { Suspense } from "react";
import Navigation from "@/components/navigation";
import { RestingPeriod } from "@/components/resting-period";

export const metadata = {
  title: "Resting Period — Agroastery",
  description:
    "Track your coffee's resting period: see days 3, 7, 14, and 21 after roast, and which rest day today is.",
};

export default function RestingPeriodPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <Suspense fallback={null}>
          <RestingPeriod />
        </Suspense>
      </main>
    </div>
  );
}
