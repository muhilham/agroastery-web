import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBiteshipRates } from "./rates";
import { checkoutOriginGeo, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@/lib/checkout/shippingQuote";

function okResponse() {
  return new Response(
    JSON.stringify({ success: true, pricing: [] }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

describe("fetchBiteshipRates (#151 origin geo)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv("BITESHIP_API_KEY", "test_key");
    fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function sentBody(): Record<string, unknown> {
    return JSON.parse(fetchMock.mock.calls[0][1].body);
  }

  it("includes origin_latitude/longitude when provided", async () => {
    await fetchBiteshipRates({
      originPostalCode: 12440,
      originLatitude: -6.26,
      originLongitude: 106.81,
      destinationLatitude: -6.2,
      destinationLongitude: 106.8,
      couriers: "gojek",
      items: [{ name: "Kopi", value: 1000, weight: 1000, quantity: 1, length: 20, width: 15, height: 10 }],
    });
    expect(sentBody().origin_latitude).toBe(-6.26);
    expect(sentBody().origin_longitude).toBe(106.81);
  });

  it("omits origin geo when not provided (postal-only quote)", async () => {
    await fetchBiteshipRates({
      originPostalCode: 12440,
      destinationPostalCode: 40115,
      couriers: "jne",
      items: [{ name: "Kopi", value: 1000, weight: 1000, quantity: 1, length: 20, width: 15, height: 10 }],
    });
    expect(sentBody().origin_latitude).toBeUndefined();
  });
});

describe("checkoutOriginGeo (#151)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to the roastery coordinates (shared by client + server quote paths)", () => {
    vi.stubEnv("ORIGIN_LATITUDE", "");
    vi.stubEnv("ORIGIN_LONGITUDE", "");
    expect(checkoutOriginGeo()).toEqual({
      originLatitude: DEFAULT_ORIGIN_LAT,
      originLongitude: DEFAULT_ORIGIN_LNG,
    });
  });

  it("honours env overrides", () => {
    vi.stubEnv("ORIGIN_LATITUDE", "-7.1");
    vi.stubEnv("ORIGIN_LONGITUDE", "110.2");
    expect(checkoutOriginGeo()).toEqual({ originLatitude: -7.1, originLongitude: 110.2 });
  });

  it("returns null for non-numeric overrides (parity: both paths omit geo)", () => {
    vi.stubEnv("ORIGIN_LATITUDE", "abc");
    expect(checkoutOriginGeo()).toBeNull();
  });
});
