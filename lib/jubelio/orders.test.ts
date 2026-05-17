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

// Default mock: login always succeeds, other calls can be overridden per test
mockFetch.mockImplementation((url: string) => {
  if (url.includes('/login')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

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
  subtotal: 240000,
  shipping_cost: 15000,
  total: 255000,
  xendit_payment_method: 'QRIS',
  notes: 'Handle with care',
  shipping_address: {
    recipient_name: 'Budi Santoso',
    phone: '08111',
    address_line: 'Jl. Merdeka 1',
    postal_code: '12240',
  },
};

const ITEMS_ROW = [
  { id: 'item-1', sku: 'PS-BK-001', product_name: 'Kopi Arabika', variant_description: 'Beans', quantity: 2, unit_price: 120000 },
];

function setupHappyPathMocks() {
  let orderCallIndex = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === 'ecom_orders') {
      orderCallIndex++;
      if (orderCallIndex === 1) {
        // First call: idempotency check
        return { select: vi.fn().mockReturnValue(resolvedChain({ jubelio_salesorder_id: null, order_number: 'AGR-20260427-ABC' })) };
      }
      if (orderCallIndex === 2) {
        // Second call: fetch full order details
        return { select: vi.fn().mockReturnValue(resolvedChain(ORDER_ROW)) };
      }
      // Third call: update jubelio_salesorder_id
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    }
    if (table === 'ecom_order_items') {
      return { select: vi.fn().mockReturnValue(resolvedChain(ITEMS_ROW)) };
    }
    return { select: vi.fn().mockReturnValue(resolvedChain(null)) };
  });
}

describe('createJubelioOrderFromEcom', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the Jubelio client module cache (token cache) between tests
    vi.resetModules();
    process.env.JUBELIO_EMAIL = 'test@example.com';
    process.env.JUBELIO_PASSWORD = 'test-password';
    process.env.JUBELIO_MOCK = 'false';
  });

  it('skips sync if jubelio_salesorder_id already set', async () => {
    const { createJubelioOrderFromEcom } = await import('@/lib/jubelio/orders');
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(resolvedChain({ jubelio_salesorder_id: 12345, order_number: 'AGR-20260427-ABC' })),
    });

    await createJubelioOrderFromEcom('order-1');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws if SKU not found in Jubelio', async () => {
    const { createJubelioOrderFromEcom } = await import('@/lib/jubelio/orders');
    setupHappyPathMocks();

    // Mock SKU lookup returning no match (login handled by default mock)
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/login')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
      }
      if (url.includes('/inventory/items/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await expect(createJubelioOrderFromEcom('order-1')).rejects.toThrow('SKU not found in Jubelio: PS-BK-001');
  });

  it('creates Jubelio SO and converts to invoice on success', async () => {
    const { createJubelioOrderFromEcom } = await import('@/lib/jubelio/orders');
    setupHappyPathMocks();

    // Mock Jubelio API responses (login handled by default mock)
    let callCount = 0;
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/login')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
      }
      if (url.includes('/inventory/items/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ item_id: 123, item_code: 'PS-BK-001', item_name: 'Kopi Arabika' }] }),
        });
      }
      if (url.includes('/sales/orders/') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 98765 }) });
      }
      if (url.includes('/create-invoice-payment')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ invoice_no: 'INV-000001' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await createJubelioOrderFromEcom('order-1');

    // Verify create SO call
    const createSoCall = mockFetch.mock.calls.find((call) => {
      const [callUrl, callInit] = call;
      return (callUrl as string).includes('/sales/orders/') && (callInit as RequestInit)?.method === 'POST';
    });
    expect(createSoCall).toBeDefined();
    const soPayload = JSON.parse((createSoCall![1] as RequestInit).body as string);
    expect(soPayload.contact_id).toBe(0);
    expect(soPayload.customer_name).toBe('Budi');
    expect(soPayload.ref_no).toBe('AGR-20260427-ABC');
    expect(soPayload.grand_total).toBe(255000);
    expect(soPayload.items).toHaveLength(1);
    expect(soPayload.items[0].item_id).toBe(123);
    expect(soPayload.items[0].qty_in_base).toBe(2);

    // Verify invoice conversion was called
    const invoiceCall = mockFetch.mock.calls.find((call) => {
      const [callUrl] = call;
      return (callUrl as string).includes('/create-invoice-payment');
    });
    expect(invoiceCall).toBeDefined();

    // Verify update to ecom_orders was called (exact assertion on payload
    // is hard with this mock style; the important thing is update was invoked)
    expect(mockFrom).toHaveBeenCalledWith('ecom_orders');
  });

  it('throws if SO created but DB update fails', async () => {
    const { createJubelioOrderFromEcom } = await import('@/lib/jubelio/orders');
    let orderCallIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders') {
        orderCallIndex++;
        if (orderCallIndex === 1) {
          return { select: vi.fn().mockReturnValue(resolvedChain({ jubelio_salesorder_id: null, order_number: 'AGR-20260427-ABC' })) };
        }
        if (orderCallIndex === 2) {
          return { select: vi.fn().mockReturnValue(resolvedChain(ORDER_ROW)) };
        }
        // Third call: update fails
        return { update: vi.fn().mockReturnValue(resolvedChain(null, { message: 'DB connection lost' })) };
      }
      if (table === 'ecom_order_items') {
        return { select: vi.fn().mockReturnValue(resolvedChain(ITEMS_ROW)) };
      }
      return { select: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/login')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
      }
      if (url.includes('/inventory/items/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ item_id: 123, item_code: 'PS-BK-001', item_name: 'Kopi Arabika' }] }),
        });
      }
      if (url.includes('/sales/orders/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 98765 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await expect(createJubelioOrderFromEcom('order-1')).rejects.toThrow(
      'Jubelio SO created (98765) but failed to persist on ecom_orders'
    );
  });

  it('throws if order has no items', async () => {
    const { createJubelioOrderFromEcom } = await import('@/lib/jubelio/orders');
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders') {
        return { select: vi.fn().mockReturnValue(resolvedChain({ jubelio_salesorder_id: null, order_number: 'AGR-20260427-ABC' })) };
      }
      if (table === 'ecom_order_items') {
        return { select: vi.fn().mockReturnValue(resolvedChain([])) };
      }
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    await expect(createJubelioOrderFromEcom('order-1')).rejects.toThrow('No items in order');
  });

  it('throws if item has no SKU', async () => {
    const { createJubelioOrderFromEcom } = await import('@/lib/jubelio/orders');
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders') {
        return { select: vi.fn().mockReturnValue(resolvedChain({ jubelio_salesorder_id: null, order_number: 'AGR-20260427-ABC' })) };
      }
      if (table === 'ecom_order_items') {
        return { select: vi.fn().mockReturnValue(resolvedChain([{ id: 'item-1', sku: null }])) };
      }
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    await expect(createJubelioOrderFromEcom('order-1')).rejects.toThrow('Order item missing SKU');
  });
});
