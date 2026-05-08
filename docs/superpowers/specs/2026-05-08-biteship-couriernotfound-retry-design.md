# Biteship `courierNotFound` Auto-Retry

**Date:** 2026-05-08  
**Status:** Approved  
**Branch:** TBD

---

## Problem

When Biteship reports `courierNotFound`, the order is silently marked `cancelled` with no stock restore, no refund, no alert, and no way to retry shipment. The customer has paid but receives nothing.

Current behavior in `app/api/webhooks/biteship/route.ts`:
```typescript
courier_not_found: 'cancelled', // mapped in BITESHIP_STATUS_MAP
```

This only updates `ecom_orders.status`. It does not:
- Clear old Biteship IDs (`biteship_order_id`, `biteship_draft_id`, `tracking_number`)
- Attempt to create a new Biteship draft
- Notify operations staff
- Handle late webhooks from the dead Biteship order

---

## Goals

1. Automatically retry Biteship draft creation up to **3 times** with the **same courier**
2. Preserve old Biteship order IDs so late webhooks don't get lost
3. Alert ops via **Telegram** after 3 failed retries
4. Keep webhook response fast (fire-and-forget)
5. No breaking changes to existing `ecom_orders` schema

---

## Constraints

- `reference_id` must be unique per Biteship draft (Biteship API constraint)
- Webhook payload does **not** include `reference_id` — only `order_id`
- Webhook handler must return `200` quickly to avoid Biteship retries
- `ecom_orders.status` CHECK constraint is fixed: `('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`
  - `courier_not_found` sets status to `'cancelled'` (existing BITESHIP_STATUS_MAP behavior)
  - Successful retry sets status back to `'processing'` immediately

---

## Architecture

### New Table

Migration lives in **agr-ops repo only** (shared Supabase instance):

```sql
CREATE TABLE IF NOT EXISTS ecom_order_biteship_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES ecom_orders(id) ON DELETE CASCADE,
  biteship_order_id TEXT NOT NULL,
  biteship_draft_id TEXT,
  biteship_status TEXT,           -- e.g. 'courier_not_found', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_biteship_history_order_id ON ecom_order_biteship_history(order_id);
CREATE INDEX idx_biteship_history_biteship_order_id ON ecom_order_biteship_history(biteship_order_id);
```

After migration ships in agr-ops, regenerate Supabase types in this repo.

---

## Full Flow

```
1. Biteship webhook fires: event="order.status", status="courier_not_found"
   │
2. Webhook handler detects courier_not_found
   ├─ Archive old (biteship_order_id, biteship_draft_id) into history table
   ├─ Clear biteship_order_id, biteship_draft_id, tracking_number, courier_tracking_id
   ├─ Keep status = 'cancelled' (from BITESHIP_STATUS_MAP)
   ├─ Send Telegram alert: "⚠️ BITESHIP COURIER NOT FOUND — mencoba ulang"
   └─ Fire-and-forget: retryBiteshipDraft(orderId)
       │
       │ 3. retryBiteshipDraft(orderId, attempt=0):
       │    ├─ reference_id = `${orderId}--retry-${Date.now()}-${attempt}`
       │    ├─ Call POST /v1/draft_orders with same courier
       │    ├─ On success: store new biteship_draft_id, set status='processing', send Telegram alert: "✅ BITESHIP DRAFT BERHASIL DIBUAT ULANG"
       │    └─ On failure:
       │         ├─ attempt < 2: call retryBiteshipDraft(orderId, attempt+1)
       │         └─ attempt >= 2: send Telegram alert: "⚠️ BITESHIP GAGAL 3x — perlu tindakan manual"
       │
4. Webhook returns 200 to Biteship immediately (step 2 is fire-and-forget)
```

**Key insight:** We keep the status as `'cancelled'` from the webhook status map, but we clear the Biteship IDs so a new draft can be created. On retry success, `retryBiteshipDraft` immediately sets status back to `'processing'` so the order doesn't appear cancelled to customers/staff while waiting for Biteship webhooks.

---

## Late Webhook Handling

Old Biteship order sends a late `order.status` webhook:

