# Biteship Draft Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace immediate live Biteship order creation with draft order creation so staff can review and confirm shipments in the Biteship dashboard before pickup.

**Architecture:** Pivot payment webhook fires `createBiteshipDraft` (replaces `createBiteshipOrder`), which calls `POST /v1/draft_orders` and stores the new `biteship_draft_id`. Staff confirms drafts in the Biteship dashboard. The Biteship status webhook handler is updated to fall back to `reference_id = order_number` lookup and lazily persists the resulting `biteship_order_id`.

**Tech Stack:** Next.js 15 (App Router, Node runtime), TypeScript, Supabase JS, Vitest, Biteship REST API.

**Spec:** `docs/superpowers/specs/2026-04-27-biteship-draft-order-design.md`

**Branch:** `feat/biteship-draft-order`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/biteship/createDraft.ts` | Create | New draft creation logic (replaces `createOrder.ts`) |
| `lib/biteship/createOrder.ts` | Delete | Replaced by `createDraft.ts` |
| `app/api/webhooks/pivot/route.ts` | Modify | Swap import + call to `createBiteshipDraft` |
| `app/api/webhooks/biteship/route.ts` | Modify | Add `reference_id` fallback + lazy `biteship_order_id` persistence |
| `lib/actions/createDraftOrder.ts` | Delete | Orphan, unused |
| `app/api/shipping/draft-order/route.ts` | Delete | Orphan, unused |
| `__tests__/biteship-create-draft.spec.ts` | Create | Replaces `biteship-create-order.spec.ts` |
| `__tests__/biteship-create-order.spec.ts` | Delete | Replaced |
| `__tests__/biteship-webhook.spec.ts` | Modify | Add tests for `reference_id` fallback path |
| `docs/THIRD_PARTY_INTEGRATIONS.md` | Modify | Reflect draft flow in Biteship section |
| `lib/supabase/types.ts` | Regenerate (manual) | Add `biteship_draft_id` field after agr-ops migration lands |

---

## Prerequisite (Outside This Repo)

**Schema migration** must land in the **agr-ops** repo first:

```sql
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS biteship_draft_id TEXT;
```

Apply to production Supabase, then regenerate types here:

```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
```

Verify `lib/supabase/types.ts` now contains `biteship_draft_id` near `biteship_order_id` (3 occurrences in Row, Insert, Update). If types are not yet regenerated when this plan runs, the TypeScript build will fail at `Task 1`. Block on the prereq.

---

## Task 1: Add createBiteshipDraft (TDD)

**Files:**
- Create: `__tests__/biteship-create-draft.spec.ts`
- Create: `lib/biteship/createDraft.ts`

- [ ] **Step 1.1: Write failing tests**

```typescript
// __tests__/biteship-create-draft.spec.ts
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
```

- [ ] **Step 1.2: Run tests, verify they fail**

Run:
```bash
npx vitest run __tests__/biteship-create-draft.spec.ts
```
Expected: FAIL with `Cannot find module '@/lib/biteship/createDraft'`.

- [ ] **Step 1.3: Implement `lib/biteship/createDraft.ts`**

```typescript
// lib/biteship/createDraft.ts
import { createSupabaseAdminClient } from '@/lib/supabase/server';

type BiteshipDraftResponse = {
  success: boolean;
  id?: string;
  code?: number;
  error?: string;
};

type BiteshipDraftLookupResponse = {
  success: boolean;
  drafts?: Array<{ id: string; reference_id?: string }>;
};

