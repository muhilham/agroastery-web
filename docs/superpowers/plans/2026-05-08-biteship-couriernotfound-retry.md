# Biteship courierNotFound Auto-Retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic Biteship draft retry on `courier_not_found`, with history table for late webhook matching and Telegram notifications at each stage.

**Architecture:** Fire-and-forget retry from webhook handler; suffixed `reference_id` per attempt; separate `ecom_order_biteship_history` table for archiving dead order IDs; history fallback in webhook lookup skips status updates.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (PostgreSQL), Vitest + jsdom, Biteship REST API v1

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/biteship/createDraft.ts` | **Modify** | Accept optional `overrideReferenceId`; update idempotent recovery lookup URL |
| `lib/biteship/retryDraft.ts` | **Create** | Retry logic: build unique `reference_id`, call `createBiteshipDraft`, recursive retry, Telegram alerts, status reset on success |
| `app/api/webhooks/biteship/route.ts` | **Modify** | Detect `courier_not_found`: archive to history, clear Biteship IDs, notify Telegram, fire-and-forget retry; add history fallback to `applyUpdate` with empty-update guard |
| `__tests__/biteship-create-draft.spec.ts` | **Modify** | Add test: `overrideReferenceId` used in payload and recovery lookup |
| `__tests__/biteship-retry.spec.ts` | **Create** | Unit tests for `retryBiteshipDraft`: success path, recursive failure, max retries alert, status update |
| `__tests__/biteship-webhook.spec.ts` | **Modify** | Add tests: `courier_not_found` archives and clears, history fallback matches without status |

---

## Pre-requisites

- [ ] **Migration applied in agr-ops:** `ecom_order_biteship_history` table exists in Supabase
- [ ] **Supabase types regenerated:** Run `pnpm generate-types` or equivalent to pick up the new table

---

## Task 1: Modify `createBiteshipDraft` to accept `overrideReferenceId`

**Files:**
- Modify: `lib/biteship/createDraft.ts`
- Test: `__tests__/biteship-create-draft.spec.ts`

### Step 1: Write the failing test

Add to `__tests__/biteship-create-draft.spec.ts` after the last existing test:

```typescript
  it('uses overrideReferenceId in payload and recovery lookup', async () => {
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
          drafts: [{ id: 'bs-draft-override', reference_id: 'order-1--retry-0' }],
        }),
      });

    await createBiteshipDraft('order-1', 'order-1--retry-0');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [lookupUrl] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(lookupUrl).toContain('/v1/draft_orders?reference_id=order-1--retry-0');
  });