1. Fast path: `WHERE biteship_order_id = body.order_id` → miss (cleared)
2. Slow path: fetch from Biteship API → gets old `draft_order_id`
   `WHERE biteship_draft_id = draftOrderId` → miss (updated to new draft)
3. **History fallback:** `SELECT order_id FROM ecom_order_biteship_history WHERE biteship_order_id = ?`
4. Update `ecom_orders` for that `order_id`

This prevents webhook events from the dead order from being lost.

---

## Code Changes

### 1. `app/api/webhooks/biteship/route.ts`

**A. Detect `courier_not_found` before applying status map:**

```typescript
if (event === 'order.status') {
  const rawStatus = body.status as string | undefined;
  
  // BEFORE status map: handle courier_not_found
  if (rawStatus === 'courier_not_found') {
    const { data: orderRow } = await supabase
      .from('ecom_orders')
      .select('id, order_number, customer_name, customer_phone, total, biteship_order_id, biteship_draft_id')
      .eq('biteship_order_id', bsOrderId)
      .maybeSingle();
    
    if (orderRow) {
      // Archive old IDs
      await supabase.from('ecom_order_biteship_history').insert({
        order_id: orderRow.id,
        biteship_order_id: bsOrderId,
        biteship_draft_id: orderRow.biteship_draft_id,
        biteship_status: 'courier_not_found',
      });
      
      // Clear Biteship IDs so new draft can be created
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
      
      // Notify Telegram about courier not found
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
      
      // Fire-and-forget retry
      retryBiteshipDraft(orderRow.id).catch((err) =>
        console.error(`[biteship-webhook] Retry failed for order ${orderRow.id}:`, err)
      );
    }
    
    return NextResponse.json({ received: true });
  }
  
  // Normal status map for non-courier_not_found events
  const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
  // ... rest of existing logic
}
```

**B. Add history fallback to `applyUpdate`:**

```typescript
async function applyUpdate(update: Record<string, unknown>, label: string): Promise<boolean> {
  // Fast path: biteship_order_id
  const byOrderId = await supabase
    .from('ecom_orders')
    .update(update)
    .eq('biteship_order_id', bsOrderId)
    .select('id')
    .single();
  if (byOrderId.data) return true;

  // Slow path: draft_order_id via Biteship API
  const apiKey = process.env.BITESHIP_API_KEY;
  if (apiKey) {
    try {
      const biteshipRes = await fetch(`https://api.biteship.com/v1/orders/${bsOrderId}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      });
      if (biteshipRes.ok) {
        const biteshipOrder = await biteshipRes.json() as Record<string, unknown>;
        const draftOrderId = biteshipOrder.draft_order_id as string | undefined;
        if (draftOrderId) {
          const byDraftId = await supabase
            .from('ecom_orders')
            .update(update)
            .eq('biteship_draft_id', draftOrderId)
            .select('id')
            .single();
          if (byDraftId.data) {
            // Persist biteship_order_id for future webhooks
            await supabase
              .from('ecom_orders')
              .update({ biteship_order_id: bsOrderId })
              .eq('id', byDraftId.data.id);
            return true;
          }
        }
      }
    } catch (err) {
      console.warn(`[biteship-webhook] Failed to fetch order ${bsOrderId} (${label}):`, err);
    }
  }

  // History fallback: match dead Biteship orders
  const byHistory = await supabase
    .from('ecom_order_biteship_history')
    .select('order_id')
    .eq('biteship_order_id', bsOrderId)
    .maybeSingle();

  if (byHistory.data) {
    // Never apply status updates from dead orders — they could override a live retried order
    const safeUpdate = { ...update };
    delete safeUpdate.status;
    
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

  console.warn(`[biteship-webhook] No order found for Biteship order ${bsOrderId} (${label})`);
  return false;
}
```

---

### 2. `lib/biteship/retryDraft.ts` (new)

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
    // Fetch order details for alert
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
    
    // Set status back to processing so order doesn't appear cancelled
    await supabase
      .from('ecom_orders')
      .update({ status: 'processing' })
      .eq('id', orderId);
    
    // Notify Telegram about successful retry
    // HACK: using paymentMethod field to carry ops alert text
    const { data: order } = await supabase
      .from('ecom_orders')
      .select('order_number, customer_name, customer_phone, total')
      .eq('id', orderId)
      .single();
    
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
    
    // Recursive retry with incremented attempt number
    await retryBiteshipDraft(orderId, attempt + 1);
  }
}
```

