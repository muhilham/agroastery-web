import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

const mockOpsAlert = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/telegram/opsAlert', () => ({
  sendOpsAlert: mockOpsAlert,
}));

function resolvedChain(data: unknown, error: unknown = null, count: unknown = undefined) {
  const result = Object.assign(Promise.resolve({ data, error, count }), {
    eq: vi.fn(),
    neq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({ data, error, count }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error, count }),
  });
  result.eq.mockReturnValue(result);
  result.neq.mockReturnValue(result);
  result.select.mockReturnValue(result);
  return result;
}

// Guard read at the top of every retryBiteshipDraft call:
// from('ecom_orders').select('biteship_draft_id, status').eq('id', orderId).maybeSingle()
// Returns no stored draft by default so existing paths proceed to create.
function guardChain(biteshipDraftId: string | null = null) {
  return resolvedChain(biteshipDraftId ? { biteship_draft_id: biteshipDraftId } : null);
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls createBiteshipDraft with suffixed reference_id on success', async () => {
    mockCreateDraft.mockResolvedValue(undefined);
    const updateMock = vi.fn().mockReturnValue(resolvedChain(ORDER_ROW));
    const selectMock = vi.fn().mockReturnValue(guardChain());
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders') return { select: selectMock, update: updateMock };
      return { select: selectMock, update: updateMock };
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1');

    expect(mockCreateDraft).toHaveBeenCalledOnce();
    const [, refId] = mockCreateDraft.mock.calls[0];
    expect(refId).toMatch(/^order-1--retry-\d+-0$/);
    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ issue: 'BITESHIP DRAFT BERHASIL DIBUAT ULANG' })
    );
  });

  it('short-circuits when a biteship_draft_id already exists (no duplicate draft, no alert)', async () => {
    const updateMock = vi.fn().mockReturnValue(resolvedChain(null));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(guardChain('draft-existing')),
      update: updateMock,
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1');

    expect(mockCreateDraft).not.toHaveBeenCalled();
    expect(mockOpsAlert).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('guard also fires on the exhaustion re-entry (attempt >= MAX_RETRIES): concurrent success suppresses the terminal alert', async () => {
    // Scenario: this chain's attempts all failed, but a concurrent chain
    // (admin endpoint) succeeded mid-backoff and stored a draft id. The
    // attempt=3 re-entry must NOT overwrite status or alert BITESHIP GAGAL 3x.
    const updateMock = vi.fn().mockReturnValue(resolvedChain(null));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(guardChain('draft-from-concurrent-chain')),
      update: updateMock,
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1', 3);

    expect(updateMock).not.toHaveBeenCalled();
    expect(mockOpsAlert).not.toHaveBeenCalled();
  });

  it('recursively retries up to MAX_RETRIES then alerts and sets requires_attention', async () => {
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    // data rows non-empty — the conditional update matched the row (order
    // not yet flagged), so the terminal alert must fire.
    const updateMock = vi.fn().mockReturnValue(resolvedChain([{ id: 'order-1' }]));
    mockFrom.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        // Guard read resolves via maybeSingle; exhaustion read via single.
        const chain = resolvedChain(ORDER_ROW);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      }),
      update: updateMock,
    });

    vi.useFakeTimers();
    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    const p = retryBiteshipDraft('order-1');
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(300_000);
    await p;

    expect(mockCreateDraft).toHaveBeenCalledTimes(3);
    expect(updateMock).toHaveBeenCalledWith({ status: 'requires_attention' });
    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ issue: 'BITESHIP GAGAL 3x — perlu tindakan manual' })
    );
  });

  it('skips the terminal alert when a concurrent chain already flagged requires_attention (0 rows matched)', async () => {
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    // Conditional update (.neq status) matches nothing -> data [] -> dedupe.
    // Entry guard reports status NOT flagged, so the 0-rows result can only
    // mean a concurrent chain flagged it mid-chain.
    const updateChain = resolvedChain([]);
    const updateMock = vi.fn().mockReturnValue(updateChain);
    mockFrom.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        const chain = resolvedChain(ORDER_ROW);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      }),
      update: updateMock,
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1', 3);

    expect(updateMock).toHaveBeenCalledWith({ status: 'requires_attention' });
    // Pin the dedupe filter itself: without .neq the update would match the
    // flagged row and a refactor dropping it would go undetected.
    expect(updateChain.neq).toHaveBeenCalledWith('status', 'requires_attention');
    expect(mockOpsAlert).not.toHaveBeenCalled();
  });

  it('alerts on re-exhaustion of an order already flagged at chain entry (stale flag, not a concurrent duplicate)', async () => {
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    // Scenario: a previous chain flagged requires_attention days ago; admin
    // re-retry exhausts again. 0 rows matched (neq filter) but wasAlreadyFlagged
    // is true at entry -> this is a NEW terminal failure event -> alert fires.
    const updateMock = vi.fn().mockReturnValue(resolvedChain([]));
    const guardSelect = vi.fn();
    mockFrom.mockReturnValue({
      select: guardSelect.mockImplementation((col?: string) => {
        const chain = resolvedChain(ORDER_ROW);
        chain.maybeSingle = vi.fn().mockResolvedValue({
          data: { biteship_draft_id: null, status: 'requires_attention' },
          error: null,
        });
        return chain;
      }),
      update: updateMock,
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1', 3);

    // Pin the guard's column list: dropping 'status' from the select would
    // silently regress the stale-flag alert (mock ignores columns otherwise).
    expect(guardSelect).toHaveBeenCalledWith('biteship_draft_id, status');
    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ issue: 'BITESHIP GAGAL 3x — perlu tindakan manual' })
    );
  });

  it('stale flag survives the FULL recursion chain: attempt-0 entry flagged, terminal alert at attempt 3', async () => {
    // Kills the wrong-paren mutant `(flaggedAtEntry ?? existing?.status) ===
    // 'requires_attention'`: mid-recursion the boolean pin must beat the
    // (re-read) status string. Entry via attempt 0 (no 3rd arg) with the DB
    // reporting requires_attention; the pin must carry through 0->1->2->3.
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    const updateMock = vi.fn().mockReturnValue(resolvedChain([]));
    mockFrom.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        const chain = resolvedChain(ORDER_ROW);
        chain.maybeSingle = vi.fn().mockResolvedValue({
          data: { biteship_draft_id: null, status: 'requires_attention' },
          error: null,
        });
        return chain;
      }),
      update: updateMock,
    });

    vi.useFakeTimers();
    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    const p = retryBiteshipDraft('order-1');
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(300_000);
    await p;

    expect(mockCreateDraft).toHaveBeenCalledTimes(3);
    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ issue: 'BITESHIP GAGAL 3x — perlu tindakan manual' })
    );
  });

  it('still alerts on exhaustion when the requires_attention write errors (pre-migration-051 CHECK violation)', async () => {
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    const updateMock = vi.fn().mockReturnValue(
      resolvedChain(null, { message: 'new row for relation "ecom_orders" violates check constraint "ecom_orders_status_check"' })
    );
    mockFrom.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        const chain = resolvedChain(ORDER_ROW);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      }),
      update: updateMock,
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1', 3);

    expect(mockOpsAlert).toHaveBeenCalledWith(
      expect.objectContaining({ issue: 'BITESHIP GAGAL 3x — perlu tindakan manual' })
    );
  });

  it('backs off between attempts on the pinned 0/60s/300s schedule', async () => {
    mockCreateDraft.mockRejectedValue(new Error('Biteship error'));
    const updateMock = vi.fn().mockReturnValue(resolvedChain(null));
    mockFrom.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        const chain = resolvedChain(ORDER_ROW);
        chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        return chain;
      }),
      update: updateMock,
    });

    vi.useFakeTimers();
    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    const p = retryBiteshipDraft('order-1');

    await vi.advanceTimersByTimeAsync(0);
    expect(mockCreateDraft).toHaveBeenCalledTimes(1); // attempt 0: no delay

    await vi.advanceTimersByTimeAsync(59_999);
    expect(mockCreateDraft).toHaveBeenCalledTimes(1); // attempt 1 not yet

    await vi.advanceTimersByTimeAsync(1);
    expect(mockCreateDraft).toHaveBeenCalledTimes(2); // attempt 1 at t=60s

    await vi.advanceTimersByTimeAsync(299_999);
    expect(mockCreateDraft).toHaveBeenCalledTimes(2); // attempt 2 not yet

    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(mockCreateDraft).toHaveBeenCalledTimes(3); // attempt 2 at t=360s
  });

  it('sets status to processing on retry success', async () => {
    mockCreateDraft.mockResolvedValue(undefined);
    const updateMock = vi.fn().mockReturnValue(resolvedChain(ORDER_ROW));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue(guardChain()),
      update: updateMock,
    });

    const { retryBiteshipDraft } = await import('@/lib/biteship/retryDraft');
    await retryBiteshipDraft('order-1');

    expect(updateMock).toHaveBeenCalledWith({ status: 'processing' });
  });
});

