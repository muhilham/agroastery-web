# Critical Transaction Fixes — Design Spec

**Date:** 2026-04-15
**Scope:** 5 critical pre-release fixes to the transaction business process
**Approach:** Minimal surgical changes, no new infrastructure

---

## Context

An audit of the transaction flow identified 5 critical issues that could cause data corruption, lost orders, or silent failures in production. All 5 are fixed with targeted changes to existing files plus one new DB migration. No new dependencies required.

---

## Fix 1 — Atomic Multi-Item Stock Decrement

### Problem
`app/api/checkout/route.ts` decrements stock one item at a time in a loop. If item 3 of 5 fails (insufficient stock), items 1–2 are already decremented. Stock restoration is best-effort and silent on failure → orphaned reservations.

### Solution
New Postgres function `ecom_decrement_stock_multi(p_items jsonb)` wraps all decrements in a single transaction. If any item has insufficient stock, the entire function rolls back and returns `false`. The checkout route replaces the per-item loop with one `.rpc()` call.

### DB Migration
```sql
CREATE OR REPLACE FUNCTION ecom_decrement_stock_multi(p_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  rows_affected int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE product_variants
    SET stock_quantity = stock_quantity - (item->>'quantity')::int
    WHERE id = (item->>'variant_id')::uuid
      AND stock_quantity >= (item->>'quantity')::int;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    IF rows_affected = 0 THEN
      RAISE EXCEPTION 'insufficient_stock:%', item->>'variant_id';
    END IF;
  END LOOP;
  RETURN true;
END;
$$;
```

### Checkout Route Change
Replace the per-item decrement loop with:
```typescript
const { data: decremented, error: stockError } = await admin.rpc(
  "ecom_decrement_stock_multi",
  { p_items: data.items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })) }
);
if (stockError || !decremented) {
  return NextResponse.json({ error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" }, { status: 409 });
}
```

Stock restoration on later failure remains unchanged (per-item `ecom_restore_stock` calls) — restore doesn't need atomicity.

---

## Fix 2 — Checkout Idempotency

### Problem
No deduplication on the checkout POST. A double-tap or network retry creates two orders and deducts stock twice.

### Solution
Client generates a UUID once when the checkout form mounts (`idempotencyKey`). Server stores it in a new `UNIQUE` column `ecom_orders.idempotency_key`. On duplicate key violation, server returns the existing `orderId` instead of creating a new order.

### DB Migration
```sql
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
```

### Checkout Form Change (`app/(root)/checkout/page.tsx`)
```typescript
const idempotencyKey = useRef(crypto.randomUUID());
// Include in POST body: idempotencyKey: idempotencyKey.current
```

### Checkout Route Change
After validating input, before touching stock:
```typescript
// Check for existing order with same idempotency key
const { data: existing } = await admin
  .from("ecom_orders")
  .select("id, pivot_payment_session_id")
  .eq("idempotency_key", data.idempotencyKey)
  .maybeSingle();

if (existing) {
  return NextResponse.json({ orderId: existing.id, ... }); // Return existing order
}
```

On insert, include `idempotency_key: data.idempotencyKey` in the order row.

---

## Fix 3 — Pivot Session Orphan

### Problem
The order row and items are already created before Pivot is called (correct). The orphan occurs in two scenarios:
1. Pivot API call succeeds but the **final DB update** storing `pivot_payment_session_id` fails → Pivot session floats with no DB record pointing to it.
2. On any failure after Pivot is called, the code tries to delete the order and restore stock — but never cancels the Pivot session → Pivot session is orphaned.

### Solution
Two targeted changes:
- **On final DB update failure** (storing `pivot_payment_session_id`): retry up to 3 times with 200ms delay. The session ID is still in memory from the Pivot response, so retries are safe. If all retries fail, log the session ID prominently for manual ops recovery.
- **On Pivot failure** (the call itself throws): instead of deleting the order, mark it `cancelled` + restore stock. Order stays in DB for audit trail, no dangling Pivot session since Pivot was never reached.

### Checkout Route Change

