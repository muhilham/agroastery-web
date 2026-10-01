/**
 * Courier fallback on terminal retry failure (issue #200).
 *
 * When the retry chain exhausts (or a courier_not_found retry dead-ends),
 * the order still holds the courier the customer chose at checkout — but
 * that courier just proved unavailable for the lane. The full checkout rate
 * list is NOT persisted on the order, so we re-quote the lane live with the
 * same origin/destination/geo the checkout used and rank alternatives.
 *
 * Ranking follows issue #200 amendment A3: SLA match first, price second,
 * budget as a hard constraint on AUTO application only:
 *  - Tier 1: same courier, different service (silent swap allowed, A2)
 *  - Tier 2: different courier, same-day-or-faster group, within the paid
 *            shipping budget (auto swap + proactive customer notification)
 *  - Tier 3: regular/overnight within budget — SLA downgrade, NEVER auto:
 *            requires explicit human clearance + customer notification
 *  - Over budget: never auto-shipped (the merchant would eat the difference
 *            against the shipping the customer already paid); surfaced in
 *            the ranked ops alert for a human decision.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { fetchBiteshipRates, findRateMatch } from './rates';
import { createBiteshipDraft } from './createDraft';
import { sendOpsAlert } from '@/lib/telegram/opsAlert';
import { buildCourierChangeWhatsAppLink } from '@/lib/whatsapp';
import {
  checkoutOriginGeo,
  checkoutOriginPostal,
  buildQuoteItems,
  CHECKOUT_COURIERS_GEO,
  CHECKOUT_COURIERS_POSTAL,
} from '@/lib/checkout/shippingQuote';
import { classifyRateGroup } from '@/lib/shipping/labels';
import type { BiteshipPricing } from '@/lib/types/shipping';

export type FallbackTier = 1 | 2 | 3;

export type RankedCandidate = {
  rate: BiteshipPricing;
  tier: FallbackTier;
  withinBudget: boolean;
};

export type SelectedPair = {
  courierCode: string;
  serviceCode: string;
  /** Shipping the customer already paid (IDR). Auto-application may never
   * pick a rate above this — the merchant would eat the difference. */
  budget: number;
};

/**
 * Pure ranking (exported for tests). Excludes the failed pair itself, then:
 * tier 1 = same courier / different service, tier 2 = instant|same_day from
 * another courier, tier 3 = everything else. Within each tier: price asc,
 * then courier/service code for determinism. Over-budget rates keep their
 * tier but get `withinBudget: false` — they belong in the human alert only.
 */
export function rankFallbackCandidates(
  pricing: BiteshipPricing[],
  selected: SelectedPair
): RankedCandidate[] {
  const candidates = pricing
    .filter(
      (p) =>
        !(p.courier_code === selected.courierCode && p.courier_service_code === selected.serviceCode)
    )
    .map((rate) => {
      const sameCourier = rate.courier_code === selected.courierCode;
      const instan = classifyRateGroup({ serviceType: rate.service_type }) === 'instan';
      const tier: FallbackTier = sameCourier ? 1 : instan ? 2 : 3;
      return { rate, tier, withinBudget: rate.price <= selected.budget };
    });

  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.rate.price !== b.rate.price) return a.rate.price - b.rate.price;
    const ka = `${a.rate.courier_code}/${a.rate.courier_service_code}`;
    const kb = `${b.rate.courier_code}/${b.rate.courier_service_code}`;
    return ka.localeCompare(kb);
  });

  return candidates;
}

/** The subset eligible for automatic booking: tier 1/2 AND within the paid
 * shipping budget. Tier 3 (SLA downgrade) and over-budget rates are never
 * returned here — they need explicit human clearance (#200 A1/A3, money
 * model). */
export function autoApplicableCandidates(candidates: RankedCandidate[]): RankedCandidate[] {
  return candidates.filter((c) => c.tier <= 2 && c.withinBudget);
}

/** Compact ranked list for the ops alert: code, service, price, ETD, flag. */
export function formatCandidatesForAlert(candidates: RankedCandidate[], max = 8): string {
  if (candidates.length === 0) return 'tidak ada alternatif dari re-quote';
  return candidates
    .slice(0, max)
    .map((c) => {
      const flags: string[] = [];
      if (c.tier === 1) flags.push('kurir sama');
      if (c.tier === 2) flags.push('same-day');
      if (c.tier === 3) flags.push('REGULER-perlu clearance');
      if (!c.withinBudget) flags.push('DI ATAS budget');
      const eta = c.rate.duration ?? '-';
      return `• ${c.rate.courier_code}/${c.rate.courier_service_code} Rp ${c.rate.price.toLocaleString(
        'id-ID'
      )} — ${eta}${flags.length ? ` (${flags.join(', ')})` : ''}`;
    })
    .join('\n');
}

