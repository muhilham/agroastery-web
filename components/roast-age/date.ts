const WIB = "Asia/Jakarta";
const MS_PER_DAY = 86_400_000;

/** Current calendar date in WIB as YYYY-MM-DD, regardless of host timezone. */
export function getTodayWIB(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Strict YYYY-MM-DD validation, including impossible calendar dates. */
export function isRoastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

function toUtcMs(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Calendar-day diff: to minus from. Negative when to is before from. */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** Roast date plus N days, as YYYY-MM-DD. */
export function addDays(value: string, days: number): string {
  return new Date(toUtcMs(value) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Written-out Indonesian date, e.g. "4 Agustus 2026". */
export function formatDateID(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export type MilestoneStatus =
  | { kind: "today" }
  | { kind: "future"; days: number }
  | { kind: "past"; days: number };

/** Status of a milestone date relative to today. */
export function milestoneStatus(milestoneDate: string, today: string): MilestoneStatus {
  const diff = diffDays(today, milestoneDate);
  if (diff === 0) return { kind: "today" };
  if (diff > 0) return { kind: "future", days: diff };
  return { kind: "past", days: -diff };
}

/** Normalize a coffee name param: trim, cap at 60 chars. Null when absent/empty. */
export function parseCoffeeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 60);
}

/** Parse a custom rest-day param: integer 1-365. Null when invalid. */
export function parseRestDays(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (!/^\d+$/.test(value)) return null;
  const n = Number.parseInt(value, 10);
  if (n < 1 || n > 365) return null;
  return n;
}
