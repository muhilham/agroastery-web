import { describe, it, expect } from "vitest";
import { generateConsultationAvailability } from "./availability";

// 2026-07-23 is a Thursday (WIB).
const THU = new Date("2026-07-23T09:00:00+07:00");

describe("generateConsultationAvailability", () => {
  it("only returns Tue/Wed/Thu dates", () => {
    const result = generateConsultationAvailability(THU, []);
    for (const d of result) {
      // TZ-independent assertion: parse string, use UTC getters
      const [y, m, dd] = d.date.split("-").map(Number);
      const day = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
      expect([2, 3, 4]).toContain(day);
    }
  });

  it("covers 4 weeks of valid days (12 dates) starting after today", () => {
    const result = generateConsultationAvailability(THU, []);
    expect(result).toHaveLength(12);
    // Today is Thursday — same-day slots may already be past, so the first
    // bookable date is next Tuesday 2026-07-28.
    expect(result[0].date).toBe("2026-07-28");
    expect(result[11].date).toBe("2026-08-20");
  });

  it("marks taken slots unavailable", () => {
    const result = generateConsultationAvailability(THU, [
      { booking_date: "2026-07-28", time_slot: "14:00" },
    ]);
    const tue = result.find((d) => d.date === "2026-07-28")!;
    expect(tue.slots).toEqual([
      { time: "11:00", available: true },
      { time: "14:00", available: false },
      { time: "17:00", available: true },
    ]);
  });

  it("ignores bookings outside the window", () => {
    const result = generateConsultationAvailability(THU, [
      { booking_date: "2027-01-05", time_slot: "11:00" },
    ]);
    expect(result.every((d) => d.slots.every((s) => s.available))).toBe(true);
  });
});