/** Max alternative drafts booked per fallback pass — each is a real API
 * call; past this the lane is treated as needing a human. */
const MAX_FALLBACK_ATTEMPTS = 3;

export type FallbackOutcome =
  | { kind: 'applied'; applied: RankedCandidate; tried: RankedCandidate[] }
  | { kind: 'no_candidates'; tried: never[]; ranked: RankedCandidate[]; reason: string }
  | { kind: 'all_failed'; tried: RankedCandidate[]; ranked: RankedCandidate[] };

type FallbackOrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  payment_status: string | null;
  shipping_courier: string | null;
  shipping_service: string | null;
  shipping_cost: number | null;
  shipping_etd: string | null;
  shipping_address: {
    recipient_name?: string;
    phone?: string;
    address_line?: string;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

/**
 * Terminal-failure fallback: re-quote the lane server-side with the same
 * origin/destination/geo checkout used, book the best in-budget alternative
 * (tier 1/2 only), notify ops — and notify the customer via a pre-filled WA
 * link for any swap that differs from what they bought (#200 A2/A4; tier 1
 * same-courier swaps stay silent per A2).
 *
 * Returns the outcome so the caller (retryDraft exhaustion) keeps ownership
 * of the requires_attention transition. Never throws: a re-quote failure
 * degrades to the same human-alert path.
 */
export async function attemptCourierFallback(orderId: string): Promise<FallbackOutcome> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('ecom_orders')
    .select(
      'id, order_number, customer_name, customer_phone, payment_status, shipping_courier, shipping_service, shipping_cost, shipping_etd, shipping_address'
    )
    .eq('id', orderId)
    .maybeSingle<FallbackOrderRow>();

  if (orderError || !order || !order.shipping_courier || !order.shipping_service) {
    return {
      kind: 'no_candidates',
      tried: [],
      ranked: [],
      reason: orderError
        ? `order lookup failed: ${orderError.message}`
        : !order
          ? 'order not found'
          : 'order has no courier selected',
    };
  }

  // Defensive: the draft/retry chain only ever runs for paid orders (created
  // from the payment webhook). An unpaid/expired order must not have its
  // shipping swapped behind the buyer's back — leave it to the existing
  // payment-status flows. (issue #200 money model)
  if (order.payment_status && order.payment_status !== 'paid') {
    return {
      kind: 'no_candidates',
      tried: [],
      ranked: [],
      reason: `payment_status is '${order.payment_status}', not 'paid' — fallback skipped`,
    };
  }

  const addr = order.shipping_address ?? {};
  const destHasGeo =
    typeof addr.latitude === 'number' &&
    Number.isFinite(addr.latitude) &&
    typeof addr.longitude === 'number' &&
    Number.isFinite(addr.longitude);
  const destPostal = addr.postal_code ? Number(addr.postal_code) : undefined;

  if (!destHasGeo && !(typeof destPostal === 'number' && Number.isFinite(destPostal))) {
    return { kind: 'no_candidates', tried: [], ranked: [], reason: 'destination lacks postal + geo' };
  }

  const { data: items } = await supabase
    .from('ecom_order_items')
    .select('product_name, unit_price, quantity, ship_weight_grams')
    .eq('order_id', orderId);

  if (!items || items.length === 0) {
    return { kind: 'no_candidates', tried: [], ranked: [], reason: 'no order items for re-quote' };
  }

  const originGeo = checkoutOriginGeo();
  // Re-quote with the SAME couriers checkout offered (geo list when the quote
  // path carries origin geo, else postal list) so we can never propose a
  // rate the buyer was never shown the possibility of.
  const couriers = originGeo ? CHECKOUT_COURIERS_GEO : CHECKOUT_COURIERS_POSTAL;

  let pricing: BiteshipPricing[];
  try {
    pricing = await fetchBiteshipRates({
      originPostalCode: checkoutOriginPostal(),
      ...(originGeo ?? {}),
      ...(destHasGeo
        ? { destinationLatitude: addr.latitude!, destinationLongitude: addr.longitude! }
        : { destinationPostalCode: destPostal! }),
      couriers,
      items: buildQuoteItems(
        items.map((i) => ({
          name: i.product_name ?? 'Item',
          unitPrice: i.unit_price,
          weightGramsPerUnit: i.ship_weight_grams ?? 0,
          quantity: i.quantity,
        }))
      ),
    });
  } catch (err) {
    return {
      kind: 'no_candidates',
      tried: [],
      ranked: [],
      reason: `re-quote failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const budget = order.shipping_cost ?? 0;
  const ranked = rankFallbackCandidates(pricing, {
    courierCode: order.shipping_courier,
    serviceCode: order.shipping_service,
    budget,
  });
  const auto = autoApplicableCandidates(ranked).slice(0, MAX_FALLBACK_ATTEMPTS);

  if (auto.length === 0) {
    return { kind: 'no_candidates', tried: [], ranked, reason: 'no in-budget tier 1/2 alternative' };
  }

  const tried: RankedCandidate[] = [];
  for (const candidate of auto) {
    tried.push(candidate);
    const referenceId = `${orderId}--fallback-${Date.now()}-${tried.length}`;
    try {
      // Swap the persisted shipping fields BEFORE drafting — createBiteshipDraft
      // re-reads shipping_courier/shipping_service from the row. shipping_cost
      // stays what the customer paid; ETD is overwritten only on success below
      // (stays as-is if drafting fails and we move to the next candidate).
      const { error: swapError } = await supabase
        .from('ecom_orders')
        .update({
          shipping_courier: candidate.rate.courier_code,
          shipping_service: candidate.rate.courier_service_code,
        })
        .eq('id', orderId)
        .is('biteship_draft_id', null);
      if (swapError) {
        console.error(`[courierFallback] swap update failed for ${orderId}:`, swapError);
        continue;
      }

      await createBiteshipDraft(orderId, referenceId);

      const { error: etdError } = await supabase
        .from('ecom_orders')
        .update({ shipping_etd: candidate.rate.duration ?? order.shipping_etd })
        .eq('id', orderId);
      if (etdError) {
        console.error(`[courierFallback] ETD update failed for ${orderId}:`, etdError);
      }

      // Customer notification for any differing swap (A2): build the pre-filled
      // WA link and deliver it through the ops alert — the same customer-contact
      // pattern sendPaymentNotification uses for orders. Tier 1 (same courier,
      // different service) stays silent per A2.
      const waLink =
        candidate.tier >= 2
          ? buildCourierChangeWhatsAppLink({
              phone: addr.phone ?? order.customer_phone ?? '',
              customerName: order.customer_name ?? '',
              orderNumber: order.order_number,
              oldCourier: order.shipping_courier,
              oldService: order.shipping_service,
              newCourier: candidate.rate.courier_code,
              newService: candidate.rate.courier_service_code,
              newServiceName: candidate.rate.courier_service_name,
              newEta: candidate.rate.duration,
            })
          : null;

      await sendOpsAlert({
        orderId,
        orderNumber: order.order_number,
        issue:
          candidate.tier === 1
            ? `FALLBACK KURIR: ${order.shipping_courier}/${order.shipping_service} → ${candidate.rate.courier_code}/${candidate.rate.courier_service_code} (Rp ${candidate.rate.price.toLocaleString('id-ID')}) — draft berhasil`
            : `FALLBACK KURIR (kirim WA ke pelanggan): ${order.shipping_courier}/${order.shipping_service} → ${candidate.rate.courier_code}/${candidate.rate.courier_service_code} (Rp ${candidate.rate.price.toLocaleString('id-ID')}, ETA ${candidate.rate.duration ?? '-'}) — draft berhasil${waLink ? `\n${waLink}` : ''}`,
        action:
          candidate.tier >= 2 && !waLink
            ? 'Nomor pelanggan tidak valid untuk wa.me — hubungi pelanggan manual untuk mengabarkan penggantian kurir'
            : null,
      }).catch(() => {});

      return { kind: 'applied', applied: candidate, tried };
    } catch (err) {
      console.error(
        `[courierFallback] draft via ${candidate.rate.courier_code}/${candidate.rate.courier_service_code} failed for ${orderId}:`,
        err
      );
      // Restore the original pair so the next candidate (and any later manual
      // retry) starts from what the customer actually bought, and so the
      // retryDraft duplicate-draft guard sees a null draft id.
      await supabase
        .from('ecom_orders')
        .update({
          shipping_courier: order.shipping_courier,
          shipping_service: order.shipping_service,
        })
        .eq('id', orderId)
        .is('biteship_draft_id', null)
        .then(() => {});
    }
  }

  return { kind: 'all_failed', tried, ranked };
}

/** Reference for parity with the checkout-selected pair in the ranked list
 * (kept exported so tests/alerts can show what was originally selected). */
export { findRateMatch };