```

### Step 2: Run test to verify it fails

```bash
npx vitest run __tests__/biteship-create-draft.spec.ts --reporter=verbose
```

Expected: FAIL — `createBiteshipDraft` does not accept a second parameter.

### Step 3: Implement minimal change

In `lib/biteship/createDraft.ts`, change the function signature and payload:

```typescript
// Before
export async function createBiteshipDraft(orderId: string): Promise<void> {

// After
export async function createBiteshipDraft(
  orderId: string,
  overrideReferenceId?: string
): Promise<void> {
```

Change the payload `reference_id` line:

```typescript
// Before
    reference_id: orderId,

// After
    reference_id: overrideReferenceId ?? orderId,
```

Change the idempotent recovery lookup URL (around line 118):

```typescript
// Before
      `https://api.biteship.com/v1/draft_orders?reference_id=${encodeURIComponent(orderId)}`,

// After
      `https://api.biteship.com/v1/draft_orders?reference_id=${encodeURIComponent(overrideReferenceId ?? orderId)}`,
```

Also update the `find` filter that validates the lookup result (around line 123):

```typescript
// Before
      const found = lookup.drafts?.find((d) => d.reference_id === orderId);

// After
      const found = lookup.drafts?.find((d) => d.reference_id === (overrideReferenceId ?? orderId));
```

### Step 4: Run test to verify it passes

```bash
npx vitest run __tests__/biteship-create-draft.spec.ts --reporter=verbose
```

Expected: all tests pass.

### Step 5: Commit

```bash
git add lib/biteship/createDraft.ts __tests__/biteship-create-draft.spec.ts
git commit -m "feat(biteship): accept overrideReferenceId in createDraft"
```

---

## Task 2: Create `retryBiteshipDraft` module

**Files:**
- Create: `lib/biteship/retryDraft.ts`
- Test: `__tests__/biteship-retry.spec.ts`

### Step 1: Write the failing test

Create `__tests__/biteship-retry.spec.ts`:

```typescript
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
    expect(refId).toMatch(/^order-1--retry-\d+-\d+-0$/);
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
```

### Step 2: Run test to verify it fails

```bash
npx vitest run __tests__/biteship-retry.spec.ts --reporter=verbose
```

Expected: FAIL — `lib/biteship/retryDraft.ts` does not exist.

### Step 3: Implement the module

Create `lib/biteship/retryDraft.ts`:

```typescript
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createBiteshipDraft } from './createDraft';
import { sendPaymentNotification } from '@/lib/telegram/notify';

const MAX_RETRIES = 3;

export async function retryBiteshipDraft(
  orderId: string,
  attemptNumber?: number
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const attempt = attemptNumber ?? 0;

  if (attempt >= MAX_RETRIES) {
    const { data: order } = await supabase
      .from('ecom_orders')
      .select('order_number, customer_name, customer_phone, total')
      .eq('id', orderId)
      .single();

    // HACK: using paymentMethod field to carry ops alert text
    await sendPaymentNotification({
      orderId,
      orderNumber: order?.order_number ?? 'UNKNOWN',
      customerName: order?.customer_name ?? 'UNKNOWN',
      customerPhone: order?.customer_phone ?? 'UNKNOWN',
      paymentMethod: '⚠️ BITESHIP GAGAL 3x — perlu tindakan manual',
      total: order?.total ?? 0,
      paidAt: new Date().toISOString(),
    }).catch(() => {});

    console.error(`[retryBiteshipDraft] Max retries (${MAX_RETRIES}) reached for order ${orderId}`);
    return;
  }

  const referenceId = `${orderId}--retry-${Date.now()}-${attempt}`;

  try {
    await createBiteshipDraft(orderId, referenceId);
    console.log(`[retryBiteshipDraft] Retry ${attempt + 1} succeeded for order ${orderId} with ref ${referenceId}`);

    const { data: order } = await supabase
      .from('ecom_orders')
      .update({ status: 'processing' })
      .eq('id', orderId)
      .select('order_number, customer_name, customer_phone, total')
      .single();

    // HACK: using paymentMethod field to carry ops alert text
    await sendPaymentNotification({
      orderId,
      orderNumber: order?.order_number ?? 'UNKNOWN',
      customerName: order?.customer_name ?? 'UNKNOWN',
      customerPhone: order?.customer_phone ?? 'UNKNOWN',
      paymentMethod: '✅ BITESHIP DRAFT BERHASIL DIBUAT ULANG',
      total: order?.total ?? 0,
      paidAt: new Date().toISOString(),
    }).catch(() => {});
  } catch (err) {
    console.error(`[retryBiteshipDraft] Retry ${attempt + 1} failed for order ${orderId}:`, err);
    await retryBiteshipDraft(orderId, attempt + 1);
  }
}
```

### Step 4: Run test to verify it passes

```bash
npx vitest run __tests__/biteship-retry.spec.ts --reporter=verbose
```

Expected: all tests pass.

### Step 5: Commit

```bash
git add lib/biteship/retryDraft.ts __tests__/biteship-retry.spec.ts
git commit -m "feat(biteship): add retryDraft with Telegram alerts"
```

---

## Task 3: Modify Biteship webhook handler

**Files:**
- Modify: `app/api/webhooks/biteship/route.ts`
- Test: `__tests__/biteship-webhook.spec.ts`

### Step 1: Write the failing tests

Add to `__tests__/biteship-webhook.spec.ts` before the closing `});` of the describe block:

```typescript
  it('handles courier_not_found: archives, clears IDs, and triggers retry', async () => {
    const matched = { data: { id: 'ecom-99', order_number: 'AGR-001', customer_name: 'Budi', customer_phone: '08111', total: 100000, biteship_draft_id: 'bs-draft-old' }, error: null };
    const updateClear = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const insertHistory = vi.fn().mockResolvedValue({ data: null, error: null });

    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(matched),
          }),
        }),
      };
      if (call === 2) return { insert: insertHistory };
      if (call === 3) return { update: updateClear };
      return { update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) };
    });

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.status',
        order_id: 'bs-123',
        status: 'courier_not_found',
      })
    );

    expect(res.status).toBe(200);
    expect(insertHistory).toHaveBeenCalledWith({
      order_id: 'ecom-99',
      biteship_order_id: 'bs-123',
      biteship_draft_id: 'bs-draft-old',
      biteship_status: 'courier_not_found',
    });
    expect(updateClear).toHaveBeenCalledWith({
      biteship_order_id: null,
      biteship_draft_id: null,
      tracking_number: null,
      courier_tracking_id: null,
      status: 'cancelled',
    });
  });

  it('history fallback skips status updates from dead orders', async () => {
    process.env.BITESHIP_API_KEY = 'test-key';

    const noMatch = { data: null, error: null };
    const historyMatch = { data: { order_id: 'ecom-99' }, error: null };

    const updateByOrderId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(noMatch) }),
      }),
    });

    const slowPathMiss = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const historyUpdateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'ecom-99' }, error: null }),
        }),
      }),
    });

    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) return { update: updateByOrderId };           // fast path: miss
      if (call === 2) return { update: slowPathMiss };              // slow path byDraftId: miss
      if (call === 3) return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(historyMatch),   // history select: hit
          }),
        }),
      };
      return { update: historyUpdateMock };                          // history update
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ draft_order_id: 'bs-draft-old' }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.status',
        order_id: 'bs-dead-order',
        status: 'cancelled',
        courier_tracking_id: 'track-dead',
      })
    );

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('ecom_order_biteship_history');
    // Verify safeUpdate stripped status from the update payload
    expect(historyUpdateMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() })
    );
  });
