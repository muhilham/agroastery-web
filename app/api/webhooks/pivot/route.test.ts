import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();
const mockRpc = vi.fn();

function resolvedChain(data: unknown, error: unknown = null) {
  const result = Object.assign(Promise.resolve({ data, error }), {
    eq: vi.fn(),
    not: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  });
  result.eq.mockReturnValue(result);
  result.not.mockReturnValue(result);
  result.select.mockReturnValue(result);
  return result;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom, rpc: mockRpc }),
}));

const mockPaymentNotification = vi.fn().mockResolvedValue(undefined);
const mockOpsAlert = vi.fn().mockResolvedValue(undefined);
const mockCreateBiteshipDraft = vi.fn().mockResolvedValue(undefined);
const mockSendOrderEmail = vi.fn().mockResolvedValue(undefined);
const mockCreateJubelioOrder = vi.fn().mockResolvedValue(undefined);
const mockSendConsultationEmail = vi.fn().mockResolvedValue(undefined);
const mockSendConsultationBookingAlert = vi.fn().mockResolvedValue(undefined);
const mockSendConsultationConflictAlert = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/telegram/notify", () => ({
  sendPaymentNotification: (...a: unknown[]) => mockPaymentNotification(...a),
  sendOrderNotification: vi.fn().mockResolvedValue(undefined),
  sendJubelioSyncNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/telegram/opsAlert", () => ({
  sendOpsAlert: (...a: unknown[]) => mockOpsAlert(...a),
}));

vi.mock("@/lib/biteship/createDraft", () => ({
  createBiteshipDraft: (...a: unknown[]) => mockCreateBiteshipDraft(...a),
}));

vi.mock("@/lib/resend/sendOrderEmail", () => ({
  sendOrderEmail: (...a: unknown[]) => mockSendOrderEmail(...a),
}));

vi.mock("@/lib/jubelio/orders", () => ({
  createJubelioOrderFromEcom: (...a: unknown[]) => mockCreateJubelioOrder(...a),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationConfirmationEmail: (...a: unknown[]) => mockSendConsultationEmail(...a),
}));

vi.mock("@/lib/consultations/notify", () => ({
  sendConsultationBookingAlert: (...a: unknown[]) => mockSendConsultationBookingAlert(...a),
  sendConsultationConflictAlert: (...a: unknown[]) => mockSendConsultationConflictAlert(...a),
}));

import { POST } from "./route";

function webhookReq(event: string, data: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/pivot", {
    method: "POST",
    headers: { "x-api-key": process.env.PIVOT_CALLBACK_API_KEY ?? "" },
    body: JSON.stringify({ event, data }),
  });
}

describe("pivot webhook — ecom orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PIVOT_CALLBACK_API_KEY = "test-key";
  });

  it("returns 401 for bad API key", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/pivot", {
      method: "POST",
      headers: { "x-api-key": "bad-key" },
      body: JSON.stringify({ event: "PAYMENT.PAID", data: { id: "ps_1" } }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/pivot", {
      method: "POST",
      headers: { "x-api-key": "test-key" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON");
  });

  it("returns 400 for missing session ID", async () => {
    const req = webhookReq("PAYMENT.PAID", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing payment session id");
  });

  it("updates order status to processing on PAYMENT.PAID", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "order-1",
                    order_number: "AGR-001",
                    customer_name: "Budi",
                    customer_phone: "08123",
                    total: 100000,
                    shipping_address: { phone: "08123" },
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ product_name: "Kopi", quantity: 1 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Wait for fire-and-forget side effects
    await new Promise((r) => setTimeout(r, 10));

    expect(mockPaymentNotification).toHaveBeenCalled();
    expect(mockCreateBiteshipDraft).toHaveBeenCalledWith("order-1");
    expect(mockSendOrderEmail).toHaveBeenCalledWith("order-1");
    expect(mockCreateJubelioOrder).toHaveBeenCalledWith("order-1");
  });

  it("triggers sendOpsAlert when Biteship draft fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "order-1",
                    order_number: "AGR-001",
                    customer_name: "Budi",
                    customer_phone: "08123",
                    total: 100000,
                    shipping_address: { phone: "08123" },
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ product_name: "Kopi", quantity: 1 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    mockCreateBiteshipDraft.mockRejectedValue(new Error("Biteship down"));

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Wait for fire-and-forget side effects
    await new Promise((r) => setTimeout(r, 10));

    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        orderNumber: "AGR-001",
        issue: "BITESHIP GAGAL — buat order manual",
      })
    );
  });

  it("sets order to cancelled on PAYMENT.EXPIRED", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          update: () => ({
            eq: () => ({
              not: () => ({
                select: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ variant_id: "v1", quantity: 2 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    mockRpc.mockResolvedValue({ data: null, error: null });

    const req = webhookReq("PAYMENT.EXPIRED", { id: "ps_1" });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith("ecom_restore_stock", { p_variant_id: "v1", p_quantity: 2 });
  });
});
