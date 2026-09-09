import type { ShippingCalcItem } from "@/lib/types/shipping";

/** Package dimensions used for quotes AND the Biteship draft order (lib/biteship/createDraft.ts).
 * Keep these in lockstep — a quote with different dims than the actual shipment
 * produces volumetric-weight mismatches. */
export const QUOTE_ITEM_DIMS = { length: 20, width: 15, height: 10 } as const;

export const QUOTE_MIN_WEIGHT_GRAMS = 100;

/** Courier lists used for checkout quotes — shared by the page (client quote)
 * and /api/checkout (server re-quote) so both request the same set.
 * Instant couriers only resolve for geo destinations. */
export const CHECKOUT_COURIERS_POSTAL = "anteraja,jne,sicepat";
export const CHECKOUT_COURIERS_GEO = "anteraja,jne,sicepat,lalamove,grab,gojek";

export type QuoteLine = {
  name: string;
  /** Declared unit price (IDR). */
  unitPrice: number;
  /** Per-unit ship weight from the variant (grams). */
  weightGramsPerUnit: number;
  quantity: number;
};

/**
 * Build Biteship quote items for a cart: one entry per cart LINE with the
 * line's TOTAL weight (weightPerUnit × qty) and quantity collapsed to 1.
 *
 * Why collapse quantity: Biteship computes billable weight as weight ×
 * quantity per item. Passing per-unit weight with real quantity double-counts
 * the package weight once per unit; passing totalized weight with quantity 1
 * prices exactly one physical parcel for that line. (Verified live against
 * /v1/rates/couriers — see issue #138.)
 */
export function buildQuoteItems(lines: QuoteLine[]): ShippingCalcItem[] {
  return lines.map(({ name, unitPrice, weightGramsPerUnit, quantity }) => ({
    name,
    description: name,
    value: Math.max(0, Math.trunc(unitPrice * quantity)),
    weight: Math.max(QUOTE_MIN_WEIGHT_GRAMS, Math.trunc(weightGramsPerUnit * quantity)),
    quantity: 1,
    ...QUOTE_ITEM_DIMS,
  }));
}
