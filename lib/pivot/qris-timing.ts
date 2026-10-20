/**
 * QRIS timing constants shared by server routes and the payment pages
 * (issue #231). Lives apart from lib/pivot/client.ts so client components
 * can import these without bundling the Pivot API client.
 */

/** QRIS payment-session expiry, merchant-set via `expiryAt` (issue #221).
 * Pivot defaults session expiry to 15 mins. */
export const QRIS_EXPIRY_MINUTES = 60;

/** Total time an unpaid order may survive across session refreshes. */
export const QRIS_MAX_HOLD_MINUTES = 240;

/**
 * Proactive QR reissue age (issue #231 A3).
 *
 * The displayed countdown tracks the Pivot SESSION window
 * (QRIS_EXPIRY_MINUTES), but production evidence shows the acquirer (BRI)
 * enforces a SHORTER payable TTL on the QR's RRN regardless of the
 * `expiryAt` we send: a scan at ~15-40 min of QR age was rejected while
 * the session was still alive, and a fresh QR from the same customer paid
 * in 1 minute (AGR-20261019-PKMCR9 / -GF3HRV).
 *
 * Until Pivot confirms the real acquirer TTL (issue #231 A1), we do NOT
 * change the displayed horizon (A2 is deliberately deferred) — instead the
 * payment page reissues the QR once the displayed code reaches this age,
 * so a customer on the page never scans a code older than 12 minutes.
 * 12 min leaves a 3-min margin below the observed ~15 min failure floor.
 */
export const QRIS_REFRESH_AFTER_MINUTES = 12;

/**
 * Countdown-remaining threshold at which the reissue fires, given a session
 * created with the full QRIS_EXPIRY_MINUTES window: a fresh session shows
 * secondsLeft ≈ 60 min, so the QR reaches age 12 min at
 * (60 − 12) × 60 = 2880 remaining seconds. Client pages compare
 * `secondsLeft <= QRIS_REFRESH_AT_SECONDS`.
 */
export const QRIS_REFRESH_AT_SECONDS =
  (QRIS_EXPIRY_MINUTES - QRIS_REFRESH_AFTER_MINUTES) * 60;
