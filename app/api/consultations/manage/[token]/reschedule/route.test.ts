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

/** Next WIB date strictly after today matching the given JS weekday (3 = Wed, 4 = Thu). */
function nextWibWeekday(weekday: number): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getDay() === weekday) {
      return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    }
  }
  throw new Error(`No date with weekday ${weekday} within 7 days`);
}

const WEDNESDAY = nextWibWeekday(3);
const THURSDAY = nextWibWeekday(4);


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
  beforeEach(() => void vi.clearAllMocks());

  it("404s for unknown token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    const res = await POST(req({ booking_date: WEDNESDAY, time_slot: "11:00" }), ctx("bad"));
    expect(res.status).toBe(404);
  });

  it("400s when booking not confirmed", async () => {
    mockSingle.mockResolvedValue({ data: { id: "b", status: "cancelled", booking_date: WEDNESDAY }, error: null });
    const res = await POST(req({ booking_date: WEDNESDAY, time_slot: "11:00" }), ctx("t"));
    expect(res.status).toBe(400);
  });

  it("409s with SLOT_TAKEN on unique violation", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: WEDNESDAY, email: "b@e.com", name: "B", time_slot: "11:00" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: { code: "23505", message: "dup" } });
    const res = await POST(req({ booking_date: THURSDAY, time_slot: "14:00" }), ctx("t"));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe("SLOT_TAKEN");
  });

  it("reschedules a confirmed booking", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "b", status: "confirmed", booking_date: WEDNESDAY, email: "b@e.com", name: "B", time_slot: "11:00", manage_token: "t" },
      error: null,
    });
    mockUpdateEq.mockResolvedValue({ error: null });
    const res = await POST(req({ booking_date: THURSDAY, time_slot: "14:00" }), ctx("t"));
    expect(res.status).toBe(200);
  });
});
