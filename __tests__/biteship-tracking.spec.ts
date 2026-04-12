import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/orders/${id}/tracking`);
}

function mockOrder(overrides: Record<string, unknown> = {}) {
  const defaults = {
    id: 'order-1',
    user_id: null,
    status: 'processing',
    biteship_order_id: null,
    tracking_number: null,
    shipping_courier: 'jne',
  };
  const data = { ...defaults, ...overrides };
  const single = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
}

describe('GET /api/orders/[id]/tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BITESHIP_API_KEY = 'test-key';
  });

  it('returns 404 when order does not exist', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('bad-id'), { params: Promise.resolve({ id: 'bad-id' }) });
    expect(res.status).toBe(404);
  });

  it('returns dispatched:false when biteship_order_id is null', async () => {
    mockOrder({ biteship_order_id: null, tracking_number: null });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dispatched).toBe(false);
    expect(body.status).toBe('processing');
    expect(body.tracking).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns dispatched:false when tracking_number is null (waybill not yet assigned)', async () => {
    mockOrder({ biteship_order_id: 'bs-order-1', tracking_number: null });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(body.dispatched).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls Biteship public tracking API and returns normalized history', async () => {
    mockOrder({ biteship_order_id: 'bs-order-1', tracking_number: 'JNE-9999', status: 'shipped' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'dropping_off',
        waybill_id: 'JNE-9999',
        courier: { company: 'jne' },
        link: 'https://tracking.jne.co.id/JNE-9999',
        history: [
          { status: 'confirmed', note: 'Order confirmed', updated_at: '2026-04-12T10:00:00+07:00' },
          { status: 'picked',    note: 'Package picked up', updated_at: '2026-04-12T14:00:00+07:00' },
        ],
      }),
    });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dispatched).toBe(true);
    expect(body.waybill_id).toBe('JNE-9999');
    expect(body.courier).toBe('jne');
    expect(body.link).toBe('https://tracking.jne.co.id/JNE-9999');
    expect(body.history).toHaveLength(2);
    expect(body.history[0]).toEqual({
      status: 'confirmed',
      note: 'Order confirmed',
      updated_at: '2026-04-12T10:00:00+07:00',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.biteship.com/v1/trackings/JNE-9999/couriers/jne',
      { headers: { Authorization: 'Bearer test-key' } }
    );
  });

  it('returns dispatched:true with empty history when Biteship tracking not yet available', async () => {
    mockOrder({ biteship_order_id: 'bs-order-1', tracking_number: 'JNE-9999', status: 'processing' });

    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Not found' }) });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.waybill_id).toBe('JNE-9999');
    expect(body.history).toEqual([]);
  });
});
