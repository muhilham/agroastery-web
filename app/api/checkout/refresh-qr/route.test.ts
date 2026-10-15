import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const from = vi.fn();
const rpc = vi.fn();
const createQris = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ from, rpc }) }));
vi.mock("@/lib/pivot/client", () => ({ QRIS_MAX_HOLD_MINUTES: 240, createQrisPaymentSession: (...args: unknown[]) => createQris(...args) }));
import { POST } from "./route";

const id = "11111111-1111-1111-1111-111111111111";
const request = () => new NextRequest("http://localhost/api/checkout/refresh-qr", { method: "POST", body: JSON.stringify({ orderId: id }) });

function setOrder(createdAt: string) {
  from.mockImplementation((table: string) => {
    if (table === "ecom_orders") return {
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id, order_number: "AGR-1", total: 1, payment_status: "pending_payment", status: "pending_payment", created_at: createdAt, customer_name: "Budi", customer_email: "b@e.com", customer_phone: "081" }, error: null }) }) }),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    };
    return { select: () => ({ eq: () => Promise.resolve({ data: [{ variant_id: "variant-1", quantity: 2 }], error: null }) }) };
  });
}

describe("POST /api/checkout/refresh-qr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createQris.mockResolvedValue({ paymentSessionId: "ps", qrUrl: "url", qrString: "qr", qrExpiresAt: "2026-01-01T00:00:00.000Z" });
  });
  it("expires an order past the total hold and restores stock", async () => {
    setOrder(new Date(Date.now() - 241 * 60_000).toISOString());
    const response = await POST(request());
    expect(response.status).toBe(410);
    expect((await response.json()).code).toBe("HOLD_EXPIRED");
    expect(createQris).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("ecom_restore_stock", { p_variant_id: "variant-1", p_quantity: 2 });
  });
  it("refreshes a recent order", async () => {
    setOrder(new Date().toISOString());
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(createQris).toHaveBeenCalledOnce();
  });
});
