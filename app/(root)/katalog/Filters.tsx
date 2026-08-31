"use client";

import { useState, useTransition, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const inStock = searchParams.get("inStock") === "true";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "false") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const query = params.toString();
      startTransition(() => {
        router.push(`${pathname}${query ? `?${query}` : ""}`);
      });
    },
    [pathname, router, searchParams],
  );

  const hasFilters = minPrice || maxPrice || inStock;

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("inStock");
    const query = params.toString();
    startTransition(() => {
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
            hasFilters
              ? "border-primary bg-[#f5ebc9]/10 text-primary"
              : "border-primary/50 text-primary/70 hover:border-primary hover:text-primary"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {hasFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">
              {[minPrice, maxPrice, inStock].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-primary/70 hover:text-primary"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
        {isPending && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#CCC4A9]/30 border-t-[#CCC4A9]" />
        )}
      </div>

      {isOpen && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-[#242424] p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-primary">Rentang Harga (IDR)</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  className="w-full rounded-xl bg-[#1a1a1a] text-[#CCC4A9] placeholder:text-[#CCC4A9]/50"
                  value={minPrice}
                  onChange={(e) => updateParams({ minPrice: e.target.value })}
                />
                <span className="text-[#CCC4A9]/50">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  min={0}
                  className="w-full rounded-xl bg-[#1a1a1a] text-[#CCC4A9] placeholder:text-[#CCC4A9]/50"
                  value={maxPrice}
                  onChange={(e) => updateParams({ maxPrice: e.target.value })}
                />
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={inStock}
                  onChange={(e) =>
                    updateParams({ inStock: e.target.checked ? "true" : null })
                  }
                />
                <div className="h-6 w-11 rounded-full bg-[#1a1a1a] border border-primary/30 peer-checked:bg-primary peer-checked:border-primary transition-colors" />
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-[#CCC4A9]/50 transition-transform peer-checked:translate-x-5 peer-checked:bg-black" />
              </div>
              <span className="text-sm text-[#CCC4A9]">Hanya tersedia</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
