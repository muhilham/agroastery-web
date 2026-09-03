/** Consultation booking shared constants (WIB local time). */

/** Fixed 2-hour session start times, stored as "HH:MM" strings. */
export const CONSULTATION_TIME_SLOTS = ["11:00", "14:00", "17:00"] as const;

export type ConsultationTimeSlot = (typeof CONSULTATION_TIME_SLOTS)[number];

/** Valid consultation weekdays as JS Date.getDay() values: Tue=2, Wed=3, Thu=4. */
export const CONSULTATION_WEEKDAYS = [2, 3, 4] as const;

/** Session fee in IDR (bigint-safe integer). */
export const CONSULTATION_FEE_IDR = 250_000;

/** Rolling booking window in weeks. */
export const CONSULTATION_WINDOW_WEEKS = 4;

/** Human-readable purpose labels keyed by DB enum value. Values must never change. */
export const CONSULTATION_PURPOSES = {
  custom_blending: "Saya ingin racikan kopi yang pas untuk menu saya",
  product_testing: "Saya mau cicip biji kopi Agroastery sebelum ambil stok",
} as const;

export type ConsultationPurpose = keyof typeof CONSULTATION_PURPOSES;

/** Build a Pivot-safe order number (≤20 chars) for consultation bookings. */
export function formatConsultationOrderNumber(
  bookingDate: string,
  timeSlot: string
): string {
  return `KONS-${bookingDate.replace(/-/g, "")}-${timeSlot.replace(/:/g, "")}`;
}

export function isConsultationSlot(value: string): value is ConsultationTimeSlot {
  return (CONSULTATION_TIME_SLOTS as readonly string[]).includes(value);
}
