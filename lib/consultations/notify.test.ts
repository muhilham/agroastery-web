import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  sendConsultationBookingAlert,
  sendConsultationCancelAlert,
  sendConsultationConflictAlert,
} from "./notify";

describe("consultation telegram notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "tok";
    process.env.TELEGRAM_CHAT_ID = "chat";
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("sends booking alert with date/slot/customer", async () => {
    await sendConsultationBookingAlert({
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
      purpose: "custom_blending",
      notes: "Bawa susu",
      amount: 250000,
    });
    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("chat");
    expect(body.text).toContain("Budi");
    expect(body.text).toContain("2026-07-28");
    expect(body.text).toContain("11:00");
  });

  it("sends cancel alert with refund amount", async () => {
    await sendConsultationCancelAlert({
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
      amount: 250000,
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toMatch(/REFUND/i);
    expect(body.text).toContain("250.000");
  });

  it("sends conflict alert", async () => {
    await sendConsultationConflictAlert({
      bookingId: "b-1",
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toMatch(/KONFLIK/i);
  });

  it("skips silently when env vars missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await sendConsultationBookingAlert({
      name: "Budi",
      phone: "0812",
      bookingDate: "2026-07-28",
      timeSlot: "11:00",
      purpose: "custom_blending",
      notes: null,
      amount: 250000,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
