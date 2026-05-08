import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

const mockCreateDraft = vi.fn();
vi.mock('@/lib/biteship/createDraft', () => ({
  createBiteshipDraft: mockCreateDraft,
}));

const mockNotify = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/telegram/notify', () => ({
  sendPaymentNotification: mockNotify,
}));

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
  order_number: 'AGR-20260427-ABC',
  customer_name: 'Budi',
  customer_phone: '08111',
  total: 240000,
};

describe('retryBiteshipDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createBiteshipDraft with suffixed reference_id on success', async () => {
    mockCreateDraft.mockResolvedValue(undefined);
    const updateMock = vi.fn().mockReturnValue(resolvedChain(ORDER_ROW));
    mockFrom.mockReturnValue({ update: updateMock });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1');

    expect(mockCreateDraft).toHaveBeenCalledOnce();
    const [, refId] = mockCreateDraft.mock.calls[0];
    expect(refId).toMatch(/^order-1--retry-\d+-0$/);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: '✅ BITESHIP DRAFT BERHASIL DIBUAT ULANG' })
    );
  });

  it('recursively retries up to MAX_RETRIES then alerts', async () => {
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: ORDER_ROW, error: null }),
        }),
      }),
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1');

    expect(mockCreateDraft).toHaveBeenCalledTimes(3);
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: '⚠️ BITESHIP GAGAL 3x — perlu tindakan manual' })
    );
  });

  it('sets status to processing on retry success', async () => {
    mockCreateDraft.mockResolvedValue(undefined);
    const updateMock = vi.fn().mockReturnValue(resolvedChain(ORDER_ROW));
    mockFrom.mockReturnValue({ update: updateMock });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1');

    expect(updateMock).toHaveBeenCalledWith({ status: 'processing' });
  });
});
