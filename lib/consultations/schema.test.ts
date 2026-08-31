import { describe, it, expect } from "vitest";
import { CreateBookingSchema, RescheduleSchema } from "./schema";

const valid = {
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  purpose: "custom_blending",
  booking_date: "2026-09-02", // a Wednesday
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

  it("rejects non-Tue/Wed/Thu date (2026-08-17 is Monday)", () => {
    expect(CreateBookingSchema.safeParse({ ...valid, booking_date: "2026-08-17" }).success).toBe(false);
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
    expect(RescheduleSchema.safeParse({ booking_date: "2026-09-03", time_slot: "17:00" }).success).toBe(true);
  });

  it("rejects invalid weekday", () => {
    expect(RescheduleSchema.safeParse({ booking_date: "2026-08-17", time_slot: "11:00" }).success).toBe(false);
  });
});