describe('isRetryableDraftError', () => {
  it('classifies the four enumerated data/config throws as non-retryable', async () => {
    const { isRetryableDraftError } = await import('@/lib/biteship/retryDraft');
    expect(isRetryableDraftError(new Error('[createBiteshipDraft] Order not found: x'))).toBe(false);
    expect(isRetryableDraftError(new Error('[createBiteshipDraft] No order items found for order: x'))).toBe(false);
    expect(isRetryableDraftError(new Error('[createBiteshipDraft] Missing BITESHIP_API_KEY env var'))).toBe(false);
    expect(isRetryableDraftError(new Error('[createBiteshipDraft] Reference ID ref-1 taken but lookup found no matching draft'))).toBe(false);
  });

  it('classifies everything else (Biteship API payload, network) as retryable', async () => {
    const { isRetryableDraftError } = await import('@/lib/biteship/retryDraft');
    expect(isRetryableDraftError(new Error('Biteship down'))).toBe(true);
    expect(
      isRetryableDraftError(
        new Error('[createBiteshipDraft] Biteship draft API error for order x: {"code":40002021,"error":"No courier available"}')
      )
    ).toBe(true);
    expect(
      isRetryableDraftError(new Error('[createBiteshipDraft] Failed to store biteship_draft_id for order x: timeout'))
    ).toBe(true);
    expect(isRetryableDraftError('plain string')).toBe(true);
  });
});
