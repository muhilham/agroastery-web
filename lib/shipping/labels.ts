/**
 * Display-label normalization for shipping rates (issue #157).
 *
 * Biteship returns English duration strings ("2 - 3 days") and service names
 * that sometimes repeat the carrier ("JNE Trucking" under carrier "JNE").
 * These helpers are display-only: the raw values stay on NormalizedRate.eta /
 * .raw for the order payload and server re-quote matching.
 */

import type { NormalizedRate } from "@/lib/types/shipping";

/** "2 - 3 days" -> "2–3 hari", "1 - 1 days" -> "1 hari", "1 days" -> "1 hari".
 * "1 - 2 Hours" -> "1–2 jam" (geo/instant couriers, live-probed #160 — the
 * postal-only path never surfaced hours, so #157 shipped days-only).
 * Unknown formats ("Same day", "2 - 3 weeks") pass through unchanged. */
export function formatEta(eta?: string): string | null {
  if (!eta) return null;
  const trimmed = eta.trim();
  const range = trimmed.match(
    /^(\d+)\s*-\s*(\d+)\s*(days?|hari|hours?|jam)$/i
  );
  if (range) {
    const [, min, max, unit] = range;
    const u = /hour|jam/i.test(unit) ? "jam" : "hari";
    return min === max ? `${min} ${u}` : `${min}\u2013${max} ${u}`;
  }
  const single = trimmed.match(/^(\d+)\s*(days?|hari|hours?|jam)$/i);
  if (single) {
    const [, n, unit] = single;
    return `${n} ${/hour|jam/i.test(unit) ? "jam" : "hari"}`;
  }
  return trimmed;
}

/** Highest ETA floor in hours for ranking "Tercepat"; Infinity when the
 * duration is unparseable so unknown formats never win the badge. */
export function etaFloorHours(eta?: string): number {
  if (!eta) return Infinity;
  const m = eta.trim().match(/^(\d+)(?:\s*-\s*\d+)?\s*(days?|hari|hours?|jam)$/i);
  if (!m) return Infinity;
  const n = Number(m[1]);
  return /hour|jam/i.test(m[2]) ? n : n * 24;
}

/** Buyer-facing grouping key (issue #160). Two sections only: "Instan"
 * (same-day-or-faster on-demand fleets) and "Reguler" (everything else,
 * including overnight "besok sampai" services — they read as regular next-
 * day to a cafe owner, not instant).
 * Single source of truth: Biteship's service_type (live-probed #160: all 12
 * geo rates carry instant|same_day|standard|overnight; postal rates carry
 * standard/overnight only, so the postal path renders Reguler alone and the
 * Instan header never appears empty). Unknown/missing -> reguler (Postel:
 * loose intake, strict display). */
export function classifyRateGroup(rate: Pick<NormalizedRate, "serviceType">): "instan" | "reguler" {
  const t = rate.serviceType?.toLowerCase();
  return t === "instant" || t === "same_day" || t === "sameday" ? "instan" : "reguler";
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
