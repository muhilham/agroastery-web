"use client";

import { useEffect, useMemo, useState } from "react";
import { numberToIdr } from "@/lib/numberToIdr";
import {
  classifyRateGroup,
  etaFloorHours,
  formatEta,
  joinCarrierService,
} from "@/lib/shipping/labels";
import type { NormalizedRate } from "@/lib/types/shipping";
import { Check } from "lucide-react";

interface ShippingSelectorProps {
  shippingRates: NormalizedRate[];
  selectedShipping: NormalizedRate | null;
  onSelect: (rate: NormalizedRate | null) => void;
  /** Quote in flight — announced to assistive tech via aria-live (#157). */
  isLoading?: boolean;
}

/** Rates visible per section before its "Lihat N opsi lainnya" collapse
 * (#160; was 4 globally in #157). */
const SECTION_VISIBLE_COUNT = 3;

type SectionKey = "instan" | "reguler";

export default function ShippingSelector({
  shippingRates,
  selectedShipping,
  onSelect,
  isLoading = false,
}: ShippingSelectorProps) {
  // Price-ascending globally: index 0 is the cheapest rate, and within each
  // section the same order holds.
  const sortedRates = useMemo(
    () => [...shippingRates].sort((a, b) => a.price - b.price),
    [shippingRates]
  );

  // Two sections, instan first when non-empty (issue #160). Empty sections
  // never render a header (postal path = Reguler only, no dead ends).
  const sections = useMemo(() => {
    const instan = sortedRates.filter((r) => classifyRateGroup(r) === "instan");
    const reguler = sortedRates.filter((r) => classifyRateGroup(r) === "reguler");
    const out: { key: SectionKey; label: string; rates: NormalizedRate[] }[] = [];
    if (instan.length > 0) out.push({ key: "instan", label: "Instan", rates: instan });
    if (reguler.length > 0) out.push({ key: "reguler", label: "Reguler", rates: reguler });
    return out;
  }, [sortedRates]);

  // Collapse state resets whenever a new quote arrives. Per React's
  // "adjusting state when props change" pattern: during render, not in an
  // effect (react-hooks lint flags setState-in-effect).
  const [prevRates, setPrevRates] = useState(shippingRates);
  const [showAll, setShowAll] = useState<Record<SectionKey, boolean>>({
    instan: false,
    reguler: false,
  });
  if (prevRates !== shippingRates) {
    setPrevRates(shippingRates);
    setShowAll({ instan: false, reguler: false });
  }

  // Selection sync (#157): nothing valid selected → pre-select the cheapest.
  // A selection whose code still exists in a re-quote but whose PRICE or ETA
  // changed (cart weight shift) is re-seeded with the fresh object —
  // preserve-by-code alone would keep the stale NormalizedRate, and the page
  // totals/pay payload read selectedShipping.price directly.
  useEffect(() => {
    if (sortedRates.length === 0) return;
    const match = selectedShipping
      ? sortedRates.find((r) => r.code === selectedShipping.code)
      : undefined;
    if (!match) {
      onSelect(sortedRates[0]);
    } else if (
      match.price !== selectedShipping!.price ||
      match.eta !== selectedShipping!.eta
    ) {
      onSelect(match);
    }
  }, [sortedRates, selectedShipping, onSelect]);

  // Badge targets (#160): Termurah = global cheapest, Tercepat = lowest ETA
  // floor. One badge per card MAX (F4/Von Restorff): when both land on the
  // same card, Tercepat wins — speed is the rarer information.
  const cheapestCode = sortedRates.length > 1 ? sortedRates[0].code : null;
  const fastestCode = useMemo(() => {
    if (sortedRates.length < 2) return null;
    let best: NormalizedRate | null = null;
    let bestFloor = Infinity;
    for (const r of sortedRates) {
      const floor = etaFloorHours(r.eta);
      if (floor < bestFloor) {
        best = r;
        bestFloor = floor;
      }
    }
    return bestFloor === Infinity ? null : best!.code;
  }, [sortedRates]);

  // Skeleton rows while the FIRST quote is in flight (no stale list to
  // preserve); a re-quote keeps the old list visible (dimmed via aria-busy)
  // so cart tweaks never flash the section empty.
  const showSkeletons = isLoading && sortedRates.length === 0;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
        <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Opsi Pengiriman</h2>
      </div>

      {/* Loading announcement for screen readers (#157). Fires once per quote
          — fetch resolves atomically, so no per-card churn (#160 F3). */}
      <div aria-live="polite" className="sr-only">
        {isLoading
          ? "Menghitung ongkir..."
          : sortedRates.length > 0
            ? `${sortedRates.length} opsi pengiriman tersedia`
            : ""}
      </div>

      {showSkeletons && (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: SECTION_VISIBLE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-[#1e1e1e] border border-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {!showSkeletons && sortedRates.length > 0 && (
        /* ONE radiogroup (issue #160 F1): shared radio name means arrow
           navigation follows visual top-to-bottom order across section
           headers — native behavior, deliberately NOT rebuilt as nested
           groups or a custom roving-tabindex controller. Section headers are
           plain h3s. */
        <div
          role="radiogroup"
          aria-label="Opsi pengiriman"
          aria-busy={isLoading}
          className="space-y-2"
        >
          {sections.map((section) => {
            // Force-expand when the selection falls outside this section's
            // window: an unchecked-looking radiogroup whose price flows to
            // totals/payload is worse than no collapse (#158 regression,
            // preserved per-section for #160).
            const selectionHere =
              !!selectedShipping &&
              section.rates.some((r) => r.code === selectedShipping.code);
            const selectionInWindow =
              !!selectedShipping &&
              section.rates
                .slice(0, SECTION_VISIBLE_COUNT)
                .some((r) => r.code === selectedShipping.code);
            const sectionExpanded =
              showAll[section.key] || (selectionHere && !selectionInWindow);
            const visible = sectionExpanded
              ? section.rates
              : section.rates.slice(0, SECTION_VISIBLE_COUNT);
            const hiddenCount = section.rates.length - visible.length;

            return (
              <div key={section.key} className="space-y-2">
                {sections.length > 1 && (
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#CCC4A9]/60 pt-1">
                    {section.label}
                  </h3>
                )}
                {visible.map((rate) => {
                  const selected = selectedShipping?.code === rate.code;
                  const inputId = `shipping-rate-${rate.code}`;
                  const eta = formatEta(rate.eta);
                  const badge =
                    rate.code === fastestCode
                      ? "Tercepat"
                      : rate.code === cheapestCode
                        ? "Termurah"
                        : null;
                  return (
                    <label
                      key={rate.code}
                      htmlFor={inputId}
                      className={`flex items-center gap-3 rounded-lg border p-3 min-h-[48px] cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/60 ${
                        selected
                          ? "border-primary/40 bg-primary/10"
                          : "border-white/10 bg-[#1e1e1e] hover:border-white/25"
                      }`}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name="shipping-rate"
                        value={rate.code}
                        checked={selected}
                        onChange={() => onSelect(rate)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                          selected ? "border-primary bg-primary" : "border-white/30"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-[#1a1a1a]" />}
                      </span>
                      <span className="flex flex-col min-w-0 gap-0.5 flex-1">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-primary truncate">
                            {joinCarrierService(rate.carrier, rate.service)}
                          </span>
                        </span>
                        <span className="text-xs text-secondary">
                          {eta ? `Tiba ${eta}` : "Estimasi tiba tidak tersedia"}
                          {badge ? (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                              {badge}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="text-sm font-semibold shrink-0 text-primary">
                        {numberToIdr({ nominal: rate.price })}
                      </span>
                    </label>
                  );
                })}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAll((prev) => ({ ...prev, [section.key]: true }))}
                    className="w-full text-sm text-primary underline underline-offset-4 py-2"
                  >
                    Lihat {hiddenCount} opsi {section.label.toLowerCase()} lainnya
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
