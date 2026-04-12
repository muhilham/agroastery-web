import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Returns a resolved Supabase-style chain (thenable + chainable)
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

describe('createBiteshipOrder', () => {
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
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    const orderChain = resolvedChain({
      id: 'order-1',
      order_number: 'AGR-20260412-ABC',
      customer_name: 'Budi',
      customer_phone: '08111',
      customer_email: null,
      shipping_address: { recipient_name: 'Budi', phone: '08111', address_line: 'Jl. Test' },
      shipping_courier: null,
      shipping_service: null,
      notes: null,
    });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(orderChain) });

    await createBiteshipOrder('order-1');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls POST /v1/orders with correct payload and stores biteship_order_id', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders' && callIndex === 0) {
        callIndex++;
        const chain = resolvedChain({
          id: 'order-1',
          order_number: 'AGR-20260412-ABC',
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
        });
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'ecom_order_items') {
        const chain = resolvedChain([
          { product_name: 'Kopi Arabika 150g', unit_price: 120000, quantity: 2, ship_weight_grams: 220 },
          { product_name: 'Kopi Robusta 250g', unit_price: 95000,  quantity: 1, ship_weight_grams: 330 },
        ]);
        return { select: vi.fn().mockReturnValue(chain) };
      }
      // ecom_orders update call
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        id: 'bs-order-xyz',
        courier: { waybill_id: 'JNE-123456' },
      }),
    });

    await createBiteshipOrder('order-1');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.biteship.com/v1/orders');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer test-key');

    const payload = JSON.parse(options.body as string);
    expect(payload.courier_company).toBe('jne');
    expect(payload.courier_type).toBe('reg');
    expect(payload.reference_id).toBe('AGR-20260412-ABC');
    expect(payload.delivery_type).toBeUndefined();
    expect(payload.order_note).toBe('handle with care');
    expect(payload.origin_postal_code).toBe(12440);
    expect(payload.destination_postal_code).toBe(12240);
    expect(payload.destination_contact_name).toBe('Budi Santoso');
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].category).toBe('food_and_drink');
    expect(payload.items[0].weight).toBe(220);
    expect(payload.items[1].weight).toBe(330);
  });

  it('handles reference_id-already-used (code 40002060) idempotently', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders' && callIndex === 0) {
        callIndex++;
        const chain = resolvedChain({
          id: 'order-1',
          order_number: 'AGR-20260412-ABC',
          customer_name: 'Budi', customer_phone: '08111', customer_email: null,
          shipping_address: { recipient_name: 'Budi', phone: '08111', address_line: 'Jl. X', postal_code: '12240', latitude: null, longitude: null },
          shipping_courier: 'jne', shipping_service: 'reg', notes: null,
        });
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'ecom_order_items') {
        const chain = resolvedChain([
          { product_name: 'Kopi', unit_price: 100000, quantity: 1, ship_weight_grams: 200 },
        ]);
        return { select: vi.fn().mockReturnValue(chain) };
      }
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        code: 40002060,
        details: { order_id: 'bs-existing-id', waybill_id: 'JNE-EXISTING' },
      }),
    });

    // Must not throw — this is idempotent recovery
    await expect(createBiteshipOrder('order-1')).resolves.toBeUndefined();
  });

  it('throws when Biteship returns a non-idempotent error', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders' && callIndex === 0) {
        callIndex++;
        const chain = resolvedChain({
          id: 'order-1', order_number: 'AGR-20260412-ABC',
          customer_name: 'Budi', customer_phone: '08111', customer_email: null,
          shipping_address: { recipient_name: 'Budi', phone: '08111', address_line: 'Jl. X', postal_code: '12240', latitude: null, longitude: null },
          shipping_courier: 'jne', shipping_service: 'reg', notes: null,
        });
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'ecom_order_items') {
        const chain = resolvedChain([{ product_name: 'Kopi', unit_price: 100000, quantity: 1, ship_weight_grams: 200 }]);
        return { select: vi.fn().mockReturnValue(chain) };
      }
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, code: 40011001, error: 'Bad request' }),
    });

    await expect(createBiteshipOrder('order-1')).rejects.toThrow('[createBiteshipOrder]');
  });
});
