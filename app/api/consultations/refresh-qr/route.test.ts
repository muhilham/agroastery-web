import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockLockMaybeSingle = vi.fn();
const mockRpc = vi.fn();
const mockCreateQris = vi.fn();

// Chainable update mock: serves both the session-persist path
// (await update().eq("id") -> {error}) and the cap-lock path
// (update().eq().eq().select().maybeSingle()).
const updateChain = {
  eq: () => updateChain,
  select: () => updateChain,
  maybeSingle: () => mockLockMaybeSingle(),
  then: (resolve: (v: { error: null }) => unknown) => resolve({ error: null }),
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => updateChain,
    }),
    rpc: mockRpc,
  }),
}));

vi.mock("@/lib/pivot/client", () => ({
  QRIS_MAX_HOLD_MINUTES: 240,
  createQrisPaymentSession: (...args: unknown[]) => mockCreateQris(...args),
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations/refresh-qr", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const bookingId = "11111111-1111-1111-1111-111111111111";

describe("POST /api/consultations/refresh-qr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateQris.mockResolvedValue({
      paymentSessionId: "ps_new",
      qrUrl: "https://qr2",
      qrString: "EMVCO2",
      qrExpiresAt: "2026-07-23T10:10:00.000Z",
    });
    mockLockMaybeSingle.mockResolvedValue({ data: { id: bookingId } });
  });

  it("rejects invalid input", async () => {
    const res = await POST(req({ bookingId: "nope" }));
    expect(res.status).toBe(400);
  });

  it("404s when booking missing", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req({ bookingId }));
    expect(res.status).toBe(404);
  });

  it("400s when booking is not pending_payment", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b", status: "confirmed" }, error: null });
    const res = await POST(req({ bookingId }));
    expect(res.status).toBe(400);
  });

  it("creates a new session for pending booking", async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: bookingId,
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
    const res = await POST(req({ bookingId }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.qrString).toBe("EMVCO2");
    expect(mockCreateQris).toHaveBeenCalledOnce();
  });

  it("expires a booking past the total hold without creating a session", async () => {
    mockSingle.mockResolvedValue({
      data: { id: bookingId, status: "pending_payment", created_at: new Date(Date.now() - 241 * 60_000).toISOString() },
      error: null,
    });
    const res = await POST(req({ bookingId }));
    expect(res.status).toBe(410);
    expect((await res.json()).code).toBe("HOLD_EXPIRED");
    expect(mockCreateQris).not.toHaveBeenCalled();
  });

  it("409s when the hold lock finds the booking already paid/changed", async () => {
    mockSingle.mockResolvedValue({
      data: { id: bookingId, status: "pending_payment", created_at: new Date(Date.now() - 241 * 60_000).toISOString() },
      error: null,
    });
    mockLockMaybeSingle.mockResolvedValue({ data: null });
    const res = await POST(req({ bookingId }));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("STATE_CHANGED");
    expect(mockCreateQris).not.toHaveBeenCalled();
  });
});