```

### Step 2: Run test to verify it fails

```bash
npx vitest run __tests__/biteship-webhook.spec.ts --reporter=verbose
```

Expected: FAIL — `retryBiteshipDraft` is not imported; history fallback doesn't exist.

### Step 3: Implement webhook handler changes

In `app/api/webhooks/biteship/route.ts`:

**A. Add import at the top:**

```typescript
import { retryBiteshipDraft } from '@/lib/biteship/retryDraft';
import { sendPaymentNotification } from '@/lib/telegram/notify';
```

**B. Add `courier_not_found` detection inside the `order.status` handler (before the normal status map):**

Find this section in the file (around line 137):

```typescript
  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;
    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
```

Replace with:

```typescript
  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;

    // Handle courier_not_found: archive, clear, notify, retry
    if (rawStatus === 'courier_not_found') {
      const { data: orderRow } = await supabase
        .from('ecom_orders')
        .select('id, order_number, customer_name, customer_phone, total, biteship_order_id, biteship_draft_id')
        .eq('biteship_order_id', bsOrderId)
        .maybeSingle();

      if (orderRow) {
        await supabase.from('ecom_order_biteship_history').insert({
          order_id: orderRow.id,
          biteship_order_id: bsOrderId,
          biteship_draft_id: orderRow.biteship_draft_id,
          biteship_status: 'courier_not_found',
        });

        await supabase
          .from('ecom_orders')
          .update({
            biteship_order_id: null,
            biteship_draft_id: null,
            tracking_number: null,
            courier_tracking_id: null,
            status: 'cancelled',
          })
          .eq('id', orderRow.id);

        // HACK: using paymentMethod field to carry ops alert text
        sendPaymentNotification({
          orderId: orderRow.id,
          orderNumber: orderRow.order_number,
          customerName: orderRow.customer_name,
          customerPhone: orderRow.customer_phone,
          paymentMethod: '⚠️ BITESHIP COURIER NOT FOUND — mencoba ulang',
          total: orderRow.total,
          paidAt: new Date().toISOString(),
        }).catch(() => {});

        retryBiteshipDraft(orderRow.id).catch((err) =>
          console.error(`[biteship-webhook] Retry failed for order ${orderRow.id}:`, err)
        );
      }

      return NextResponse.json({ received: true });
    }

    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
