import { z } from "zod";
import {
  CONSULTATION_TIME_SLOTS,
  CONSULTATION_WEEKDAYS,
  CONSULTATION_WINDOW_WEEKS,
} from "./constants";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Day-of-week for a YYYY-MM-DD string, TZ-independent.
 * Parse the string directly and read via UTC getters — never
 * `new Date(str + "T00:00:00+07:00").getDay()`, which re-projects the
 * instant onto the process timezone (UTC on Railway → off-by-one weekday).
 */
function wibWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Today's date as YYYY-MM-DD in WIB. */
function wibToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Date (WIB) exactly `weeks` from today, as YYYY-MM-DD. */
function wibMaxDate(weeks: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

const BookingDateSchema = z
  .string()
  .regex(DATE_RE, "Format tanggal harus YYYY-MM-DD")
  .refine((d) => {
    const [y, m, day] = d.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, day));
    // Reject impossible dates like 2026-02-30 (rolls over to March)
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day;
  }, "Tanggal tidak valid")
  .refine((d) => (CONSULTATION_WEEKDAYS as readonly number[]).includes(wibWeekday(d)), {
    message: "Konsultasi hanya tersedia Selasa–Kamis",
  })
  .refine((d) => d > wibToday(), "Tanggal sudah lewat")
  .refine((d) => d <= wibMaxDate(CONSULTATION_WINDOW_WEEKS), "Maksimal 4 minggu ke depan");

const TimeSlotSchema = z.enum(CONSULTATION_TIME_SLOTS);

export const CreateBookingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(8).max(20),
  purpose: z.enum(["custom_blending", "product_testing"]),
  booking_date: BookingDateSchema,
  time_slot: TimeSlotSchema,
  notes: z.string().trim().max(500).optional(),
});

export const RescheduleSchema = z.object({
  booking_date: BookingDateSchema,
  time_slot: TimeSlotSchema,
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type RescheduleInput = z.infer<typeof RescheduleSchema>;
