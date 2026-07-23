import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();
const mockSingle = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }),
  }),
}));

import { sendConsultationConfirmationEmail } from "./sendConsultationEmail";

const booking = {
  id: "b-1",
  name: "Budi",
  email: "budi@example.com",
  booking_date: "2026-07-28",
  time_slot: "11:00",
  purpose: "custom_blending",
  manage_token: "tok-1",
  amount: 250000,
};

describe("sendConsultationConfirmationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "key";
    process.env.NEXT_PUBLIC_APP_URL = "https://agroastery.com";
    mockSingle.mockResolvedValue({ data: booking, error: null });
    mockSend.mockResolvedValue({ error: null });
  });

  it("sends confirmation with manage link", async () => {
    await sendConsultationConfirmationEmail("b-1");
    expect(mockSend).toHaveBeenCalledOnce();
    const arg = mockSend.mock.calls[0][0];
    expect(arg.to).toBe("budi@example.com");
    expect(arg.subject).toContain("Konsultasi");
  });

  it("skips when booking not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "nf" } });
    await sendConsultationConfirmationEmail("nope");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("skips when RESEND_API_KEY missing", async () => {
    delete process.env.RESEND_API_KEY;
    await sendConsultationConfirmationEmail("b-1");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