---

### 3. `lib/biteship/createDraft.ts` (modify)

Add optional `overrideReferenceId` parameter:

```typescript
export async function createBiteshipDraft(
  orderId: string,
  overrideReferenceId?: string
): Promise<void> {
  // ... existing setup ...

  const payload: Record<string, unknown> = {
    // ... existing fields ...
    reference_id: overrideReferenceId ?? orderId,
    // ... rest of payload ...
  };

  // ... rest of existing function ...
}
```

**Also update the idempotent recovery block** (error `42211015` — reference_id already taken):

```typescript
// Before
`/v1/draft_orders?reference_id=${encodeURIComponent(orderId)}`

// After
`/v1/draft_orders?reference_id=${encodeURIComponent(overrideReferenceId ?? orderId)}`
```

This ensures the recovery lookup uses the correct `reference_id` when an override is provided.

---

## Status Mapping

Unchanged from existing `BITESHIP_STATUS_MAP`:

| Biteship status | `ecom_orders.status` |
|---|---|
| `confirmed`, `scheduled`, `allocated`, `picking_up`, `on_hold` | `processing` |
| `picked`, `dropping_off` | `shipped` |
| `delivered` | `delivered` |
| `cancelled`, `rejected`, `courier_not_found`, `disposed` | `cancelled` |
| `returned`, `return_in_transit` | `refunded` |

**Note:** `courier_not_found` triggers the special retry flow above *before* the normal status map is applied.

---

## Tests

| Test | File | Coverage |
|---|---|---|
| `courier_not_found` archives old IDs and clears columns | `__tests__/biteship-webhook.spec.ts` | Webhook detects status, inserts history, clears Biteship IDs, fires retry |
| `retryBiteshipDraft` creates draft with suffixed `reference_id` | `__tests__/biteship-retry.spec.ts` | Builds `orderId--retry-N` per attempt, calls Biteship API |
| Max retries sends Telegram alert | `__tests__/biteship-retry.spec.ts` | After 3 failures, sends alert |
| Late webhook matches via history table | `__tests__/biteship-webhook.spec.ts` | Old `order_id` hits history fallback, updates correct order |
| `createBiteshipDraft` accepts override `reference_id` | `__tests__/biteship-create-draft.spec.ts` | Optional param overrides default `orderId` |
| Retry success clears old history count | `__tests__/biteship-retry.spec.ts` | New draft created, no alert sent |

---

## New / Changed Files

| File | Action |
|---|---|
| `lib/biteship/retryDraft.ts` | **New** — Retry logic with counter + alerting |
| `app/api/webhooks/biteship/route.ts` | **Modify** — Add `courier_not_found` detection, history fallback |
| `lib/biteship/createDraft.ts` | **Modify** — Accept optional `overrideReferenceId` |
| `__tests__/biteship-retry.spec.ts` | **New** — Unit tests for retry logic |
| `__tests__/biteship-webhook.spec.ts` | **Modify** — Add history fallback + courier_not_found tests |
| `__tests__/biteship-create-draft.spec.ts` | **Modify** — Add override reference_id test |
| `agr-ops` migration | **New** — `ecom_order_biteship_history` table |

---

## Rollout

1. Land migration in **agr-ops**: create `ecom_order_biteship_history` table
2. Apply migration to production Supabase
3. Regenerate Supabase types in this repo
4. Merge + deploy this repo code changes
5. Monitor Telegram alerts for `courier_not_found` events

---

## Out of Scope

- Stock restore on max retries (same as today — no automatic restore)
- Automatic refund via Pivot on max retries
- Different courier fallback strategy
- Delayed/cron-based retries
- Admin UI for manual retry
- Biteship draft cancellation (deleting old drafts in Biteship dashboard)
