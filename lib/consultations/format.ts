const DAY_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * "2026-07-28" → "Selasa, 28 Juli 2026".
 * TZ-independent: parse the string and use UTC getters — local getters
 * (.getDay()/.getDate()) re-project onto the process timezone.
 */
export function formatBookingDateId(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_ID[weekday]}, ${d} ${MONTH_ID[m - 1]} ${y}`;
}