On Pivot failure:
```typescript
} catch (pivotError) {
  // Keep order in DB for audit — mark cancelled, restore stock
  await admin.from("ecom_orders")
    .update({ status: "cancelled", payment_status: "expired" })
    .eq("id", order.id);
  await restoreStock(admin, data.items);
  return NextResponse.json({ error: "Gagal membuat sesi pembayaran", code: "PIVOT_ERROR" }, { status: 502 });
}
```

On final DB update failure (retry loop):
```typescript
let updateError = null;
for (let attempt = 0; attempt < 3; attempt++) {
  const { error } = await admin.from("ecom_orders")
    .update({ pivot_payment_session_id: session.paymentSessionId, ... })
    .eq("id", order.id);
  if (!error) { updateError = null; break; }
  updateError = error;
  await new Promise(r => setTimeout(r, 200));
}
if (updateError) {
  console.error(`[checkout] CRITICAL: Failed to store pivot session ${session.paymentSessionId} for order ${order.id}`);
  // Order is in DB, Pivot session exists — ops must manually link
}
```

---

## Fix 4 — Duplicate Email on Webhook Retry

### Problem
Concurrent or retried `PAYMENT.PAID` webhooks both pass the idempotency check (race condition on read), both call `sendOrderEmail`, customer gets duplicate emails.

### Solution
Add `email_sent_at TIMESTAMPTZ` to `ecom_orders`. In `sendOrderEmail`, check `if (order.email_sent_at) return` before calling Resend. After successful send, `UPDATE ecom_orders SET email_sent_at = now()`. The concurrent race resolves: whichever write lands second finds the column already set and skips.

### DB Migration
```sql
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
```

### `lib/resend/sendOrderEmail.ts` Change
```typescript
// After fetching order:
if (order.email_sent_at) {
  return; // Already sent — skip
}

// After successful Resend call:
await admin.from("ecom_orders").update({ email_sent_at: new Date().toISOString() }).eq("id", orderId);
```

---

## Fix 5 — Biteship Invisible Failure

### Problem
`createBiteshipOrder` is fire-and-forget in the webhook. If it fails, the order shows `processing` in the DB but no shipment is created. Ops have no visibility — customer paid, package never ships.

### Solution
In the webhook `.catch()` on `createBiteshipOrder`, call the existing `sendPaymentNotification` Telegram helper with an ops-alert message including the order number and error. One addition to the existing catch block.

### Webhook Change (`app/api/webhooks/pivot/route.ts`)
```typescript
createBiteshipOrder(updatedOrder.id as string).catch((err: unknown) => {
  console.error(`[pivot-webhook] Biteship order creation failed for order ${updatedOrder.id}:`, err);
  // Alert ops via Telegram
  sendPaymentNotification({
    orderId: updatedOrder.id as string,
    orderNumber: updatedOrder.order_number as string,
    customerName: updatedOrder.customer_name as string,
    customerPhone: updatedOrder.customer_phone as string,
    paymentMethod: "⚠️ BITESHIP GAGAL — buat order manual",
    total: updatedOrder.total as number,
    paidAt: new Date().toISOString(),
  }).catch(() => {});
});
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/XXX_critical_fixes.sql` | New — `ecom_decrement_stock_multi`, `idempotency_key` column, `email_sent_at` column |
| `app/api/checkout/route.ts` | Replace stock loop with RPC, add idempotency check, reorder Pivot call, retry on update failure |
| `app/(root)/checkout/page.tsx` | Generate and send `idempotencyKey` UUID |
| `lib/resend/sendOrderEmail.ts` | Check `email_sent_at` before sending, update it after |
| `app/api/webhooks/pivot/route.ts` | Add Telegram alert to Biteship failure catch |

---

## Verification

1. **Fix 1:** Create order with 2+ items; manually set one variant's stock to 0 mid-request; confirm neither variant is decremented and checkout returns 409.
2. **Fix 2:** Submit checkout form twice rapidly; confirm only one order row in DB.
3. **Fix 3:** Temporarily break Pivot API (wrong credentials); confirm no orphaned DB state, order is cancelled, stock restored.
4. **Fix 4:** Manually trigger the webhook twice for the same `pivot_payment_session_id`; confirm only one email received.
5. **Fix 5:** Break Biteship call (invalid API key); confirm Telegram message received in ops channel.
