/**
 * Regression tests for issue #200 — courier fallback on terminal retry failure.
 * Covers the three test mandates from the issue: fallback selection order,
 * budget guard (never silently exceed the paid shipping cost), and the
 * downgrade/customer-notification path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BiteshipPricing } from '@/lib/types/shipping';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const { mockFrom, mockFetchRates, mockCreateDraft, mockOpsAlert } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFetchRates: vi.fn(),
  mockCreateDraft: vi.fn(),
  mockOpsAlert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/biteship/rates', () => ({
  fetchBiteshipRates: (...args: unknown[]) => mockFetchRates(...args),
  findRateMatch: vi.fn(),
}));

vi.mock('@/lib/biteship/createDraft', () => ({
  createBiteshipDraft: (...args: unknown[]) => mockCreateDraft(...args),
}));

vi.mock('@/lib/telegram/opsAlert', () => ({
  sendOpsAlert: (...args: unknown[]) => mockOpsAlert(...args),
}));

import {
  rankFallbackCandidates,
  autoApplicableCandidates,
  formatCandidatesForAlert,
  attemptCourierFallback,
  type RankedCandidate,
} from './courierFallback';

function rate(
  courier: string,
  service: string,
  price: number,
  serviceType?: string,
  duration = '1 - 2 days'
): BiteshipPricing {
  return {
    courier_code: courier,
    courier_name: courier.toUpperCase(),
    courier_service_code: service,
    courier_service_name: service,
    service_type: serviceType,
    duration,
    price,
    currency: 'IDR',
  };
}

// Incident-shaped lane (AGR-20260928-97YXK5): customer paid Rp 23.000 for
// grab/same_day; live alternatives below.
const LANE = [
  rate('grab', 'same_day', 23000, 'same_day', '4-8 hours'), // the failed selection itself
  rate('grab', 'instant_car', 20000, 'instant', '1-2 hours'), // tier 1, in budget
  rate('gojek', 'same_day', 34000, 'same_day', '4-8 hours'), // tier 2, OVER budget
  rate('jne', 'yes', 18000, 'standard', '1 day'), // tier 3 (SLA downgrade)
  rate('sicepat', 'best', 14000, 'standard', '1 day'), // tier 3, cheaper
  rate('jne', 'reg', 10000, 'standard', '2 - 3 days'), // tier 3, cheapest
];

const SELECTED = { courierCode: 'grab', serviceCode: 'same_day', budget: 23000 };

describe('rankFallbackCandidates (#200 A3: SLA first, price second)', () => {
  it('orders tier 1 → tier 2 → tier 3, price ascending inside each tier', () => {
    const ranked = rankFallbackCandidates(LANE, SELECTED);
    expect(ranked.map((c) => c.tier)).toEqual([1, 2, 3, 3, 3]);
    expect(ranked[0].rate.courier_code).toBe('grab');
    expect(ranked[0].rate.courier_service_code).toBe('instant_car');
    expect(ranked[1].rate.courier_code).toBe('gojek'); // same-day-equivalent next, even over budget
    // tier 3 sorted by price: jne reg 10k before sicepat best 14k before jne yes 18k
    expect(ranked.slice(2).map((c) => c.rate.price)).toEqual([10000, 14000, 18000]);
  });

  it('excludes the failed courier/service pair itself', () => {
    const ranked = rankFallbackCandidates(LANE, SELECTED);
    expect(
      ranked.some((c) => c.rate.courier_code === 'grab' && c.rate.courier_service_code === 'same_day')
    ).toBe(false);
  });

  it('marks over-budget rates withinBudget:false but keeps them in the ranking for the human alert', () => {
    const ranked = rankFallbackCandidates(LANE, SELECTED);
    const gojek = ranked.find((c) => c.rate.courier_code === 'gojek')!;
    expect(gojek.withinBudget).toBe(false);
    const grab = ranked.find((c) => c.rate.courier_code === 'grab')!;
    expect(grab.withinBudget).toBe(true);
  });

  it('unknown/missing service_type classifies as reguler (tier 3, never auto)', () => {
    const ranked = rankFallbackCandidates(
      [rate('anteraja', 'reg', 9000, undefined)],
      SELECTED
    );
    expect(ranked[0].tier).toBe(3);
  });
});

describe('autoApplicableCandidates (#200 money model + A3)', () => {
  it('auto-applies only tier 1/2 within budget — never tier 3, never over budget', () => {
    const auto = autoApplicableCandidates(rankFallbackCandidates(LANE, SELECTED));
    expect(auto).toHaveLength(1);
    expect(auto[0].rate.courier_code).toBe('grab');
    expect(auto[0].rate.courier_service_code).toBe('instant_car');
  });

  it('admits a within-budget tier 2 from another courier', () => {
    const auto = autoApplicableCandidates(
      rankFallbackCandidates(
        [rate('sicepat', 'gokil', SELECTED.budget, 'same_day')],
        SELECTED
      )
    );
    expect(auto.map((c) => c.tier)).toEqual([2]);
  });

  it('a rate priced exactly at the paid shipping cost is within budget', () => {
    const auto = autoApplicableCandidates(
      rankFallbackCandidates([rate('gojek', 'same_day', 23000, 'same_day')], SELECTED)
    );
    expect(auto).toHaveLength(1);
  });
});

describe('formatCandidatesForAlert', () => {
  it('renders code, price, ETD and per-tier flags', () => {
    const ranked = rankFallbackCandidates(LANE, SELECTED);
    const out = formatCandidatesForAlert(ranked);
    expect(out).toContain('grab/instant_car');
    expect(out).toContain('gojek/same_day');
    expect(out).toContain('DI ATAS budget');
    expect(out).toContain('REGULER-perlu clearance');
    expect(out).toContain('kurir sama');
  });

  it('says so when there are no alternatives at all', () => {
    expect(formatCandidatesForAlert([])).toBe('tidak ada alternatif dari re-quote');
  });

  it('caps the list at max (Hick: a human reads this in seconds)', () => {
    const many: RankedCandidate[] = Array.from({ length: 12 }, (_, i) => ({
      rate: rate(`c${i}`, 'svc', 1000 + i, 'standard'),
      tier: 3,
      withinBudget: true,
    }));
    expect(formatCandidatesForAlert(many, 8).split('\n')).toHaveLength(8);
  });
});

// ---- attemptCourierFallback (integration with mocked deps) ----

const ORDER_ROW = {
  id: 'order-1',
  order_number: 'AGR-20260928-97YXK5',
  customer_name: 'Budi',
  customer_phone: '081234567890',
  payment_status: 'paid',
  shipping_courier: 'grab',
  shipping_service: 'same_day',
  shipping_cost: 23000,
  shipping_etd: '4-8 hours',
  shipping_address: {
    recipient_name: 'Budi',
    phone: '081234567890',
    address_line: 'Jl. Kemang Raya 1',
    postal_code: '12730',
    latitude: -6.26,
    longitude: 106.82,
  },
};

function chain(value: unknown, error: unknown = null) {
  const result = Object.assign(Promise.resolve({ data: value, error }), {
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({ data: value, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: value, error }),
  });
  result.eq.mockReturnValue(result);
  result.is.mockReturnValue(result);
  result.select.mockReturnValue(result);
  return result;
}

const UPDATE_CALLS: Record<string, unknown>[] = [];

function installSupabase(orderRow: unknown = ORDER_ROW, items: unknown[] = [
  { product_name: 'Coffee', unit_price: 150000, quantity: 1, ship_weight_grams: 500 },
]) {
  UPDATE_CALLS.length = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === 'ecom_order_items') {
      const c = chain(items);
      return { select: () => c };
    }
    return {
      select: () => {
        const c = chain(null);
        c.eq.mockImplementation(() => {
          const inner = chain(orderRow);
          return inner;
        });
        return c;
      },
      update: (payload: Record<string, unknown>) => {
        UPDATE_CALLS.push(payload);
        return chain(null);
      },
    };
  });
}

describe('attemptCourierFallback (#200: re-quote, pick, book, notify)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installSupabase();
    mockFetchRates.mockResolvedValue(LANE);
    mockCreateDraft.mockResolvedValue(undefined);
  });

  it('books the top auto-applicable candidate and returns applied', async () => {
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('applied');
    expect(mockCreateDraft).toHaveBeenCalledTimes(1);
    const [orderId, refId] = mockCreateDraft.mock.calls[0];
    expect(orderId).toBe('order-1');
    expect(refId).toMatch(/^order-1--fallback-\d+-1$/);
    // The swap persisted BEFORE drafting is the tier-1 candidate.
    expect(out.kind === 'applied' && out.applied.rate.courier_service_code).toBe('instant_car');
  });

  it('BUDGET GUARD: never books an over-budget or tier-3 courier without a human', async () => {
    // Lane where the only alternatives are tier 3 (reguler) or over budget.
    mockFetchRates.mockResolvedValue([
      rate('grab', 'same_day', 23000, 'same_day'),
      rate('gojek', 'same_day', 34000, 'same_day'),
      rate('jne', 'reg', 10000, 'standard'),
    ]);
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('no_candidates');
    expect(mockCreateDraft).not.toHaveBeenCalled();
    if (out.kind !== 'no_candidates') return;
    expect(out.reason).toBe('no in-budget tier 1/2 alternative');
    // Ranked list still carries every alternative (flagged) for the alert.
    expect(out.ranked.some((c) => c.rate.courier_code === 'gojek' && !c.withinBudget)).toBe(true);
    expect(out.ranked.every((c) => c.tier === 3 || !c.withinBudget)).toBe(true);
  });

  it('CUSTOMER NOTIFICATION (A2/A4): a tier-2 swap alert carries the pre-filled WA link', async () => {
    mockFetchRates.mockResolvedValue([
      rate('grab', 'same_day', 23000, 'same_day'),
      rate('sicepat', 'gokil', 20000, 'same_day', '6-8 hours'),
    ]);
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('applied');
    expect(mockOpsAlert).toHaveBeenCalledTimes(1);
    const issue = mockOpsAlert.mock.calls[0][0].issue as string;
    expect(issue).toContain('kirim WA ke pelanggan');
    expect(issue).toContain('https://wa.me/');
    expect(decodeURIComponent(issue)).toContain('pindahkan ke kurir');
  });

  it('tier-1 same-courier swap stays silent to the customer (A2) — no WA link in the alert', async () => {
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('applied');
    const issue = mockOpsAlert.mock.calls[0][0].issue as string;
    expect(issue).toContain('FALLBACK KURIR:');
    expect(issue).not.toContain('wa.me');
  });

  it('tries the next candidate when drafting fails, restoring the original pair first', async () => {
    mockFetchRates.mockResolvedValue([
      rate('grab', 'instant_car', 20000, 'instant'),
      rate('sicepat', 'gokil', 21000, 'same_day'),
    ]);
    mockCreateDraft
      .mockRejectedValueOnce(new Error('[createBiteshipDraft] Biteship draft API error'))
      .mockResolvedValue(undefined);

    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('applied');
    if (out.kind !== 'applied') return;
    expect(out.applied.rate.courier_code).toBe('sicepat');
    expect(out.tried).toHaveLength(2);
    // After the first failure the row is restored to what the customer bought.
    const restore = UPDATE_CALLS.find(
      (u) => u.shipping_courier === 'grab' && u.shipping_service === 'same_day' && UPDATE_CALLS.indexOf(u) > UPDATE_CALLS.findIndex((x) => x.shipping_courier === 'grab' && x.shipping_service === 'instant_car')
    );
    expect(restore).toBeTruthy();
  });

  it('all candidates fail → all_failed with tried list, no alert spam', async () => {
    mockFetchRates.mockResolvedValue([
      rate('grab', 'instant_car', 20000, 'instant'),
      rate('sicepat', 'gokil', 21000, 'same_day'),
    ]);
    mockCreateDraft.mockRejectedValue(new Error('Biteship down'));
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('all_failed');
    if (out.kind !== 'all_failed') return;
    expect(out.tried).toHaveLength(2);
    expect(mockOpsAlert).not.toHaveBeenCalled();
  });

  it('skips the fallback entirely for a non-paid order (money model)', async () => {
    installSupabase({ ...ORDER_ROW, payment_status: 'expired' });
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('no_candidates');
    if (out.kind !== 'no_candidates') return;
    expect(out.reason).toContain("payment_status is 'expired'");
    expect(mockFetchRates).not.toHaveBeenCalled();
  });

  it('re-quote failure degrades to no_candidates instead of throwing', async () => {
    mockFetchRates.mockRejectedValue(new Error('[biteship/rates] Biteship returned 500'));
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('no_candidates');
    if (out.kind !== 'no_candidates') return;
    expect(out.reason).toContain('re-quote failed');
    expect(mockCreateDraft).not.toHaveBeenCalled();
  });

  it('caps auto-booked alternative drafts at MAX_FALLBACK_ATTEMPTS (3)', async () => {
    mockFetchRates.mockResolvedValue([
      rate('grab', 'instant_car', 12000, 'instant'),
      rate('sicepat', 'gokil', 13000, 'same_day'),
      rate('gojek', 'instant_car', 14000, 'instant'),
      rate('lalamove', 'instant', 15000, 'instant'),
    ]);
    mockCreateDraft.mockRejectedValue(new Error('Biteship down'));
    const out = await attemptCourierFallback('order-1');
    expect(mockCreateDraft).toHaveBeenCalledTimes(3);
    expect(out.kind).toBe('all_failed');
  });

  it('missing courier on the order short-circuits without a re-quote', async () => {
    installSupabase({ ...ORDER_ROW, shipping_courier: null });
    const out = await attemptCourierFallback('order-1');
    expect(out.kind).toBe('no_candidates');
    expect(mockFetchRates).not.toHaveBeenCalled();
  });

  it('re-quotes with origin geo present using the geo courier list (parity with checkout)', async () => {
    await attemptCourierFallback('order-1');
    expect(mockFetchRates).toHaveBeenCalledTimes(1);
    const params = mockFetchRates.mock.calls[0][0];
    expect(params.couriers).toBe('anteraja,jne,sicepat,lalamove,grab,gojek');
    expect(typeof params.originLatitude).toBe('number');
    expect(params.destinationLatitude).toBe(-6.26);
  });
});
