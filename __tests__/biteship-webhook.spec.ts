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
function makeChain(resolvedValue: { data: unknown; error: unknown } = { data: null, error: null }) {
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
    delete process.env.BITESHIP_API_KEY;
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

  it('saves courier_tracking_id from order.status event', async () => {
    const matched = { data: { id: 'ecom-99' }, error: null };
    makeChain(matched);

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.status',
        order_id: 'bs-123',
        status: 'picked',
        courier_tracking_id: 'track-abc',
      })
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'shipped',
      courier_tracking_id: 'track-abc',
    });
  });

  it('saves courier_tracking_id from order.waybill_id event', async () => {
    const matched = { data: { id: 'ecom-99' }, error: null };
    makeChain(matched);

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.waybill_id',
        order_id: 'bs-123',
        courier_waybill_id: 'JNE-9999',
        courier_tracking_id: 'track-xyz',
      })
    );

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      tracking_number: 'JNE-9999',
      courier_tracking_id: 'track-xyz',
    });
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

  it('returns 200 for empty body without secret (registration probe)', async () => {
    delete process.env.BITESHIP_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      new NextRequest('http://localhost/api/webhooks/biteship', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(res.status).toBe(200);
  });

  it('returns 401 for real webhook without secret when env var is set', async () => {
    process.env.BITESHIP_WEBHOOK_SECRET = 'test-secret';
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      new NextRequest('http://localhost/api/webhooks/biteship', {
        method: 'POST',
        body: JSON.stringify({ event: 'order.status', order_id: 'bs-123', status: 'picked' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(res.status).toBe(401);
  });

  it('falls back to Biteship API fetch when biteship_order_id miss, then persists order_id', async () => {
    process.env.BITESHIP_API_KEY = 'test-key';

    const noMatch = { data: null, error: null };
    const matched = { data: { id: 'ecom-99' }, error: null };

    const updateByOrderId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(noMatch) }),
      }),
    });
    const updateByDraftId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(matched) }),
      }),
    });
    const updateAttachOrderId = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { update: updateByOrderId };
      if (call === 2) return { update: updateByDraftId };
      return { update: updateAttachOrderId };
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ draft_order_id: 'bs-draft-uuid' }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.status',
        order_id: 'bs-new-after-confirm',
        status: 'confirmed',
      })
    );

    expect(res.status).toBe(200);
    expect(updateByOrderId).toHaveBeenCalledWith({ status: 'processing' });
    expect(updateByDraftId).toHaveBeenCalledWith({ status: 'processing' });
    expect(updateAttachOrderId).toHaveBeenCalledWith({ biteship_order_id: 'bs-new-after-confirm' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.biteship.com/v1/orders/bs-new-after-confirm',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      })
    );
  });

  it('does not call Biteship API when biteship_order_id matches', async () => {
    const matched = { data: { id: 'ecom-99' }, error: null };
    const updateByOrderId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(matched) }),
      }),
    });

    mockFrom.mockReturnValue({ update: updateByOrderId });

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.status',
        order_id: 'bs-existing',
        reference_id: 'AGR-20260427-ABC',
        status: 'picked',
      })
    );

    expect(res.status).toBe(200);
    expect(updateByOrderId).toHaveBeenCalledOnce();
    expect(updateByOrderId).toHaveBeenCalledWith({ status: 'shipped' });
  });
});