export async function createBiteshipDraft(orderId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('ecom_orders')
    .select(
      'id, order_number, customer_name, customer_phone, customer_email, shipping_address, shipping_courier, shipping_service, notes'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`[createBiteshipDraft] Order not found: ${orderId}`);
  }

  if (!order.shipping_courier || !order.shipping_service) {
    console.warn(
      `[createBiteshipDraft] Order ${orderId} has no courier — skipping Biteship draft creation`
    );
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from('ecom_order_items')
    .select('product_name, unit_price, quantity, ship_weight_grams')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) {
    throw new Error(`[createBiteshipDraft] No order items found for order: ${orderId}`);
  }

  const addr = order.shipping_address as {
    recipient_name: string;
    phone: string;
    address_line: string;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  const DEFAULT_ORIGIN_LAT = -6.263450138760574;
  const DEFAULT_ORIGIN_LNG = 106.81945752406575;
  const originLat = Number(process.env.ORIGIN_LATITUDE ?? DEFAULT_ORIGIN_LAT);
  const originLng = Number(process.env.ORIGIN_LONGITUDE ?? DEFAULT_ORIGIN_LNG);
  const originPostal =
    process.env.ORIGIN_POSTAL_CODE ?? process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE;

  const payload: Record<string, unknown> = {
    origin_contact_name: process.env.ORIGIN_CONTACT_NAME,
    origin_contact_phone: process.env.ORIGIN_CONTACT_PHONE,
    origin_address: process.env.ORIGIN_ADDRESS,
    ...(originPostal ? { origin_postal_code: Number(originPostal) } : {}),
    ...(Number.isFinite(originLat) && Number.isFinite(originLng)
      ? { origin_coordinate: { latitude: originLat, longitude: originLng } }
      : {}),

    destination_contact_name: addr.recipient_name,
    destination_contact_phone: addr.phone,
    destination_address: addr.address_line,
    ...(addr.postal_code ? { destination_postal_code: Number(addr.postal_code) } : {}),
    ...(addr.latitude != null && addr.longitude != null
      ? { destination_coordinate: { latitude: addr.latitude, longitude: addr.longitude } }
      : {}),

    courier_company: order.shipping_courier,
    courier_type: order.shipping_service,
    ...(order.notes ? { order_note: order.notes } : {}),
    reference_id: order.order_number,

    items: items.map((item) => ({
      name: item.product_name,
      value: item.unit_price,
      quantity: item.quantity,
      weight: item.ship_weight_grams,
      category: 'food_and_drink',
      height: 10,
      length: 20,
      width: 15,
    })),
  };

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error('[createBiteshipDraft] Missing BITESHIP_API_KEY env var');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const res = await fetch('https://api.biteship.com/v1/draft_orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as BiteshipDraftResponse;

  let draftId: string | undefined = data.success && data.id ? data.id : undefined;

  // Idempotent recovery: reference_id already taken (Pivot retried)
  if (!res.ok && data.code === 42211015) {
    const lookupRes = await fetch(
      `https://api.biteship.com/v1/draft_orders?reference_id=${encodeURIComponent(order.order_number)}`,
      { method: 'GET', headers }
    );
    const lookup = (await lookupRes.json()) as BiteshipDraftLookupResponse;
    const found = lookup.drafts?.find((d) => d.reference_id === order.order_number);
    if (!found?.id) {
      throw new Error(
        `[createBiteshipDraft] Reference ID ${order.order_number} taken but lookup found no matching draft`
      );
    }
    console.warn(
      `[createBiteshipDraft] Idempotent recovery for order ${orderId}: using existing draft ${found.id}`
    );
    draftId = found.id;
  }

  if (!draftId) {
    throw new Error(
      `[createBiteshipDraft] Biteship draft API error for order ${orderId}: ${JSON.stringify(data)}`
    );
  }

  const { error: updateError } = await supabase
    .from('ecom_orders')
    .update({ biteship_draft_id: draftId })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(
      `[createBiteshipDraft] Failed to store biteship_draft_id for order ${orderId}: ${updateError.message}`
    );
  }
}
```

- [ ] **Step 1.4: Run tests, verify they pass**

Run:
```bash
npx vitest run __tests__/biteship-create-draft.spec.ts
```
Expected: PASS (4 tests).

- [ ] **Step 1.5: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors. If `Property 'biteship_draft_id' does not exist`, the agr-ops migration prerequisite was skipped — block until types are regenerated.

- [ ] **Step 1.6: Commit**

```bash
git add lib/biteship/createDraft.ts __tests__/biteship-create-draft.spec.ts
git commit -m "feat(biteship): add createBiteshipDraft for draft order flow"
```

---

## Task 2: Switch Pivot Webhook to Draft Creation

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts:5,~101`

- [ ] **Step 2.1: Update import**

Change line 5 from:
```typescript
import { createBiteshipOrder } from '@/lib/biteship/createOrder';
```
to:
```typescript
import { createBiteshipDraft } from '@/lib/biteship/createDraft';
```

- [ ] **Step 2.2: Update call site**

Find the block (around line 101):
```typescript
      createBiteshipOrder(updatedOrder.id as string).catch((err: unknown) => {
        console.error(
          `[pivot-webhook] Biteship order creation failed for order ${updatedOrder.id}:`,
          err
        );
```

Replace with:
```typescript
      createBiteshipDraft(updatedOrder.id as string).catch((err: unknown) => {
        console.error(
          `[pivot-webhook] Biteship draft creation failed for order ${updatedOrder.id}:`,
          err
        );
```

