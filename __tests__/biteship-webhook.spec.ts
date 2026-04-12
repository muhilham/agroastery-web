import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

// Returns a Supabase chain that is both awaitable and supports .eq/.select/.single
function makeChain(resolvedValue = { data: null, error: null }) {
  const single = vi.fn().mockResolvedValue(resolvedValue);
  const selectChain = { single };
  const select = vi.fn().mockReturnValue(selectChain);
  const eqResult = Object.assign(Promise.resolve(resolvedValue), { select, single });
  const eq = vi.fn().mockReturnValue(eqResult);
  mockUpdate.mockReturnValue({ eq });
  mockFrom.mockReturnValue({ update: mockUpdate });
  return { mockUpdate, eq };
}

function makeRequest(body: unknown, secret = 'test-secret') {
  return new NextRequest(`http://localhost/api/webhooks/biteship?secret=${secret}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/webhooks/biteship', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BITESHIP_WEBHOOK_SECRET = 'test-secret';
    makeChain();
  });

  it('returns 401 for wrong secret', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status' }, 'wrong'));
    expect(res.status).toBe(401);
  });

  it('maps "picked" status to "shipped" and calls update', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', order_id: 'bs-123', status: 'picked' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'shipped' });
  });

  it('maps "delivered" status to "delivered"', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', order_id: 'bs-123', status: 'delivered' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'delivered' });
  });

  it('maps "confirmed" status to "processing"', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', order_id: 'bs-123', status: 'confirmed' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });
  });

  it('updates tracking_number on order.waybill_id event', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.waybill_id', order_id: 'bs-123', courier_waybill_id: 'JNE-9999' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ tracking_number: 'JNE-9999' });
  });

  it('returns 200 for order.price event without calling update', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.price', order_id: 'bs-123', price: 50000 }));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 200 for missing order_id (test webhook ping)', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', status: 'confirmed' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
