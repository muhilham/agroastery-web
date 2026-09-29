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

// The route imports BOTH retryBiteshipDraft and isRetryableDraftError from
// retryDraft — keep the real classifier, stub only the chain (#199).
const mockRetryBiteshipDraft = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/biteship/retryDraft", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/biteship/retryDraft")>();
  return {
    ...actual,
    retryBiteshipDraft: (...a: unknown[]) => mockRetryBiteshipDraft(...a),
  };
});

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

const PAID_ORDER_ROW = {
  id: "order-1",
  order_number: "AGR-001",
  customer_name: "Budi",
  customer_phone: "08123",
  total: 100000,
  shipping_address: { phone: "08123" },
};

/**
 * Build the ecom_orders mock for the PAYMENT.PAID CAS ladder:
 * step 1 = update().eq(session).not(in expired,paid).select().maybeSingle()
 * step 2 = update().eq(session).eq(payment_status,expired).select().maybeSingle()
 * `step1Row`/`step2Row` choose which transition wins; null = no row matched.
 */
function mockPaidUpdate(step1Row: unknown | null, step2Row: unknown | null = null) {
  return {
    update: () => ({
      eq: () => ({
        not: () => ({
          select: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: step1Row, error: null }),
          }),
        }),
        eq: () => ({
          select: () => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: step2Row, error: null }),
          }),
        }),
      }),
    }),
  };
}

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
          ...mockPaidUpdate(PAID_ORDER_ROW),
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

  it("routes a retryable Biteship draft failure into the retry chain without alerting ops", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          ...mockPaidUpdate(PAID_ORDER_ROW),
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

    // "Biteship down" is not a known data-bug prefix -> retry chain, no alert (#199)
    expect(mockRetryBiteshipDraft).toHaveBeenCalledWith("order-1");
    expect(mockOpsAlert).not.toHaveBeenCalledWith(
      expect.objectContaining({ issue: "BITESHIP GAGAL — buat order manual" })
    );
  });

  it("alerts ops immediately (no retry) when draft fails with a non-retryable error", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          ...mockPaidUpdate(PAID_ORDER_ROW),
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

    mockCreateBiteshipDraft.mockRejectedValue(
      new Error("[createBiteshipDraft] No order items found for order: order-1")
    );

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        orderNumber: "AGR-001",
        issue: "BITESHIP GAGAL — buat order manual",
      })
    );
    expect(mockRetryBiteshipDraft).not.toHaveBeenCalled();
  });

  it("triggers sendOpsAlert when Jubelio sync fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          ...mockPaidUpdate(PAID_ORDER_ROW),
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

    mockCreateJubelioOrder.mockRejectedValue(new Error("Jubelio down"));

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Wait for fire-and-forget side effects
    await new Promise((r) => setTimeout(r, 10));

    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        orderNumber: "AGR-001",
        issue: expect.stringContaining("JUBELIO"),
      })
    );

    const paymentCalls = mockPaymentNotification.mock.calls;
    for (const call of paymentCalls) {
      const arg = call[0] as { paymentMethod?: string };
      if (arg.paymentMethod) {
        expect(arg.paymentMethod).not.toContain("⚠️");
      }
    }
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

  it("re-reserves stock and alerts ops when PAID arrives after EXPIRED (#187)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "expired" }, error: null }),
            }),
          }),
          // step1 (not expired/paid) finds nothing — row is live 'expired';
          // step2 (eq 'expired') wins and resurrects it.
          ...mockPaidUpdate(null, PAID_ORDER_ROW),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ variant_id: "v1", product_name: "Kopi", quantity: 2 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    // Stock released by the EXPIRED handler must be clawed back — atomically,
    // via the same multi-item primitive checkout uses at creation (#187).
    expect(mockRpc).toHaveBeenCalledWith("ecom_decrement_stock_multi", {
      p_items: [{ variant_id: "v1", quantity: 2 }],
    });
    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        orderNumber: "AGR-001",
        issue: expect.stringContaining("LATE PAID"),
      })
    );
    // Order still gets its normal paid pipeline.
    expect(mockCreateBiteshipDraft).toHaveBeenCalledWith("order-1");
  });

  it("alerts ops with hold instruction when late-payment re-reserve fails (#187)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "expired" }, error: null }),
            }),
          }),
          // same late-payment path: step2 (eq 'expired') wins the resurrection
          ...mockPaidUpdate(null, PAID_ORDER_ROW),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ variant_id: "v1", product_name: "Kopi", quantity: 2 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    // Another buyer claimed the stock: the RPC returns false WITHOUT an error
    // (this is precisely the ecom_decrement_stock shape that made the
    // error-only check unsound). Re-reserve must still fail closed (#187).
    mockRpc.mockResolvedValue({ data: false, error: null });

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        orderNumber: "AGR-001",
        issue: expect.stringContaining("RE-RESERVE GAGAL"),
        action: expect.stringContaining("Tahan pengiriman"),
      })
    );
  });

  it("resurrects + re-reserves when EXPIRED lands between the read and the write (#187 race)", async () => {
    // Read sees 'unpaid' (pre-expiry), but the row goes live-'expired' before
    // the CAS update runs: step1 matches nothing, step2 (eq 'expired') wins.
    // The old read-derived wasExpired would have skipped the re-reserve here.
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          ...mockPaidUpdate(null, PAID_ORDER_ROW),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ variant_id: "v1", product_name: "Kopi", quantity: 1 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    mockRpc.mockResolvedValue({ data: true, error: null });

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockRpc).toHaveBeenCalledWith("ecom_decrement_stock_multi", {
      p_items: [{ variant_id: "v1", quantity: 1 }],
    });
    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ issue: expect.stringContaining("LATE PAID") })
    );
    expect(mockCreateBiteshipDraft).toHaveBeenCalledWith("order-1");
  });

  it("double PAID delivery is an idempotent no-op via the CAS ladder (#187)", async () => {
    // Read says unpaid, but a concurrent delivery already flipped the row to
    // 'paid': both CAS steps match nothing. Must NOT re-run notifications,
    // drafts, or re-reserve.
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "unpaid" }, error: null }),
            }),
          }),
          ...mockPaidUpdate(null, null),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreateBiteshipDraft).not.toHaveBeenCalled();
    expect(mockPaymentNotification).not.toHaveBeenCalled();
    expect(mockSendOrderEmail).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalledWith("ecom_decrement_stock_multi", expect.anything());
    expect(mockOpsAlert).not.toHaveBeenCalled();
  });

  it("does not re-reserve stock or alert on normal paid flow (#187)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ecom_orders") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "order-1", payment_status: "pending_payment" }, error: null }),
            }),
          }),
          ...mockPaidUpdate(PAID_ORDER_ROW),
        };
      }
      if (table === "ecom_order_items") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ variant_id: "v1", product_name: "Kopi", quantity: 1 }], error: null }),
          }),
        };
      }
      return { select: () => resolvedChain(null) };
    });

    const req = webhookReq("PAYMENT.PAID", { id: "ps_1", chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] });
    const res = await POST(req);
    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockRpc).not.toHaveBeenCalledWith("ecom_decrement_stock_multi", expect.anything());
    expect(mockOpsAlert).not.toHaveBeenCalledWith(
      expect.objectContaining({ issue: expect.stringContaining("LATE PAID") })
    );
    expect(mockCreateBiteshipDraft).toHaveBeenCalledWith("order-1");
  });
});
