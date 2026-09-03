import { describe, it, expect } from "vitest";
import { CreateBookingSchema, RescheduleSchema } from "./schema";

/**
 * Next WIB date (YYYY-MM-DD) strictly after today whose JS weekday matches.
 * Dynamic so the suite doesn't rot once hardcoded dates fall out of the
 * rolling booking window (schema rejects past dates and >4-week dates).
 */
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
const MONDAY = nextWibWeekday(1);

const valid = {
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  purpose: "custom_blending",
  booking_date: WEDNESDAY,
  time_slot: "11:00",
  notes: "Bawa susu sendiri",
};

describe("CreateBookingSchema", () => {
  it("accepts a valid booking", () => {
    expect(CreateBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts product_testing purpose and empty notes", () => {
    const r = CreateBookingSchema.safeParse({ ...valid, purpose: "product_testing", notes: undefined });
    expect(r.success).toBe(true);
  });

  it("rejects invalid purpose", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, purpose: "cupping" }).success).toBe(false);
  });

  it("rejects invalid slot", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, time_slot: "10:00" }).success).toBe(false);
  });

  it("rejects non-Tue/Wed/Thu date (Monday)", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, booking_date: MONDAY }).success).toBe(false);
  });

  it("rejects malformed date", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, booking_date: "28/07/2026" }).success).toBe(false);
  });

  it("rejects bad email and short phone", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(CreateBookingSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
  });
});

describe("RescheduleSchema", () => {
  it("accepts valid date+slot", () => {
    expect(RescheduleSchema.safeParse({ booking_date: THURSDAY, time_slot: "17:00" }).success).toBe(true);
  });

  it("rejects invalid weekday", () => {
    expect(RescheduleSchema.safeParse({ booking_date: MONDAY, time_slot: "11:00" }).success).toBe(false);
  });
});
