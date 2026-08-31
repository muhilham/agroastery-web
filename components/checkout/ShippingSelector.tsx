"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { numberToIdr } from "@/lib/numberToIdr";
import type { NormalizedRate } from "@/lib/types/shipping";

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
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
        <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Opsi Pengiriman</h2>
      </div>
      <RadioGroup
        onValueChange={(value) => {
          const rate = shippingRates.find((r) => r.code === value) ?? null;
          onSelect(rate);
        }}
        className="space-y-2"
      >
        {shippingRates.map((rate, index) => {
          const key = `${rate.code}-${rate.price}-${index}`;
          return (
            <FormItem key={key}>
              <FormControl>
                <RadioGroupItem value={rate.code} id={key} className="sr-only" />
              </FormControl>
              <FormLabel
                htmlFor={key}
                className={`flex items-center justify-between gap-3 p-3 tablet:p-4 rounded-lg border cursor-pointer transition-all min-h-[3.5rem] relative overflow-hidden ${
                  selectedShipping?.code === rate.code
                    ? "border-primary/40 bg-primary/10"
                    : "border-white/10 bg-[#1e1e1e] active:bg-white/5"
                }`}
              >
                {selectedShipping?.code === rate.code && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                <div className="flex flex-col min-w-0 gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 rounded px-1.5 py-0.5 text-[#CCC4A9]/70 shrink-0">
                      {rate.carrier}
                    </span>
                    <span className="text-sm font-medium text-primary truncate">{rate.service}</span>
                  </div>
                  <span className="text-xs text-secondary">Tiba {rate.eta || "N/A"}</span>
                </div>
                <span className="text-sm font-semibold shrink-0 text-primary">{numberToIdr({ nominal: rate.price })}</span>
              </FormLabel>
            </FormItem>
          );
        })}
      </RadioGroup>
    </div>
  );
}
