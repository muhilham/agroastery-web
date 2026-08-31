import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: mockUpdateEq }),
    }),
  }),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationRescheduledEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

function ctx(token: string) {
  return { params: Promise.resolve({ token }) };
}

function req(body: unknown) {
  return new NextRequest("http://localhost/api/consultations/manage/t/reschedule", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST reschedule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s for unknown token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req({ booking_date: "2026-09-02", time_slot: "11:00" }), ctx("bad"));
    expect(res.status).toBe(404);
  });

  it("400s when booking not confirmed", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b", status: "cancelled", booking_date: "2026-09-02" }, error: null });
    const res = await POST(req({ booking_date: "2026-09-02", time_slot: "11:00" }), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("409s with SLOT_TAKEN on unique violation", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: "2026-09-02", email: "b@e.com", name: "B", time_slot: "11:00" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: { code: "23505", message: "dup" } });
    const res = await POST(req({ booking_date: "2026-09-03", time_slot: "14:00" }), ctx("t"));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("SLOT_TAKEN");
  });

  it("reschedules a confirmed booking", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: "2026-09-02", email: "b@e.com", name: "B", time_slot: "11:00", manage_token: "t" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    const res = await POST(req({ booking_date: "2026-09-03", time_slot: "14:00" }), ctx("t"));
    expect(res.status).toBe(200);
  });
});
