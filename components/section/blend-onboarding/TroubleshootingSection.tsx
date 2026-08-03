"use client";

import { troubleshooting, trackBlendEvent } from "@/lib/data/blend-50-50";
import { TroubleshootingCard } from "./TroubleshootingCard";
import { ViewTracker } from "./ViewTracker";

export function TroubleshootingSection() {
  return (
    <ViewTracker onView={() => trackBlendEvent("troubleshooting_viewed", undefined)}>
      <section className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-xl font-semibold">Troubleshooting</h2>
          <div className="mt-6 space-y-4">
            {troubleshooting.map((item) => (
              <TroubleshootingCard key={item.question} item={item} />
            ))}
          </div>
        </div>
      </section>
    </ViewTracker>
  );
}
