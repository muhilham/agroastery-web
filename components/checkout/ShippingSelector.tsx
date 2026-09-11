"use client";

import { useEffect, useMemo, useState } from "react";
import { numberToIdr } from "@/lib/numberToIdr";
import { formatEta, joinCarrierService } from "@/lib/shipping/labels";
import type { NormalizedRate } from "@/lib/types/shipping";
import { Check } from "lucide-react";

interface ShippingSelectorProps {
  shippingRates: NormalizedRate[];
  selectedShipping: NormalizedRate | null;
  onSelect: (rate: NormalizedRate | null) => void;
  /** Quote in flight — announced to assistive tech via aria-live (#157). */
  isLoading?: boolean;
}

/** Rates visible before the "Lihat N opsi lainnya" collapse (#157, Hick's Law). */
const VISIBLE_COUNT = 4;

export default function ShippingSelector({
  shippingRates,
  selectedShipping,
  onSelect,
  isLoading = false,
}: ShippingSelectorProps) {
  const sortedRates = useMemo(
    () => [...shippingRates].sort((a, b) => a.price - b.price),
    [shippingRates]
  );

  // Collapse resets whenever a new quote arrives. Per React's "adjusting
  // state when props change" pattern, this is done during render (not in an
  // effect — the react-hooks lint rule flags effects that setState).
  const [prevRates, setPrevRates] = useState(shippingRates);
  const [showAll, setShowAll] = useState(false);
  if (prevRates !== shippingRates) {
    setPrevRates(shippingRates);
    setShowAll(false);
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

  // A selection ranked below VISIBLE_COUNT must never be hidden: an
  // unchecked-looking radiogroup whose price still flows to totals/payload
  // is worse than no collapse. Adversarial review on #158.
  const selectionInWindow =
    !!selectedShipping &&
    sortedRates.slice(0, VISIBLE_COUNT).some((r) => r.code === selectedShipping.code);
  const expanded = showAll || (!!selectedShipping && !selectionInWindow);
  const visible = expanded ? sortedRates : sortedRates.slice(0, VISIBLE_COUNT);
  const hiddenCount = sortedRates.length - visible.length;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
        <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Opsi Pengiriman</h2>
      </div>

      {/* Loading announcement for screen readers; visible spinner stays with
          the postal input in CheckoutForm. */}
      <div aria-live="polite" className="sr-only">
        {isLoading
          ? "Menghitung ongkir..."
          : sortedRates.length > 0
            ? `${sortedRates.length} opsi pengiriman tersedia`
            : ""}
      </div>

      {sortedRates.length > 0 && (
        <div role="radiogroup" aria-label="Opsi pengiriman" className="space-y-2">
          {visible.map((rate, i) => {
            const selected = selectedShipping?.code === rate.code;
            const inputId = `shipping-rate-${rate.code}`;
            const eta = formatEta(rate.eta);
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
                    {i === 0 && sortedRates.length > 1 ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                        Termurah
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

          {hiddenCount > 0 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full text-sm text-primary underline underline-offset-4 py-2"
            >
              Lihat {hiddenCount} opsi lainnya
            </button>
          )}
        </div>
      )}
    </div>
  );
}
