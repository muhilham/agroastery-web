/**
 * Minimal per-IP guard for the public shipping proxy (issue #154).
 *
 * /api/shipping/rates is an open pass-through to Biteship. #139 made checkout
 * fail-closed on Biteship errors, so unthrottled abuse (quota burn) would take
 * down every delivery checkout. This is an in-memory sliding-window limiter:
 * per-instance (Railway single container), no Redis — enough to make looping
 * expensive while being generous for real shoppers (debounced re-quotes,
 * shared-carrier NAT IPs).
 */

const WINDOW_MS = 60_000;
export const RATE_LIMIT_PER_MIN = 60;
/** Cap the proxy payload: legit carts are tiny; scrapers/abuse send bulk. */
export const MAX_BODY_BYTES = 16 * 1024;

type Bucket = number[];

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Keep the map bounded regardless of IP churn. */
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [ip, times] of buckets) {
    const fresh = times.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) buckets.delete(ip);
    else buckets.set(ip, fresh);
  }
}

/**
 * Record a hit for `ip` and report whether the request may proceed.
 * True => allowed; false => 429 (caller sends Retry-After).
 */
export function consumeRate(ip: string, now = Date.now()): boolean {
  sweep(now);
  const times = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= RATE_LIMIT_PER_MIN) {
    buckets.set(ip, times);
    return false;
  }
  times.push(now);
  buckets.set(ip, times);
  return true;
}

/** Retry-After seconds for a 429 once the bucket has been rejected. */
export function retryAfterSeconds(ip: string, now = Date.now()): number {
  const times = buckets.get(ip);
  if (!times || times.length === 0) return 5;
  const oldest = now - times[0];
  return Math.max(1, Math.ceil((WINDOW_MS - oldest) / 1000));
}

/** Test seam: drop all state between cases. */
export function __resetRateBuckets() {
  buckets.clear();
  lastSweep = Date.now();
}
