import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();
const mockCreateQris = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: mockUpdateEq }),
    }),
  }),
}));

vi.mock("@/lib/pivot/client", () => ({
  createQrisPaymentSession: (...args: unknown[]) => mockCreateQris(...args),
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations/refresh-qr", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/consultations/refresh-qr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateQris.mockResolvedValue({
      paymentSessionId: "ps_new",
      qrUrl: "https://qr2",
      qrString: "EMVCO2",
      qrExpiresAt: "2026-07-23T10:10:00.000Z",
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("rejects invalid input", async () => {
    const res = await POST(req({ bookingId: "nope" }));
    expect(res.status).toBe(400);
  });

  it("404s when booking missing", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req({ bookingId: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(404);
  });

  it("400s when booking is not pending_payment", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b", status: "confirmed" }, error: null });
    const res = await POST(req({ bookingId: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(400);
  });

  it("creates a new session for pending booking", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        status: "pending_payment",
        booking_date: "2026-07-28",
        time_slot: "11:00",
        amount: 250000,
        name: "Budi",
        email: "b@e.com",
        phone: "08123456789",
      },
      error: null,
    });
    const res = await POST(req({ bookingId: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.qrString).toBe("EMVCO2");
    expect(mockCreateQris).toHaveBeenCalledOnce();
  });
});
