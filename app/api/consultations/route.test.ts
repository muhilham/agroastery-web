import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockDeleteEq = vi.fn();
const mockUpdateEq = vi.fn();
const mockGetUser = vi.fn();
const mockCreateQris = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      insert: mockInsert,
      delete: () => ({ eq: mockDeleteEq }),
      update: () => ({ eq: mockUpdateEq }),
    }),
  }),
  createSupabaseServerClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/pivot/client", () => ({
  createQrisPaymentSession: (...args: unknown[]) => mockCreateQris(...args),
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/consultations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  purpose: "custom_blending",
  booking_date: "2026-08-19",
  time_slot: "11:00",
};

describe("POST /api/consultations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockCreateQris.mockResolvedValue({
      paymentSessionId: "ps_123",
      qrUrl: "https://qr",
      qrString: "EMVCO",
      qrExpiresAt: "2026-07-23T10:05:00.000Z",
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("creates booking + pivot session and returns qr data", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b-1", manage_token: "t-1" }, error: null });
    const res = await POST(req(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.bookingId).toBe("b-1");
    expect(json.qrString).toBe("EMVCO");
    expect(mockCreateQris).toHaveBeenCalledOnce();
  });

  it("returns 400 on invalid body", async () => {
    const res = await POST(req({ ...validBody, time_slot: "10:00" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("maps unique violation to SLOT_TAKEN", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate" } });
    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("SLOT_TAKEN");
  });

  it("deletes booking and returns 500 when pivot session fails", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b-1", manage_token: "t-1" }, error: null });
    mockCreateQris.mockRejectedValue(new Error("pivot down"));
    mockDeleteEq.mockResolvedValue({ error: null });
    const res = await POST(req(validBody));
    expect(res.status).toBe(500);
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "b-1");
  });
});
