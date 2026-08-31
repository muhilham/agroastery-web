import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
  },
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateStockAvailability.mockReturnValue({ valid: true });
    mockDecrementStock.mockResolvedValue({ success: true });
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
