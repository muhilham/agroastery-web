import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ rpc: mockRpc }),
}));

import { validateStockAvailability, decrementStock } from "./stockValidation";

describe("validateStockAvailability", () => {
  it("returns valid when all items have sufficient stock", () => {
    const variantMap = new Map([
      ["v1", { id: "v1", product_id: "p1", sku: "SKU1", price: 100000, ship_weight_grams: 500, stock_quantity: 10, is_active: true }],
      ["v2", { id: "v2", product_id: "p2", sku: "SKU2", price: 200000, ship_weight_grams: 1000, stock_quantity: 5, is_active: true }],
    ]);

    const result = validateStockAvailability(
      [
        { variantId: "v1", quantity: 2 },
        { variantId: "v2", quantity: 5 },
      ],
      variantMap
    );

    expect(result.valid).toBe(true);
  });

  it("returns error when variant is inactive", () => {
    const variantMap = new Map([
      ["v1", { id: "v1", product_id: "p1", sku: "SKU1", price: 100000, ship_weight_grams: 500, stock_quantity: 10, is_active: false }],
    ]);

    const result = validateStockAvailability([{ variantId: "v1", quantity: 1 }], variantMap);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ error: "Produk tidak tersedia", code: "VARIANT_UNAVAILABLE" });
  });

  it("returns error when variant does not exist in map", () => {
    const variantMap = new Map();

    const result = validateStockAvailability([{ variantId: "v1", quantity: 1 }], variantMap);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ error: "Produk tidak tersedia", code: "VARIANT_UNAVAILABLE" });
  });

  it("returns error when stock is insufficient", () => {
    const variantMap = new Map([
      ["v1", { id: "v1", product_id: "p1", sku: "SKU1", price: 100000, ship_weight_grams: 500, stock_quantity: 2, is_active: true }],
    ]);

    const result = validateStockAvailability([{ variantId: "v1", quantity: 5 }], variantMap);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" });
  });

  it("treats null stock_quantity as 0", () => {
    const variantMap = new Map([
      ["v1", { id: "v1", product_id: "p1", sku: "SKU1", price: 100000, ship_weight_grams: 500, stock_quantity: null, is_active: true }],
    ]);

    const result = validateStockAvailability([{ variantId: "v1", quantity: 1 }], variantMap);

    expect(result.valid).toBe(false);
    expect(result).toMatchObject({ error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" });
  });
});

describe("decrementStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when RPC succeeds", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const admin = { rpc: mockRpc } as unknown as ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdminClient>;
    const result = await decrementStock(admin, [{ variantId: "v1", quantity: 2 }]);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("ecom_decrement_stock_multi", {
      p_items: [{ variant_id: "v1", quantity: 2 }],
    });
  });

  it("returns failure when RPC returns error", async () => {
    const dbError = { message: "insufficient stock" };
    mockRpc.mockResolvedValue({ data: null, error: dbError });

    const admin = { rpc: mockRpc } as unknown as ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdminClient>;
    const result = await decrementStock(admin, [{ variantId: "v1", quantity: 2 }]);

    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError);
  });

  it("returns failure when RPC returns no data", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const admin = { rpc: mockRpc } as unknown as ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdminClient>;
    const result = await decrementStock(admin, [{ variantId: "v1", quantity: 2 }]);

    expect(result.success).toBe(false);
  });
});
