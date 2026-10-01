/**
 * Schedule-aware Biteship delivery type selection (issue #212).
 *
 * Same-day/Instant couriers fail after operating hours because Grab/Gojek/Lalamove
 * don't dispatch late at night. Instead of hard-hiding these options (P0) or creating
 * duplicate manual work (the current retry exhaustion path), we **auto-schedule**
 * them for next-morning pickup. The courier/service stay exactly what the customer chose —
 * only the dispatch timing shifts.
 *
 * Flow:
 * 1. Check if selected courier is same-day/instant
 * 2. If yes AND current WIB is past cutoff → schedule for next business morning
 * 3. If no OR before cutoff → normal `delivery_type: 'now'`
 */

// ---- Cutoff config via env vars (overridable per season, vendor negotiation) ----
const INSTANT_CUTOFF_HOUR = Number(process.env.SAME_DAY_CUTOFF_HOUR ?? 15);
const INSTANT_CUTOFF_MINUTE = Number(process.env.SAME_DAY_CUTOFF_MINUTE ?? 0);
const SAMEDAY_CUTOFF_HOUR = Number(process.env.SAMEDAY_CUTOFF_HOUR ?? 16);
const SAMEDAY_CUTOFF_MINUTE = Number(process.env.SAMEDAY_CUTOFF_MINUTE ?? 0);

// Next-morning pickup window (when courier picks up from roastery)
const MORNING_PICKUP_HOUR = Number(process.env.MORNING_PICKUP_HOUR ?? 8);
const MORNING_PICKUP_MINUTE = Number(process.env.MORNING_PICKUP_MINUTE ?? 0);

export interface ScheduledDeliveryInfo {
  deliveryType: 'now' | 'scheduled';
  /** Only present when deliveryType === 'scheduled' */
  scheduledDate?: string; // YYYY-MM-DD
  /** Only present when deliveryType === 'scheduled' */
  scheduledTime?: string; // HH:mm
}

/** Current wall-clock time in WIB (Asia/Jakarta). Returns a Date whose
 * getFullYear()/getMonth() etc. reflect WIB values, not UTC. */
export function wibNow(): Date {
  const parts = Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string): number => {
    const p = parts.find(p => p.type === type);
    return p ? Number(p.value) : 0;
  };

  return new Date(
    get('year'), get('month') - 1, get('day'),
    get('hour'), get('minute'), get('second')
  );
}

/**
 * Determine whether an order should be delivered now or scheduled, based on
 * the selected courier/service type and current WIB time.
 */
export function determineDeliveryType(courierCode: string, serviceCode: string): ScheduledDeliveryInfo {
  const nowWib = wibNow();
  const hour = nowWib.getHours();
  const minute = nowWib.getMinutes();
  const dayOfWeek = nowWib.getDay(); // 0=Sunday, 6=Saturday

  // Determine if this is a same-day/instant courier
  const isSameDay = isSameDayCourier(courierCode, serviceCode);

  if (!isSameDay) {
    return { deliveryType: 'now' };
  }

  // Check if we're past cutoff time
  const isPastCutoff = isTimePastCutoff(hour, minute, !isInstantCourier(courierCode, serviceCode));

  if (!isPastCutoff) {
    return { deliveryType: 'now' };
  }

  // After cutoff → schedule for next business morning
  // Pass NOWIB directly to avoid re-querying wibNow() near midnight (race condition)
  const { dateStr, timeStr } = calculateNextMorningPickup(nowWib, dayOfWeek);

  return {
    deliveryType: 'scheduled',
    scheduledDate: dateStr,
    scheduledTime: timeStr,
  };
}

/**
 * Build the Biteship payload fields for scheduling. Replaces the static
 * `delivery_type: 'now'` in createDraft so it can switch to scheduled
 * automatically when same-day orders are placed after cutoff.
 */
export function getSchedulingFields(
  courierCode: string,
  serviceCode: string,
  orderId?: string
): Record<string, unknown> {
  const info = determineDeliveryType(courierCode, serviceCode);

  if (info.deliveryType === 'now') {
    return { delivery_type: 'now' };
  }

  // Assert scheduled values are defined — they should always be present for
  // scheduled mode (calculateNextMorningPickup guarantees YYYY-MM-DD and HH:mm).
  if (!info.scheduledDate || !info.scheduledTime) {
    throw new Error(
      `[scheduledDelivery] Missing scheduling fields for ${courierCode}/${serviceCode} (${orderId ?? 'unknown'})`
    );
  }

  console.info(
    '[scheduledDelivery] Order %s switched to scheduled delivery — %s %s → pickup %s @ %s WIB',
    orderId ?? 'unknown',
    courierCode,
    serviceCode,
    info.scheduledDate,
    info.scheduledTime
  );

  return {
    delivery_type: 'scheduled',
    delivery_date: info.scheduledDate,
    delivery_time: info.scheduledTime,
  };
}

// ---- Internal helpers ----

function isSameDayCourier(courierCode: string, serviceCode: string): boolean {
  const samedayCouriers = ['grab', 'gojek', 'lalamove'];
  const samedayServices = ['same_day', 'sameday'];
  const instantServices = ['instant', 'instant_courier', 'go_send', 'grab_express'];
  
  return (
    samedayCouriers.includes(courierCode.toLowerCase()) ||
    samedayServices.some(s => serviceCode.toLowerCase().includes(s)) ||
    instantServices.some(s => serviceCode.toLowerCase().includes(s))
  );
}

function isInstantCourier(courierCode: string, serviceCode: string): boolean {
  const instantServices = ['instant', 'instant_courier', 'go_send', 'grab_express'];
  return instantServices.some(s => serviceCode.toLowerCase().includes(s));
}

function isTimePastCutoff(currentHour: number, currentMinute: number, isSameDay: boolean): boolean {
  const cutoffHour = isSameDay ? SAMEDAY_CUTOFF_HOUR : INSTANT_CUTOFF_HOUR;
  const cutoffMinute = isSameDay ? SAMEDAY_CUTOFF_MINUTE : INSTANT_CUTOFF_MINUTE;
  
  return currentHour > cutoffHour || (currentHour === cutoffHour && currentMinute >= cutoffMinute);
}

/**
 * Calculate next business morning pickup date/time.
 * Uses the already-computed WIB Date from determineDeliveryType() to avoid
 * race conditions near midnight WIB where a second wibNow() call could yield
 * a different day-of-week → wrong weekend skip logic.
 */
function calculateNextMorningPickup(nowWib: Date, todayDayOfWeek: number): { dateStr: string; timeStr: string } {
  // Skip weekends: Saturday (6) and Sunday (0) → next Monday (1)
  let daysToAdd = 0;
  if (todayDayOfWeek === 0) {
    // Sunday → Monday
    daysToAdd = 1;
  } else if (todayDayOfWeek === 6) {
    // Saturday → Monday
    daysToAdd = 2;
  }

  const pickupDate = new Date(nowWib.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  // Set pickup time components
  pickupDate.setHours(MORNING_PICKUP_HOUR, MORNING_PICKUP_MINUTE, 0, 0);

  // Format as YYYY-MM-DD
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pickupDate.getFullYear()}-${pad(pickupDate.getMonth() + 1)}-${pad(pickupDate.getDate())}`;
  const timeStr = `${pad(MORNING_PICKUP_HOUR)}:${pad(MORNING_PICKUP_MINUTE)}`;

  return { dateStr, timeStr };
}