```

**C. Restructure slow path tail + add history fallback to `applyUpdate`:**

The current slow path has an early `return false` that blocks the history fallback. First, restructure the slow path tail from:

```typescript
    if (!byDraftId.data) {
      console.warn(
        `[biteship-webhook] No order found for biteship_draft_id=${draftOrderId} (biteship order_id=${bsOrderId}) (${label})`
      );
      return false;
    }

    // Persist biteship_order_id so future webhooks skip the Biteship API fetch
    await supabase
      .from('ecom_orders')
      .update({ biteship_order_id: bsOrderId })
      .eq('id', byDraftId.data.id);

    return true;
```

To:

```typescript
    if (byDraftId.data) {
      // Persist biteship_order_id so future webhooks skip the Biteship API fetch
      await supabase
        .from('ecom_orders')
        .update({ biteship_order_id: bsOrderId })
        .eq('id', byDraftId.data.id);

      return true;
    }

    console.warn(
      `[biteship-webhook] No order found for biteship_draft_id=${draftOrderId} (biteship order_id=${bsOrderId}) (${label})`
    );
```

Then add the history fallback block after the slow path (before the final `return false;`):

```typescript
  // History fallback: match dead Biteship orders
  const byHistory = await supabase
    .from('ecom_order_biteship_history')
    .select('order_id')
    .eq('biteship_order_id', bsOrderId)
    .maybeSingle();

  if (byHistory.data) {
    const safeUpdate = { ...update };
    delete safeUpdate.status;

    if (Object.keys(safeUpdate).length === 0) {
      console.log(`[biteship-webhook] History match ${byHistory.data.order_id} — nothing to update (status-only event skipped)`);
      return true;
    }

    const historyUpdate = await supabase
      .from('ecom_orders')
      .update(safeUpdate)
      .eq('id', byHistory.data.order_id)
      .select('id')
      .single();
    if (historyUpdate.data) {
      console.log(`[biteship-webhook] Matched via history for order ${byHistory.data.order_id} (status skipped)`);
      return true;
    }
  }
```

### Step 4: Run tests to verify

```bash
npx vitest run __tests__/biteship-webhook.spec.ts --reporter=verbose
```

Expected: all tests pass.

### Step 5: Commit

```bash
git add app/api/webhooks/biteship/route.ts __tests__/biteship-webhook.spec.ts
git commit -m "feat(webhook): handle courier_not_found with retry + history fallback"
```

---

## Task 4: Full test suite verification

### Step 1: Run all tests

```bash
pnpm test
```

Expected: all tests pass (or pre-existing failures only).

### Step 2: Run lint

```bash
pnpm lint
```

Expected: no errors in modified files.

### Step 3: Verify clean

If tests and lint pass, no commit needed — this is a verification step only.

---

## Self-Review Checklist

**Spec coverage:**
- [x] `overrideReferenceId` in `createBiteshipDraft` — Task 1
- [x] Idempotent recovery uses overrideReferenceId — Task 1
- [x] `retryBiteshipDraft` with recursive retry and Telegram alerts — Task 2
- [x] `courier_not_found` detection in webhook — Task 3
- [x] History table insert on `courier_not_found` — Task 3
- [x] Clear Biteship IDs on `courier_not_found` — Task 3
- [x] Telegram notification on initial failure — Task 3
- [x] Telegram notification on retry success — Task 2
- [x] Telegram notification on max retries — Task 2
- [x] History fallback with safeUpdate (status stripped) — Task 3
- [x] Empty safeUpdate guard — Task 3
- [x] Status set to `'processing'` on retry success — Task 2
- [x] `reference_id` with Date.now() suffix — Task 2

**Placeholder scan:** None found. All steps contain exact file paths, code, and commands.

**Type consistency:** `retryBiteshipDraft` signature matches spec; `createBiteshipDraft` optional param matches spec; webhook handler uses `maybeSingle()` consistently with existing code.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-biteship-couriernotfound-retry.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
