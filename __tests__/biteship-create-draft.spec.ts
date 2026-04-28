import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function resolvedChain(data: unknown, error: unknown = null) {
  const result = Object.assign(Promise.resolve({ data, error }), {
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({ data, error }),
  });
  result.eq.mockReturnValue(result);
  result.select.mockReturnValue(result);
  return result;
}

const ORDER_ROW = {
  id: 'order-1',
  order_number: 'AGR-20260427-ABC',
  customer_name: 'Budi',
  customer_phone: '08111',
  customer_email: 'budi@test.com',
  shipping_address: {
    recipient_name: 'Budi Santoso',
    phone: '08111',
    address_line: 'Jl. Merdeka 1',
    postal_code: '12240',
    latitude: null,
    longitude: null,
  },
  shipping_courier: 'jne',
  shipping_service: 'reg',
  notes: 'handle with care',
};

const ITEMS_ROW = [
  { product_name: 'Kopi Arabika 150g', unit_price: 120000, quantity: 2, ship_weight_grams: 220 },
];

function setupHappyPathMocks() {
  let callIndex = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === 'ecom_orders' && callIndex === 0) {
      callIndex++;
      return { select: vi.fn().mockReturnValue(resolvedChain(ORDER_ROW)) };
    }
    if (table === 'ecom_order_items') {
      return { select: vi.fn().mockReturnValue(resolvedChain(ITEMS_ROW)) };
    }
    return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
  });
}

describe('createBiteshipDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BITESHIP_API_KEY = 'test-key';
    process.env.ORIGIN_CONTACT_NAME = 'Agroastery';
    process.env.ORIGIN_CONTACT_PHONE = '08123456789';
    process.env.ORIGIN_ADDRESS = 'Jl. Test Origin';
    process.env.ORIGIN_POSTAL_CODE = '12440';
    process.env.ORIGIN_LATITUDE = '-6.2634';
    process.env.ORIGIN_LONGITUDE = '106.8194';
  });

  it('skips Biteship call when shipping_courier is null', async () => {
    const { createBiteshipDraft } = await import('@/lib/biteship/createDraft');
    const noCourier = { ...ORDER_ROW, shipping_courier: null, shipping_service: null };
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(resolvedChain(noCourier)) });
    await createBiteshipDraft('order-1');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls POST /v1/draft_orders and stores biteship_draft_id', async () => {
    const { createBiteshipDraft } = await import('@/lib/biteship/createDraft');
    setupHappyPathMocks();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, id: 'bs-draft-xyz' }),
    });

    await createBiteshipDraft('order-1');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.biteship.com/v1/draft_orders');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const payload = JSON.parse(options.body as string);
    expect(payload.courier_company).toBe('jne');
    expect(payload.courier_type).toBe('reg');
    expect(payload.delivery_type).toBe('now');
    expect(payload.reference_id).toBe('AGR-20260427-ABC');
    expect(payload.items).toHaveLength(1);
  });

  it('recovers idempotently when reference_id already exists (42211015)', async () => {
    const { createBiteshipDraft } = await import('@/lib/biteship/createDraft');
    setupHappyPathMocks();
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, code: 42211015, error: 'Reference ID taken' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          drafts: [{ id: 'bs-draft-existing', reference_id: 'AGR-20260427-ABC' }],
        }),
      });

    await createBiteshipDraft('order-1');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, lookupOptions] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(mockFetch.mock.calls[1][0]).toContain('/v1/draft_orders?reference_id=AGR-20260427-ABC');
    expect(lookupOptions.method ?? 'GET').toBe('GET');
  });

  it('throws on non-recoverable Biteship error', async () => {
    const { createBiteshipDraft } = await import('@/lib/biteship/createDraft');
    setupHappyPathMocks();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, code: 40011001, error: 'Bad request' }),
    });
    await expect(createBiteshipDraft('order-1')).rejects.toThrow(/Biteship/);
  });
});
