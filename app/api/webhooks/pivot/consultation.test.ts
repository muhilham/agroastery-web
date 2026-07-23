import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockOrderSingle = vi.fn();
const mockBookingSingle = vi.fn();
const mockBookingUpdate = vi.fn();
const mockEmail = vi.fn().mockResolvedValue(undefined);
const mockTelegram = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) =>
      table === "ecom_orders"
        ? {
            select: () => ({ eq: () => ({ single: mockOrderSingle }) }),
            update: () => ({
              eq: () => ({
                not: () => ({
                  select: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
                }),
              }),
            }),
          }
        : {
            select: () => ({ eq: () => ({ single: mockBookingSingle, maybeSingle: mockBookingSingle }) }),
            update: () => ({ eq: () => ({ eq: mockBookingUpdate }) }),
          },
  }),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationConfirmationEmail: (...a: unknown[]) => mockEmail(...a),
}));

vi.mock("@/lib/consultations/notify", () => ({
  sendConsultationBookingAlert: (...a: unknown[]) => mockTelegram(...a),
  sendConsultationConflictAlert: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

function webhookReq(event: string, sessionId: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/pivot", {
    method: "POST",
    headers: { "x-api-key": process.env.PIVOT_CALLBACK_API_KEY ?? "" },
    body: JSON.stringify({
      event,
      data: { id: sessionId, chargeDetails: [{ paidAt: "2026-07-23T10:00:00Z" }] },
    }),
  });
}

describe("pivot webhook — consultation branch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PIVOT_CALLBACK_API_KEY = "test-key";
    mockOrderSingle.mockResolvedValue({ data: null, error: null });
  });

  it("confirms a consultation booking on PAYMENT.PAID", async () => {
    mockBookingSingle.mockResolvedValue({
      data: { id: "b-1", status: "pending_payment", name: "Budi", phone: "0812", booking_date: "2026-07-28", time_slot: "11:00", purpose: "custom_blending", notes: null, amount: 250000 },
      error: null,
    });
    mockBookingUpdate.mockResolvedValue({ error: null });
    const res = await POST(webhookReq("PAYMENT.PAID", "ps_1"));
    expect(res.status).toBe(200);
    expect(mockEmail).toHaveBeenCalledWith("b-1");
    expect(mockTelegram).toHaveBeenCalledOnce();
  });

  it("is idempotent when booking already confirmed", async () => {
    mockBookingSingle.mockResolvedValue({ data: { id: "b-1", status: "confirmed" }, error: null });
    const res = await POST(webhookReq("PAYMENT.PAID", "ps_1"));
    expect(res.status).toBe(200);
    expect(mockBookingUpdate).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("marks booking expired on PAYMENT.EXPIRED", async () => {
    mockBookingSingle.mockResolvedValue({ data: { id: "b-1", status: "pending_payment" }, error: null });
    mockBookingUpdate.mockResolvedValue({ error: null });
    const res = await POST(webhookReq("PAYMENT.EXPIRED", "ps_1"));
    expect(res.status).toBe(200);
    expect(mockBookingUpdate).toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("ignores unknown session", async () => {
    mockBookingSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(webhookReq("PAYMENT.PAID", "ps_unknown"));
    expect(res.status).toBe(200);
    expect(mockBookingUpdate).not.toHaveBeenCalled();
  });
});
