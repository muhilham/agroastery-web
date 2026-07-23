import {
  CONSULTATION_TIME_SLOTS,
  CONSULTATION_WEEKDAYS,
  CONSULTATION_WINDOW_WEEKS,
} from "./constants";

export interface SlotAvailability {
  time: string;
  available: boolean;
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD (WIB)
  slots: SlotAvailability[];
}

interface ActiveBooking {
  booking_date: string; // YYYY-MM-DD
  time_slot: string;
}

/** Format a Date as YYYY-MM-DD in WIB. */
function toWibDateString(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/**
 * Pure generator: valid consultation dates (Tue/Wed/Thu) for the rolling
 * window, starting the day after `now` (same-day slots may be in the past),
 * with taken slots marked unavailable.
 */
export function generateConsultationAvailability(
  now: Date,
  activeBookings: ActiveBooking[]
): DateAvailability[] {
  const taken = new Set(activeBookings.map((b) => `${b.booking_date}|${b.time_slot}`));
  const result: DateAvailability[] = [];

  // Iterate day-by-day starting tomorrow (WIB), collecting valid weekdays
  // until we have 4 weeks worth (12 days = 3 days/week * 4 weeks).
  const cursor = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  cursor.setDate(cursor.getDate() + 1);

  const maxDays = CONSULTATION_WINDOW_WEEKS * 7;
  for (let i = 0; i < maxDays; i++) {
    const day = cursor.getDay();
    if ((CONSULTATION_WEEKDAYS as readonly number[]).includes(day)) {
      const dateStr = toWibDateString(cursor);
      result.push({
        date: dateStr,
        slots: CONSULTATION_TIME_SLOTS.map((time) => ({
          time,
          available: !taken.has(`${dateStr}|${time}`),
        })),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
