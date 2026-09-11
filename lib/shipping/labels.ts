/**
 * Display-label normalization for shipping rates (issue #157).
 *
 * Biteship returns English duration strings ("2 - 3 days") and service names
 * that sometimes repeat the carrier ("JNE Trucking" under carrier "JNE").
 * These helpers are display-only: the raw values stay on NormalizedRate.eta /
 * .raw for the order payload and server re-quote matching.
 */

/** "2 - 3 days" -> "2–3 hari", "1 - 1 days" -> "1 hari", "1 days" -> "1 hari".
 *  Unknown formats ("Same day", "2 - 3 weeks") pass through unchanged. */
export function formatEta(eta?: string): string | null {
  if (!eta) return null;
  const trimmed = eta.trim();
  const range = trimmed.match(/^(\d+)\s*-\s*(\d+)\s*(?:days?|hari)$/i);
  if (range) {
    const [, min, max] = range;
    return min === max ? `${min} hari` : `${min}\u2013${max} hari`;
  }
  const single = trimmed.match(/^(\d+)\s*(?:days?|hari)$/i);
  if (single) return `${single[1]} hari`;
  return trimmed;
}

/** Join carrier + service without duplication:
 *  ("JNE", "JNE Trucking") -> "JNE Trucking", ("JNE", "REG") -> "JNE REG". */
export function joinCarrierService(carrier: string, service: string): string {
  const c = carrier.trim();
  const s = service.trim();
  if (!s) return c;
  if (!c || s.toLowerCase() === c.toLowerCase()) return s || c;
  if (s.toLowerCase().startsWith(`${c.toLowerCase()} `)) return s;
  return `${c} ${s}`;
}
