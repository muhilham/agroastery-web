import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { checkoutOriginGeo, CHECKOUT_COURIERS_GEO } from "@/lib/checkout/shippingQuote";

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom, rpc: mockRpc }),
  createSupabaseServerClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
  }),
}));

const mockCreateQrisPaymentSession = vi.fn();
vi.mock("@/lib/pivot/client", () => ({
  createQrisPaymentSession: (...a: unknown[]) => mockCreateQrisPaymentSession(...a),
}));

vi.mock("@/lib/telegram/notify", () => ({
  sendOrderNotification: vi.fn(),
}));

vi.mock("@/lib/supabase/queries/discounts", () => ({
  getActiveGlobalDiscounts: vi.fn().mockResolvedValue([]),
  getActiveProductDiscounts: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/utils/discount", () => ({
  calculateDiscountedPrice: vi.fn().mockImplementation((price: number) => ({ discountedPrice: price, appliedDiscounts: [] })),
}));

vi.mock("@/lib/checkout/validateShippingCost", () => ({
  isShippingCostInvalid: vi.fn().mockReturnValue(false),
}));

const mockFetchBiteshipRates = vi.fn();
vi.mock("@/lib/biteship/rates", async () => {
  const actual = await vi.importActual<typeof import("@/lib/biteship/rates")>("@/lib/biteship/rates");
  return {
    ...actual,
    fetchBiteshipRates: (...a: unknown[]) => mockFetchBiteshipRates(...a),
  };
});

const mockValidateStockAvailability = vi.fn();
const mockDecrementStock = vi.fn();

vi.mock("@/lib/checkout/stockValidation", () => ({
  validateStockAvailability: (...a: unknown[]) => mockValidateStockAvailability(...a),
  decrementStock: (...a: unknown[]) => mockDecrementStock(...a),
}));

import { POST } from "./route";

const baseBody = {
  items: [{ variantId: "11111111-1111-1111-1111-111111111111", quantity: 1 }],
  customerName: "Budi",
  customerPhone: "081234567890",
  shippingAddress: {
    recipientName: "Budi",
    phone: "081234567890",
    addressLine: "Jl. Contoh No. 1",
    postalCode: "40115",
  },
  shippingCourier: "jne",
  shippingService: "reg",
  shippingCost: 15000,
};

function checkoutReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout", () => {
  let lastOrderInsert: Record<string, unknown> | null = null;

  beforeEach(() => {
    lastOrderInsert = null;
    vi.clearAllMocks();
    mockValidateStockAvailability.mockReturnValue({ valid: true });
    mockDecrementStock.mockResolvedValue({ success: true });
    // Default: a fresh quote agreeing with baseBody.shippingCost (15000),
    // so legacy tests exercise the happy re-quote path unless overridden.
    mockFetchBiteshipRates.mockResolvedValue([rateEntry(15000)]);
  });

  // ---- Shipping re-quote (issue #138) ----
  const deliveryBody = {
    ...baseBody,
    shippingAddress: { ...baseBody.shippingAddress, postalCode: "40115" },
    shippingCourier: "jne",
    shippingService: "reg",
  };

  function rateEntry(price: number, courier = "jne", service = "reg") {
    return {
      courier_code: courier,
      courier_name: courier.toUpperCase(),
      courier_service_code: service,
      courier_service_name: service.toUpperCase(),
      price,
      currency: "IDR",
    };
  }

  function mockHappyDb() {
    mockFrom.mockImplementation((table: string) => {
      if (table === "product_variants") {
        return { select: () => ({ in: () => Promise.resolve({ data: [{ id: "11111111-1111-1111-1111-111111111111", product_id: "p1", sku: "SKU1", price: 100000, ship_weight_grams: 500, stock_quantity: 10, is_active: true }], error: null }) }) };
      }
      if (table === "products") {
        return { select: () => ({ in: () => Promise.resolve({ data: [{ id: "p1", name: "Kopi Arabika", is_global: true, is_global_discountable: true }], error: null }) }) };
      }
      if (table === "product_variant_option_values") {
        return { select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) };
      }
      if (table === "ecom_orders") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
          insert: (payload: Record<string, unknown>) => {
            lastOrderInsert = payload;
            return { select: () => ({ single: () => Promise.resolve({ data: { id: "order-1", order_number: "AGR-X", total: 115000, status: "pending_payment" }, error: null }) }) };
          },
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      if (table === "ecom_order_items") return { insert: () => Promise.resolve({ error: null }) };
      if (table === "profiles") return { upsert: () => Promise.resolve({ error: null }) };
      return { select: () => Promise.resolve({ data: null, error: null }) };
    });
    mockCreateQrisPaymentSession.mockResolvedValue({
      paymentSessionId: "ps_1", qrUrl: "https://qr.test", qrString: "qr", qrExpiresAt: "2026-08-31T12:00:00Z",
    });
  }

  it("delivery checkout passes when server re-quote matches the submitted cost", async () => {
    mockHappyDb();
    mockFetchBiteshipRates.mockResolvedValue([{ ...rateEntry(15000), duration: "2 - 3 days" }]);

    const res = await POST(checkoutReq({ ...deliveryBody, shippingEtd: "99 days" }));
    expect(res.status).toBe(200);
    const args = mockFetchBiteshipRates.mock.calls[0][0];
    // per-line totalized, qty collapsed to 1, dims 20x15x10
    expect(args.items).toEqual([
      { name: "Kopi Arabika", description: "Kopi Arabika", value: 100000, weight: 500, quantity: 1, length: 20, width: 15, height: 10 },
    ]);
    expect(args.destinationPostalCode).toBe(40115);
    // server-verified etd persisted, not the client-submitted "99 days"
    expect(lastOrderInsert).not.toBeNull();
    expect(lastOrderInsert!.shipping_etd).toBe("2 - 3 days");
    expect(lastOrderInsert!.shipping_cost).toBe(15000);
  });

  it("returns 409 SHIPPING_RATE_STALE when the quoted price drifted", async () => {
    mockHappyDb();
    mockFetchBiteshipRates.mockResolvedValue([rateEntry(18000)]);

    const res = await POST(checkoutReq(deliveryBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("SHIPPING_RATE_STALE");
    expect(json.latestCost).toBe(18000);
    // no order inserted, no payment session
    expect(mockDecrementStock).not.toHaveBeenCalled();
    expect(mockCreateQrisPaymentSession).not.toHaveBeenCalled();
  });

  // #151: Biteship hides geo-dispatch couriers (instant/sameday) without
  // origin coords. The client selector sends them; the server re-quote must
  // send the SAME values or every geo-courier selection 400s forever.
  it("re-quote carries origin geo identical to the client selector (#151)", async () => {
    mockHappyDb();
    mockFetchBiteshipRates.mockResolvedValue([{ ...rateEntry(31000, "gojek", "instant"), duration: "2 hours" }]);

    const geoBody = {
      ...deliveryBody,
      shippingAddress: { ...deliveryBody.shippingAddress, latitude: -6.2018, longitude: 106.8088 },
      shippingCourier: "gojek",
      shippingService: "instant",
      shippingCost: 31000,
    };
    const res = await POST(checkoutReq(geoBody));
    expect(res.status).toBe(200);

    const args = mockFetchBiteshipRates.mock.calls[0][0];
    const origin = checkoutOriginGeo();
    expect(origin).not.toBeNull();
    expect(args.originLatitude).toBe(origin!.originLatitude);
    expect(args.originLongitude).toBe(origin!.originLongitude);
    expect(args.destinationLatitude).toBe(-6.2018);
    expect(args.couriers).toBe(CHECKOUT_COURIERS_GEO);
  });

  it("returns 400 SHIPPING_RATE_UNAVAILABLE when courier pair gone from quote", async () => {
    mockHappyDb();
    mockFetchBiteshipRates.mockResolvedValue([rateEntry(15000, "sicepat", "reg")]);

    const res = await POST(checkoutReq(deliveryBody));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("SHIPPING_RATE_UNAVAILABLE");
  });

  it("returns 503 when Biteship re-quote fails", async () => {
    mockHappyDb();
    mockFetchBiteshipRates.mockRejectedValue(new Error("biteship down"));

    const res = await POST(checkoutReq(deliveryBody));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe("SHIPPING_SERVICE_UNAVAILABLE");
  });

  it("rejects delivery checkout that omits courier+service (no re-quote bypass)", async () => {
    mockHappyDb();
    const res = await POST(checkoutReq({
      ...baseBody,
      shippingCourier: undefined,
      shippingService: undefined,
      shippingCost: 0,
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(mockFetchBiteshipRates).not.toHaveBeenCalled();
    expect(mockDecrementStock).not.toHaveBeenCalled();
  });

  it("returns 400 MISSING_DESTINATION when delivery has courier but no postal/geo", async () => {
    mockHappyDb();
    const res = await POST(checkoutReq({
      ...baseBody,
      shippingAddress: { recipientName: "Budi", phone: "081234567890", addressLine: "Jl. Contoh No. 1", postalCode: "" },
    }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("MISSING_DESTINATION");
    expect(mockFetchBiteshipRates).not.toHaveBeenCalled();
  });

  it("skips re-quote for pickup orders", async () => {
    mockHappyDb();
    const res = await POST(checkoutReq({
      ...baseBody,
      fulfillmentMethod: "pickup",
      shippingCourier: "pickup",
      shippingCost: 0,
    }));
    expect(res.status).toBe(200);
    expect(mockFetchBiteshipRates).not.toHaveBeenCalled();
  });

  it("creates guest checkout with pending_payment status", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "product_variants") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{
                id: "11111111-1111-1111-1111-111111111111",
                product_id: "p1",
                sku: "SKU1",
                price: 100000,
                ship_weight_grams: 500,
                stock_quantity: 10,
                is_active: true,
              }],
              error: null,
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: "p1", name: "Kopi Arabika", is_global: true, is_global_discountable: true }],
              error: null,
            }),
          }),
        };
      }
      if (table === "product_variant_option_values") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [],
              error: null,
            }),
          }),
        };
      }
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: {
                  id: "order-1",
                  order_number: "AGR-20260831-ABC123",
                  total: 115000,
                  status: "pending_payment",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "ecom_order_items") {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "profiles") {
        return {
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      return { select: () => Promise.resolve({ data: null, error: null }) };
    });

    mockCreateQrisPaymentSession.mockResolvedValue({
      paymentSessionId: "ps_1",
      qrUrl: "https://qr.test",
      qrString: "qr-string",
      qrExpiresAt: "2026-08-31T12:00:00Z",
    });

    const req = checkoutReq(baseBody);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orderId).toBe("order-1");
    expect(json.orderNumber).toMatch(/^AGR-\d{8}-[A-Z0-9]{6}$/);
    expect(json.total).toBe(115000);
  });

  it("returns 400 when stock validation rejects insufficient stock", async () => {
    mockValidateStockAvailability.mockReturnValue({
      valid: false,
      error: "Stok tidak cukup",
      code: "INSUFFICIENT_STOCK",
    });

    const req = checkoutReq(baseBody);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Stok tidak cukup");
    expect(json.code).toBe("INSUFFICIENT_STOCK");
  });

  it("retries order number on 23505 collision", async () => {
    let insertCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "product_variants") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{
                id: "11111111-1111-1111-1111-111111111111",
                product_id: "p1",
                sku: "SKU1",
                price: 100000,
                ship_weight_grams: 500,
                stock_quantity: 10,
                is_active: true,
              }],
              error: null,
            }),
          }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ id: "p1", name: "Kopi Arabika", is_global: true, is_global_discountable: true }],
              error: null,
            }),
          }),
        };
      }
      if (table === "product_variant_option_values") {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [],
              error: null,
            }),
          }),
        };
      }
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => {
            insertCount++;
            if (insertCount === 1) {
              return {
                select: () => ({
                  single: () => Promise.resolve({
                    data: null,
                    error: { code: "23505", message: 'duplicate key value violates unique constraint "ecom_orders_order_number_key"' },
                  }),
                }),
              };
            }
            return {
              select: () => ({
                single: () => Promise.resolve({
                  data: {
                    id: "order-1",
                    order_number: "AGR-20260831-XYZ789",
                    total: 115000,
                    status: "pending_payment",
                  },
                  error: null,
                }),
              }),
            };
          },
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "ecom_order_items") {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "profiles") {
        return {
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      return { select: () => Promise.resolve({ data: null, error: null }) };
    });

    mockCreateQrisPaymentSession.mockResolvedValue({
      paymentSessionId: "ps_1",
      qrUrl: "https://qr.test",
      qrString: "qr-string",
      qrExpiresAt: "2026-08-31T12:00:00Z",
    });

    const req = checkoutReq(baseBody);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orderNumber).toMatch(/^AGR-\d{8}-[A-Z0-9]{6}$/);
    expect(json.total).toBe(115000);
  });

  it("returns 400 with Zod errors for invalid input", async () => {
    const req = checkoutReq({
      items: [{ variantId: "not-a-uuid", quantity: 0 }],
      customerName: "",
      customerPhone: "",
      shippingAddress: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.issues).toBeDefined();
  });
});
