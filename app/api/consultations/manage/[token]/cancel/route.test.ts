import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSingle = vi.fn();
const mockUpdateResult = vi.fn();
const mockNotify = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: () => ({ eq: mockUpdateResult }) }),
    }),
  }),
}));

vi.mock("@/lib/consultations/notify", () => ({
  sendConsultationCancelAlert: (...args: unknown[]) => mockNotify(...args),
}));

vi.mock("@/lib/resend/sendConsultationEmail", () => ({
  sendConsultationCancelledEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";

function ctx(token: string) {
  return { params: Promise.resolve({ token }) };
}
const req = () => new NextRequest("http://localhost/api/consultations/manage/t/cancel", { method: "POST" });
const futureDate = "2099-01-06"; // a Tuesday

describe("POST cancel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s for unknown token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req(), ctx("bad"));
    expect(res.status).toBe(404);
  });

  it("400s when booking is not confirmed", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b", status: "expired", booking_date: futureDate }, error: null });
    const res = await POST(req(), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("400s when booking is in the past", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b", status: "confirmed", booking_date: "2020-01-07" }, error: null });
    const res = await POST(req(), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("cancels a confirmed future booking and alerts team", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: futureDate, time_slot: "11:00", name: "Budi", phone: "0812", amount: 250000, email: "b@e.com" },
      error: null,
    });
    mockUpdateResult.mockResolvedValue({ error: null });
    const res = await POST(req(), ctx("t"));
    expect(res.status).toBe(200);
    expect(mockNotify).toHaveBeenCalledOnce();
  });
});
