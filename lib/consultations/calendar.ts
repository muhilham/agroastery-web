import { ADDRESS } from "@/constant/resource-and-link";

/** Session length in hours used for calendar events. */
const SESSION_HOURS = 2;
/** WIB offset from UTC (UTC+7). */
const WIB_OFFSET_HOURS = 7;

/**
 * Format a WIB wall-clock datetime as a basic UTC stamp (YYYYMMDDTHHMMSSZ)
 * for calendar links. Pure UTC arithmetic — no host-timezone dependency,
 * so it behaves identically in CI and Railway (which runs WIB now, but
 * must not depend on that).
 */
export function toUtcStamp(dateStr: string, timeStr: string, addHours = 0): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  // WIB is UTC+7 — shift back to UTC, then apply offset hours (e.g. session length).
  const utc = new Date(Date.UTC(y, m - 1, d, hh - WIB_OFFSET_HOURS + addHours, mm));
  return utc.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Escape TEXT field commas/semicolons per RFC 5545. */
function escapeIcsText(text: string): string {
  return text.replace(/([,;])/g, "\\$1");
}

/**
 * Build "Add to Calendar" links for a confirmed booking:
 * - `gcal`: Google Calendar TEMPLATE URL (UTC stamps, 2-hour session)
 * - `ics`: data-URI VCALENDAR download (works in Apple/Outlook/mobile)
 */
export function buildCalendarLinks(dateStr: string, timeStr: string): { gcal: string; ics: string } {
  const start = toUtcStamp(dateStr, timeStr);
  const end = toUtcStamp(dateStr, timeStr, SESSION_HOURS);
  const location = `Agroastery Private Bar, ${ADDRESS}`;
  const summary = "Konsultasi Kopi Agroastery";
  const details = "Sesi konsultasi kopi 2 jam di roastery Agroastery.";

  const gcal =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(summary)}` +
    `&dates=${start}/${end}` +
    `&location=${encodeURIComponent(location)}` +
    `&details=${encodeURIComponent(details)}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agroastery//Konsultasi//ID",
    "BEGIN:VEVENT",
    `UID:konsultasi-${dateStr}-${timeStr.replace(":", "")}@agroastery.com`,
    // DTSTAMP must be a creation timestamp; reusing the event start is a
    // common simplification and is accepted by all major clients.
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return { gcal, ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}
