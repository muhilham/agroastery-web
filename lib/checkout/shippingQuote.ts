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

/** Roastery coordinates (Kemang) — used as origin geo fallback (#151). */
export const DEFAULT_ORIGIN_LAT = -6.263450138760574;
export const DEFAULT_ORIGIN_LNG = 106.81945752406575;

/**
 * Single source for the roastery origin postal (issue #154 D). Server paths
 * may set ORIGIN_POSTAL_CODE; the browser only has NEXT_PUBLIC_* (inlined at
 * build), and the public rates proxy whitelists against this same value.
 * Blank-safe (#139 trap); falls back to the Jakarta roastery postal.
 */
export function checkoutOriginPostal(): number {
  const raw =
    process.env.ORIGIN_POSTAL_CODE ?? process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE;
  const t = (raw ?? "").trim();
  const n = Number(t === "" ? 12440 : t);
  return Number.isFinite(n) ? n : 12440;
}

/**
 * Origin lat/lng for checkout quotes. Biteship only returns geo-dispatch
 * couriers (gojek/grab/lalamove instant & sameday) when the rates request
 * carries origin coordinates — postal alone hides them (verified live,
 * issue #151). BOTH the client selector (/api/shipping/rates) and the
 * server re-quote (/api/checkout) must send identical origin geo, or buyers
 * get offered rates the server can never match. Override via
 * ORIGIN_LATITUDE / ORIGIN_LONGITUDE; null when overrides are non-numeric.
 */
export function checkoutOriginGeo():
  | { originLatitude: number; originLongitude: number }
  | null {
  // Blank env vars mean "not set" (Number("") === 0 would pin the origin to
  // null island); a present-but-non-numeric override disables geo for BOTH
  // quote paths so client and server can never disagree.
  const raw = (v: string | undefined, fallback: number) => {
    const t = (v ?? "").trim();
    return t === "" ? String(fallback) : t;
  };
  const lat = Number(raw(process.env.ORIGIN_LATITUDE, DEFAULT_ORIGIN_LAT));
  const lng = Number(raw(process.env.ORIGIN_LONGITUDE, DEFAULT_ORIGIN_LNG));
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? { originLatitude: lat, originLongitude: lng }
    : null;
}

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