- [ ] **Step 2.3: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 2.4: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "feat(pivot): call createBiteshipDraft on payment confirmation"
```

---

## Task 3: Biteship Webhook reference_id Fallback (TDD)

**Files:**
- Modify: `__tests__/biteship-webhook.spec.ts`
- Modify: `app/api/webhooks/biteship/route.ts`

- [ ] **Step 3.1: Add failing tests for reference_id fallback**

Append to `__tests__/biteship-webhook.spec.ts` inside the existing `describe` block (use the existing `makeRequest` helper):

```typescript
  it('falls back to reference_id lookup when biteship_order_id miss, then persists order_id', async () => {
    // First update by biteship_order_id returns no row → handler must lookup by order_number
    const noMatch = { data: null, error: null };
    const matched = { data: { id: 'ecom-99' }, error: null };

    const updateByOrderId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(noMatch) }),
      }),
    });
    const updateByRef = vi.fn().mockReturnValue({
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
      if (call === 2) return { update: updateByRef };
      return { update: updateAttachOrderId };
    });

    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(
      makeRequest({
        event: 'order.status',
        order_id: 'bs-new-after-confirm',
        reference_id: 'AGR-20260427-ABC',
        status: 'confirmed',
      })
    );

    expect(res.status).toBe(200);
    expect(updateByOrderId).toHaveBeenCalledWith({ status: 'processing' });
    expect(updateByRef).toHaveBeenCalledWith({ status: 'processing' });
    expect(updateAttachOrderId).toHaveBeenCalledWith({ biteship_order_id: 'bs-new-after-confirm' });
  });

  it('does not call reference_id fallback when biteship_order_id matches', async () => {
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
```

- [ ] **Step 3.2: Run tests, verify new ones fail**

Run:
```bash
npx vitest run __tests__/biteship-webhook.spec.ts
```
Expected: existing tests pass; the two new tests fail.

- [ ] **Step 3.3: Update handler**

Replace the body of `app/api/webhooks/biteship/route.ts` from after `const supabase = createSupabaseAdminClient();` through the end of the `else` block with:

```typescript
  const supabase = createSupabaseAdminClient();

  async function applyUpdate(
    update: Record<string, unknown>,
    label: string
  ): Promise<boolean> {
    const byOrderId = await supabase
      .from('ecom_orders')
      .update(update)
      .eq('biteship_order_id', biteshipOrderId)
      .select('id')
      .single();
    if (byOrderId.data) return true;

    const referenceId = body.reference_id as string | undefined;
    if (!referenceId) {
      console.warn(
        `[biteship-webhook] No order found for biteship_order_id=${biteshipOrderId} and no reference_id fallback (${label})`
      );
      return false;
    }

    const byRef = await supabase
      .from('ecom_orders')
      .update(update)
      .eq('order_number', referenceId)
      .select('id')
      .single();
    if (!byRef.data) {
      console.warn(
        `[biteship-webhook] No order found for biteship_order_id=${biteshipOrderId} or reference_id=${referenceId} (${label})`
      );
      return false;
    }

    // Lazily persist biteship_order_id so future webhooks match by it directly.
    await supabase
      .from('ecom_orders')
      .update({ biteship_order_id: biteshipOrderId })
      .eq('id', byRef.data.id);
    return true;
  }

  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;
    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
    if (ecomStatus) {
      await applyUpdate({ status: ecomStatus }, `order.status=${rawStatus}`);
    } else {
      console.log(`[biteship-webhook] Unrecognised Biteship status "${rawStatus}" — no DB update`);
    }
  } else if (event === 'order.waybill_id') {
    const waybillId = body.courier_waybill_id as string | undefined;
    if (waybillId) {
      await applyUpdate({ tracking_number: waybillId }, 'order.waybill_id');
    }
  } else {
    console.log(`[biteship-webhook] Unhandled event "${event}" for Biteship order ${biteshipOrderId}`);
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 3.4: Run all webhook tests, verify they pass**

Run:
```bash
npx vitest run __tests__/biteship-webhook.spec.ts
```
Expected: PASS (all existing + 2 new tests).

- [ ] **Step 3.5: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3.6: Commit**

```bash
git add app/api/webhooks/biteship/route.ts __tests__/biteship-webhook.spec.ts
git commit -m "feat(biteship): reference_id fallback in webhook + lazy order_id persistence"
```

---

## Task 4: Delete Replaced Files

**Files:**
- Delete: `lib/biteship/createOrder.ts`
- Delete: `__tests__/biteship-create-order.spec.ts`
- Delete: `lib/actions/createDraftOrder.ts`
- Delete: `app/api/shipping/draft-order/route.ts`

- [ ] **Step 4.1: Verify no remaining importers**

Run:
```bash
grep -rn "from '@/lib/biteship/createOrder'" app lib __tests__ || true
grep -rn "from '@/lib/actions/createDraftOrder'" app lib __tests__ || true
grep -rn "/api/shipping/draft-order" app lib __tests__ || true
```
Expected: no results (Task 2 already swapped Pivot's import; the other two are orphans).

- [ ] **Step 4.2: Delete files**

```bash
git rm lib/biteship/createOrder.ts
git rm __tests__/biteship-create-order.spec.ts
git rm lib/actions/createDraftOrder.ts
git rm app/api/shipping/draft-order/route.ts
```

- [ ] **Step 4.3: Run full test suite + type-check**

Run:
```bash
npx tsc --noEmit && npx vitest run
```
Expected: all pass. If a stray import surfaces, fix it before committing.

- [ ] **Step 4.4: Commit**

```bash
git commit -m "chore(biteship): remove legacy createOrder + orphan draft-order action/route"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `docs/THIRD_PARTY_INTEGRATIONS.md` (Biteship section, ~line 221)

- [ ] **Step 5.1: Update endpoint list**

Find:
```markdown
- **Endpoints:**
  - `POST /rates/couriers` - Get shipping rates
  - `POST /orders` - Create shipping order
  - `POST /v1/draft_orders` - Create draft order
```

Replace with:
```markdown
- **Endpoints:**
  - `POST /v1/rates/couriers` - Get shipping rates
  - `POST /v1/draft_orders` - Create draft order (called after payment)
  - `GET /v1/draft_orders?reference_id=…` - Idempotent recovery lookup
```

- [ ] **Step 5.2: Update integration points table**

Find:
```markdown
| `lib/biteship/createOrder.ts` | Creates Biteship orders after payment |
| `app/api/shipping/rates/route.ts` | Proxies rate requests to Biteship |
| `app/api/shipping/draft-order/route.ts` | Creates draft orders |
| `app/api/webhooks/biteship/route.ts` | Webhook handler for order updates |
```

Replace with:
```markdown
| `lib/biteship/createDraft.ts` | Creates Biteship draft orders after payment |
| `app/api/shipping/rates/route.ts` | Proxies rate requests to Biteship |
| `app/api/webhooks/biteship/route.ts` | Webhook handler; falls back to reference_id after staff confirms a draft |
```

- [ ] **Step 5.3: Update shipping flow numbered list**

Find:
```markdown
**Shipping Flow:**
1. Customer enters address at checkout
2. `calculateShipping()` fetches rates from Biteship API
3. Customer selects courier and service
4. After payment confirmed, `createBiteshipOrder()` creates order
5. Biteship assigns courier and generates waybill
6. Webhook updates order status and tracking number
```

Replace with:
```markdown
**Shipping Flow:**
1. Customer enters address at checkout
2. `calculateShipping()` fetches rates from Biteship API
3. Customer selects courier and service
4. After payment confirmed, `createBiteshipDraft()` creates a draft order in Biteship
5. **Staff reviews and confirms the draft in the Biteship dashboard**
6. Biteship creates the live Order with the same `reference_id` and dispatches pickup
7. Webhook fires; handler matches by `biteship_order_id`, falling back to `reference_id` and persisting the new `biteship_order_id`
```

- [ ] **Step 5.4: Commit**

```bash
git add docs/THIRD_PARTY_INTEGRATIONS.md
git commit -m "docs(biteship): document draft-order flow with staff dashboard confirm"
```

---

## Task 6: Final Verification

- [ ] **Step 6.1: Full type-check + test suite**

Run:
```bash
npx tsc --noEmit && npx vitest run
```
Expected: PASS, no type errors.

- [ ] **Step 6.2: Build check**

Run:
```bash
npx next build
```
Expected: build succeeds.

- [ ] **Step 6.3: Manual smoke test (staging)**

Document in PR description, do not run from this plan:
- Trigger a Pivot test webhook → verify `ecom_orders.biteship_draft_id` populated, `biteship_order_id` null, `status='paid'`.
- Manually confirm the draft in Biteship dashboard.
- Verify Biteship `order.status=confirmed` webhook → `ecom_orders.biteship_order_id` populated, `status='processing'`.
- Verify subsequent `order.waybill_id` webhook → `tracking_number` populated.

- [ ] **Step 6.4: Open PR**

Title: `feat(biteship): replace live order with draft order + staff confirm flow`

Body checklist:
- [ ] agr-ops migration for `biteship_draft_id` merged + applied
- [ ] `lib/supabase/types.ts` regenerated
- [ ] All tests pass
- [ ] Manual staging smoke test passed

---

## Self-Review Notes

- Spec coverage: schema (prereq), `createDraft.ts` rename (Task 1), Pivot caller swap (Task 2), webhook fallback + persist (Task 3), orphan deletion (Task 4), docs update (Task 5). All spec items mapped.
- Idempotent recovery uses `GET /v1/draft_orders?reference_id=…` (a documented lookup path; if the actual API uses `?reference_ids=…` or returns a single object, adjust the parser shape — keep the test/impl synced).
- `biteship_draft_id` column requires the agr-ops migration first; types regenerated before Task 1 type-check.
