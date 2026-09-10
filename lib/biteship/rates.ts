import {
  BiteshipRatesResponseSchema,
  type BiteshipPricing,
  type ShippingCalcItem,
} from "@/lib/types/shipping";

const BITESHIP_RATES_URL = "https://api.biteship.com/v1/rates/couriers";
const RATES_TIMEOUT_MS = 10_000;

export type FetchRatesParams = {
  originPostalCode: number;
  /** Origin geo (#151): required for Biteship to return geo-dispatch
   * couriers (instant/sameday). Send whenever the client quote sends it. */
  originLatitude?: number;
  originLongitude?: number;
  destinationPostalCode?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  couriers: string;
  items: ShippingCalcItem[];
};

/**
 * Server-side call to Biteship /rates/couriers.
 * Throws on missing key, network error, timeout, or non-OK response.
 */
export async function fetchBiteshipRates(params: FetchRatesParams): Promise<BiteshipPricing[]> {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error("[biteship/rates] BITESHIP_API_KEY is not configured");

  const body: Record<string, unknown> = {
    origin_postal_code: params.originPostalCode,
    couriers: params.couriers,
    items: params.items,
  };
  // #151: geo-dispatch couriers (instant/sameday) are only priced by Biteship
  // when the request carries origin coordinates — the client selector sends
  // them via /api/shipping/rates, so the server re-quote must send the same.
  if (
    typeof params.originLatitude === "number" &&
    Number.isFinite(params.originLatitude) &&
    typeof params.originLongitude === "number" &&
    Number.isFinite(params.originLongitude)
  ) {
    body.origin_latitude = params.originLatitude;
    body.origin_longitude = params.originLongitude;
  }
  const hasGeo =
    typeof params.destinationLatitude === "number" &&
    Number.isFinite(params.destinationLatitude) &&
    typeof params.destinationLongitude === "number" &&
    Number.isFinite(params.destinationLongitude);
  if (hasGeo) {
    body.destination_latitude = params.destinationLatitude;
    body.destination_longitude = params.destinationLongitude;
  } else if (typeof params.destinationPostalCode === "number") {
    body.destination_postal_code = params.destinationPostalCode;
  } else {
    throw new Error("[biteship/rates] destination requires postal code or lat/lng pair");
  }

  const res = await fetch(BITESHIP_RATES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(RATES_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[biteship/rates] error:", res.status, text);
    throw new Error(`[biteship/rates] Biteship returned ${res.status}`);
  }

  const json = await res.json();
  const parsed = BiteshipRatesResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[biteship/rates] unparseable response:", parsed.error.format());
    throw new Error("[biteship/rates] invalid Biteship response");
  }
  return parsed.data.pricing;
}

/**
 * Find the pricing entry for a courier+service pair from a fresh quote.
 * Returns undefined when the pair is no longer offered.
 */
export function findRateMatch(
  pricing: BiteshipPricing[],
  courierCode: string,
  serviceCode: string
): BiteshipPricing | undefined {
  return pricing.find(
    (p) => p.courier_code === courierCode && p.courier_service_code === serviceCode
  );
}
