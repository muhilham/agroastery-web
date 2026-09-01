"use client";

import { numberToIdr } from "@/lib/numberToIdr";
import type { NormalizedRate } from "@/lib/types/shipping";
import { ChevronDown } from "lucide-react";

interface ShippingSelectorProps {
  shippingRates: NormalizedRate[];
  selectedShipping: NormalizedRate | null;
  onSelect: (rate: NormalizedRate | null) => void;
}

export default function ShippingSelector({
  shippingRates,
  selectedShipping,
  onSelect,
}: ShippingSelectorProps) {
  const sortedRates = [...shippingRates].sort((a, b) => a.price - b.price);

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
        <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Opsi Pengiriman</h2>
      </div>
      <div className="relative">
        <select
          value={selectedShipping?.code ?? ""}
          onChange={(e) => {
            const rate = sortedRates.find((r) => r.code === e.target.value) ?? null;
            onSelect(rate);
          }}
          className="w-full bg-[#1e1e1e] text-primary border border-white/10 rounded-lg px-3 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer text-sm"
        >
          <option value="" disabled>
            Pilih opsi pengiriman
          </option>
          {sortedRates.map((rate) => {
            const label = `${rate.carrier} ${rate.service} — ${numberToIdr({ nominal: rate.price })} (Tiba ${rate.eta || "N/A"})`;
            return (
              <option key={rate.code} value={rate.code} className="bg-[#1e1e1e] text-primary">
                {label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
      </div>
      {selectedShipping && (
        <div className="flex items-center justify-between gap-3 p-3 tablet:p-4 rounded-lg border border-primary/40 bg-primary/10 min-h-[3.5rem] relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
          <div className="flex flex-col min-w-0 gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 rounded px-1.5 py-0.5 text-[#CCC4A9]/70 shrink-0">
                {selectedShipping.carrier}
              </span>
              <span className="text-sm font-medium text-primary truncate">{selectedShipping.service}</span>
            </div>
            <span className="text-xs text-secondary">Tiba {selectedShipping.eta || "N/A"}</span>
          </div>
          <span className="text-sm font-semibold shrink-0 text-primary">{numberToIdr({ nominal: selectedShipping.price })}</span>
        </div>
      )}
    </div>
  );
}
