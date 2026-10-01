/**
 * Schedule-aware Biteship delivery type selection (issue #212).
 *
 * When a Grab/Gojek **same-day** order is placed after operating hours, Biteship's
 * courier rejects it because no drivers are available. Instead of hard-hiding this
 * option (P0) or creating duplicate manual work (the current retry exhaustion path),
 * we auto-schedule for next-morning pickup. The courier/service stay exactly what
 * the customer chose — only the dispatch timing shifts.
 *
 * Instant services (GrabExpress/GoSend) and Lalamove operate 24/7 in Jakarta and are
 * NOT subject to any cutoff — they always use \`delivery_type: 'now'\`.
 *
 * Flow:
 * 1. Is selected courier Grab/Gojek with same_day service? → Check WIB cutoff (16:00).
 *    If past cutoff → schedule for next business morning 08:00.
 * 2. Otherwise → normal \`delivery_type: 'now'\` dispatch.
 */

// ---- Cutoff config via env vars (overridable per season, vendor negotiation) ----
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

  // Determine if this is a same-day (NOT instant) courier — the only type
  // subject to cutoff-based scheduling. Instant/Lalamove/regular couriers
  // always get `delivery_type: 'now'` regardless of wall-clock time.
  const isSameDay = isSameDayCourier(courierCode, serviceCode);
  
  if (!isSameDay) {
    return { deliveryType: 'now' };
  }
  
  // Check if we're past the same-day cutoff (16:00 WIB default)
  const isPastCutoff = isTimePastCutoff(hour, minute);

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

/**
 * Identifies same-day (NOT instant) couriers subject to cutoff-based scheduling.
 * Instant services (GrabExpress/GoSend) and Lalamove run 24/7 in Jakarta — always
 * return `{ delivery_type: 'now' }`. Only same_day services get past-cutoff scheduling.
 */
function isSameDayCourier(courierCode: string, serviceCode: string): boolean {
  const restrictedCouriers = ['grab', 'gojek']; // only these have same_day operating hours
  const samedayServices = ['same_day', 'sameday']; // NOT instant
  
  return (
    restrictedCouriers.includes(courierCode.toLowerCase()) &&
    samedayServices.some(s => serviceCode.toLowerCase().includes(s))
  );
}

/**
 * Check if current WIB time is past the same-day cutoff.
 * Instant services (GrabExpress/GoSend) and Lalamove are NOT subject to this cutoff.
 */
function isTimePastCutoff(currentHour: number, currentMinute: number): boolean {
  return currentHour > SAMEDAY_CUTOFF_HOUR || (currentHour === SAMEDAY_CUTOFF_HOUR && currentMinute >= SAMEDAY_CUTOFF_MINUTE);
}

/**
 * Calculate next business morning pickup date/time.
 * Uses the already-computed WIB Date from determineDeliveryType() to avoid
 * race conditions near midnight WIB where a second wibNow() call could yield
 * a different day-of-week → wrong weekend skip logic.
 */
function calculateNextMorningPickup(nowWib: Date, todayDayOfWeek: number): { dateStr: string; timeStr: string } {
  // Always schedule for tomorrow as the baseline. Then adjust if tomorrow falls
  // on a weekend (Sat→Mon, Sun→Mon).
  let daysToAdd = 1; // Tomorrow
  
  // If today is Saturday (+1 would land on Sunday) → push to Monday
  if (todayDayOfWeek === 6) {
    daysToAdd = 2;
  }
  // Sunday → already +1 = Monday, no adjustment needed
  
  const pickupDate = new Date(nowWib.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  // Set pickup time components
  pickupDate.setHours(MORNING_PICKUP_HOUR, MORNING_PICKUP_MINUTE, 0, 0);

  // Format as YYYY-MM-DD
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pickupDate.getFullYear()}-${pad(pickupDate.getMonth() + 1)}-${pad(pickupDate.getDate())}`;
  const timeStr = `${pad(MORNING_PICKUP_HOUR)}:${pad(MORNING_PICKUP_MINUTE)}`;

  return { dateStr, timeStr };
}
