# Critical Transaction Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 critical pre-release transaction bugs: atomic multi-item stock decrement, checkout idempotency, Pivot session orphan, duplicate email guard, and Biteship failure alerting.

**Architecture:** All fixes are surgical changes to existing files plus one new DB migration (`006_critical_fixes.sql`). Fix 1 replaces a per-item stock loop with a single atomic DB function. Fix 2 adds a UUID idempotency key to the checkout form and API. Fix 3 changes Pivot failure handling from delete-order to mark-cancelled plus adds a retry loop for the session ID storage. Fix 4 guards `sendOrderEmail` with an `email_sent_at` column check. Fix 5 adds a Telegram ops alert to the Biteship failure `.catch()`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + RPC), Vitest

---

## File Map

| File | Change |
|------|--------|
| `supabase/migrations/006_critical_fixes.sql` | Create — `ecom_decrement_stock_multi` RPC, `idempotency_key` column, `email_sent_at` column |
| `app/api/checkout/route.ts` | Modify — Fix 1 (atomic RPC), Fix 2 (idempotency check + insert), Fix 3 (Pivot failure handling + retry) |
| `app/(root)/checkout/checkoutSchemas.ts` | Modify — add `idempotencyKey` field |
| `app/(root)/checkout/page.tsx` | Modify — generate UUID ref, pass in POST body |
| `lib/resend/sendOrderEmail.ts` | Modify — Fix 4 (`email_sent_at` guard + update after send) |
| `lib/resend/__tests__/sendOrderEmail.test.ts` | Modify — add email dedup test cases |
| `app/api/webhooks/pivot/route.ts` | Modify — Fix 5 (Telegram alert in Biteship `.catch()`) |

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/006_critical_fixes.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/006_critical_fixes.sql

-- Fix 2: Checkout idempotency — prevents double order on client retry
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Fix 4: Email deduplication — prevents duplicate confirmation email on webhook retry
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Fix 1: Atomic multi-item stock decrement
-- All items decremented in one transaction. If any item has insufficient stock,
-- the entire function raises an exception (triggering a full rollback).
-- Returns TRUE on full success.
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

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `apply_migration` tool:
- `project_id`: `gvfptjmpmycbfeithgyh`
- `name`: `critical_fixes`
- `query`: the SQL above

- [ ] **Step 3: Verify columns and function exist**

Use `execute_sql` with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ecom_orders'
  AND column_name IN ('idempotency_key', 'email_sent_at');

SELECT proname FROM pg_proc WHERE proname = 'ecom_decrement_stock_multi';
```

Expected: 2 column rows + 1 function row.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/006_critical_fixes.sql
git commit -m "feat(db): add idempotency_key, email_sent_at columns and ecom_decrement_stock_multi RPC"
```

---

### Task 2: Fix 1 — Atomic Stock Decrement

**Files:**
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Replace the per-item stock loop with the atomic RPC call**

In `app/api/checkout/route.ts`, find and delete the entire `for (const item of data.items)` loop that calls `ecom_decrement_stock` (including the `stockError?.code === "42883"` fallback block — approximately 40 lines). Replace the whole block with:

```typescript
// Atomically decrement stock for all items in one DB transaction.
// If any item has insufficient stock, the RPC raises an exception and all decrements roll back.
const { data: stockDecremented, error: stockError } = await admin.rpc(
  "ecom_decrement_stock_multi",
  {
    p_items: data.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
  }
);

if (stockError || !stockDecremented) {
  console.error("Stock decrement error:", stockError);
  return NextResponse.json(
    { error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" },
    { status: 409 }
  );
}
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: no TypeScript errors related to checkout/route.ts.

- [ ] **Step 3: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "fix(checkout): replace per-item stock loop with atomic ecom_decrement_stock_multi RPC"
```

---

### Task 3: Fix 2 — Checkout Idempotency

**Files:**
- Modify: `app/(root)/checkout/checkoutSchemas.ts`
- Modify: `app/api/checkout/route.ts`
- Modify: `app/(root)/checkout/page.tsx`

- [ ] **Step 1: Add `idempotencyKey` to the checkout schemas**

Read `app/(root)/checkout/checkoutSchemas.ts` first. Add `idempotencyKey` as an optional field to the base/shared part of both `guestFormSchema` and `loggedInFormSchema` (or to a shared base object if one exists):

```typescript
idempotencyKey: z.string().uuid().optional(),
```

- [ ] **Step 2: Add `idempotencyKey` to the API `CheckoutSchema`**

In `app/api/checkout/route.ts`, add to the `CheckoutSchema` object:

```typescript
idempotencyKey: z.string().uuid().optional(),
```

- [ ] **Step 3: Add the idempotency check before stock decrement**

In `app/api/checkout/route.ts`, directly after the shipping cost validation block (the `if (data.shippingCost === 0 && ...)` block) and before the stock decrement call, insert:

```typescript
// Idempotency: if this key was already used, return the existing order (no double-deduction)
if (data.idempotencyKey) {
  const { data: existingOrder } = await admin
    .from("ecom_orders")
    .select("id, order_number, total")
    .eq("idempotency_key", data.idempotencyKey)
    .maybeSingle();

  if (existingOrder) {
    return NextResponse.json({
      orderId: existingOrder.id,
      orderNumber: existingOrder.order_number,
      total: existingOrder.total,
    });
  }
}
```

- [ ] **Step 4: Add `idempotency_key` to the order insert**

In `app/api/checkout/route.ts`, inside the `.insert({...})` call for `ecom_orders`, add:

```typescript
idempotency_key: data.idempotencyKey ?? null,
```

- [ ] **Step 5: Generate and send the idempotency key from the checkout page**

Read `app/(root)/checkout/page.tsx`. `useRef` is already imported from React.

After the `const [isSubmitting, setIsSubmitting] = useState(false);` line, add:

```typescript
const idempotencyKey = useRef<string>(crypto.randomUUID());
```

Then, in the `onSubmit` handler (the function passed to `form.handleSubmit(...)`), find the `fetch("/api/checkout", { ... body: JSON.stringify({...}) })` call and add `idempotencyKey: idempotencyKey.current` to the body object being stringified.

- [ ] **Step 6: Build check**

```bash
pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add "app/(root)/checkout/checkoutSchemas.ts" app/api/checkout/route.ts "app/(root)/checkout/page.tsx"
git commit -m "fix(checkout): add UUID idempotency key to prevent double order on retry"
```

---

### Task 4: Fix 3 — Pivot Session Orphan

**Files:**
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Replace the Pivot failure handler — mark cancelled instead of delete**

In `app/api/checkout/route.ts`, find the `catch (pivotError)` block inside the Pivot session creation try/catch. It currently deletes order items and the order row. Replace the entire catch block with:

```typescript
} catch (pivotError) {
  console.error("Pivot session creation error:", pivotError);
  // Keep order + items in DB as audit trail. Mark cancelled, restore stock.
  // Deleting would remove the audit trail; marking cancelled is safer for ops.
  await admin
    .from("ecom_orders")
    .update({ status: "cancelled", payment_status: "expired" })
    .eq("id", order.id as string);
  await restoreStock(admin, data.items);
  return NextResponse.json(
    { error: "Gagal membuat sesi pembayaran", code: "PAYMENT_ERROR" },
    { status: 502 }
  );
}
```

- [ ] **Step 2: Replace the final DB update with a retry loop**

In `app/api/checkout/route.ts`, find the single `await admin.from("ecom_orders").update({pivot_payment_session_id: ...})` call after the Pivot session is created. Replace it with:

```typescript
// Store Pivot session data with retry — session ID is in memory so retries are safe.
let sessionUpdateError: unknown = null;
for (let attempt = 0; attempt < 3; attempt++) {
  const { error } = await admin
    .from("ecom_orders")
    .update({
      pivot_payment_session_id: pivotSession.paymentSessionId,
      pivot_qr_url: pivotSession.qrUrl,
      pivot_qr_string: pivotSession.qrString,
      pivot_qr_expires_at: pivotSession.qrExpiresAt,
    })
    .eq("id", order.id as string);
  if (!error) { sessionUpdateError = null; break; }
  sessionUpdateError = error;
  if (attempt < 2) await new Promise((r) => setTimeout(r, 200));
}
if (sessionUpdateError) {
  console.error(
    `[checkout] CRITICAL: Failed to store pivot session ${pivotSession.paymentSessionId} ` +
    `for order ${order.id as string}. Ops must manually link. Error:`,
    sessionUpdateError
  );
  return NextResponse.json(
    { error: "Gagal menyimpan sesi pembayaran", code: "SESSION_STORE_ERROR" },
    { status: 502 }
  );
}
```

- [ ] **Step 3: Build check**

```bash
pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "fix(checkout): mark order cancelled on Pivot failure; retry Pivot session ID storage 3x"
```

---

### Task 5: Fix 4 — Duplicate Email Guard

**Files:**
- Modify: `lib/resend/sendOrderEmail.ts`
- Modify: `lib/resend/__tests__/sendOrderEmail.test.ts`

- [ ] **Step 1: Write the two failing tests**

Open `lib/resend/__tests__/sendOrderEmail.test.ts` and add these two test cases inside the existing `describe("sendOrderEmail")` block:

```typescript
it("skips send if email_sent_at is already set", async () => {
  vi.resetModules();
  const mockSend = vi.fn().mockResolvedValue({ error: null });
  vi.doMock("resend", () => ({
    Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseAdminClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: "order-uuid",
                  order_number: "AGR-001",
                  created_at: new Date().toISOString(),
                  customer_name: "Test",
                  customer_email: "test@example.com",
                  email_sent_at: "2026-04-15T10:00:00Z", // already sent
                  ecom_order_items: [],
                  subtotal: 100000,
                  shipping_cost: 0,
                  shipping_courier: null,
                  shipping_service: null,
                  shipping_etd: null,
                  total: 100000,
                  shipping_address: {
                    recipient_name: "Test",
                    phone: "081",
                    address_line: "Jl Test",
                  },
                },
                error: null,
              }),
          }),
        }),
      }),
    }),
  }));
  const { sendOrderEmail } = await import("../sendOrderEmail");
  await sendOrderEmail("order-uuid");
  expect(mockSend).not.toHaveBeenCalled();
});

it("updates email_sent_at after successful send", async () => {
  vi.resetModules();
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  vi.doMock("resend", () => ({
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: vi.fn().mockResolvedValue({ error: null }) },
    })),
  }));
  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseAdminClient: () => ({
      from: (table: string) => {
        if (table === "ecom_orders") {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "order-uuid",
                      order_number: "AGR-001",
                      created_at: new Date().toISOString(),
                      customer_name: "Test",
                      customer_email: "test@example.com",
                      email_sent_at: null, // not sent yet
                      ecom_order_items: [],
                      subtotal: 100000,
                      shipping_cost: 0,
                      shipping_courier: null,
                      shipping_service: null,
                      shipping_etd: null,
                      total: 100000,
                      shipping_address: {
                        recipient_name: "Test",
                        phone: "081",
                        address_line: "Jl Test",
                      },
                    },
                    error: null,
                  }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {
          select: () => ({
            eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
          }),
        };
      },
    }),
  }));
  const { sendOrderEmail } = await import("../sendOrderEmail");
  await sendOrderEmail("order-uuid");
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ email_sent_at: expect.any(String) })
  );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm vitest run lib/resend/__tests__/sendOrderEmail.test.ts 2>&1 | tail -20
```

Expected: the two new test cases FAIL.

- [ ] **Step 3: Update `sendOrderEmail` with the guard and post-send update**

Replace the contents of `lib/resend/sendOrderEmail.ts` with:

```typescript
import { Resend } from "resend";
import * as React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { OrderConfirmation } from "./templates/OrderConfirmation";

export async function sendOrderEmail(orderId: string): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[sendOrderEmail] RESEND_API_KEY is not set — skipping email");
      return;
    }
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("ecom_orders")
      .select("*, ecom_order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error(`[sendOrderEmail] Order not found: ${orderId}`, error);
      return;
    }

    if (!order.customer_email) {
      return;
    }

    // Dedup guard: skip if already sent (handles concurrent webhook retries)
    if (order.email_sent_at) {
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    const trackingUrl = `${appUrl}/track/${orderId}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: "Agroastery <order@agroastery.com>",
      to: order.customer_email as string,
      subject: `Order ${order.order_number} confirmed — Agroastery`,
      react: React.createElement(OrderConfirmation, {
        orderNumber: order.order_number as string,
        orderId: order.id as string,
        createdAt: order.created_at as string,
        customerName: order.customer_name as string,
        items: (order.ecom_order_items as Array<{
          product_name: string;
          variant_description: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        }>),
        subtotal: order.subtotal as number,
        shippingCost: order.shipping_cost as number,
        shippingCourier: order.shipping_courier as string | null,
        shippingService: order.shipping_service as string | null,
        shippingEtd: order.shipping_etd as string | null,
        total: order.total as number,
        shippingAddress: order.shipping_address as {
          recipient_name: string;
          phone: string;
          address_line: string;
          postal_code?: string | null;
        },
        trackingUrl,
      }),
    });

    if (sendError) {
      console.error(`[sendOrderEmail] Resend error for order ${orderId}:`, sendError);
      return;
    }

    // Mark as sent — prevents duplicate emails on webhook retry
    await admin
      .from("ecom_orders")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", orderId);
  } catch (err) {
    console.error(`[sendOrderEmail] Unexpected error for order ${orderId}:`, err);
  }
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
pnpm vitest run lib/resend/__tests__/sendOrderEmail.test.ts 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/resend/sendOrderEmail.ts lib/resend/__tests__/sendOrderEmail.test.ts
git commit -m "fix(email): guard against duplicate sends with email_sent_at column check"
```

---

### Task 6: Fix 5 — Biteship Failure Telegram Alert

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts`

- [ ] **Step 1: Add Telegram alert to the Biteship failure `.catch()`**

In `app/api/webhooks/pivot/route.ts`, find the `createBiteshipOrder(...).catch(...)` block (around lines 101–106) and replace it with:

```typescript
createBiteshipOrder(updatedOrder.id as string).catch((err: unknown) => {
  console.error(
    `[pivot-webhook] Biteship order creation failed for order ${updatedOrder.id}:`,
    err
  );
  // Alert ops immediately — customer paid but no shipment created. Requires manual action.
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

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep -E "error TS" | head -20
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "fix(webhook): send Telegram ops alert when Biteship order creation fails"
```

---

## End-to-End Verification

After all 6 tasks complete, verify in staging (`pnpm dev:tunnel`):

1. **Fix 1 — Atomic stock:** Create order with 2 items. Check DB — both decremented together. Cannot have one succeed and one fail mid-flight.
2. **Fix 2 — Idempotency:** Double-tap the Pay button quickly. Confirm only 1 row in `ecom_orders` with that `idempotency_key`.
3. **Fix 3 — Orphan:** Temporarily set `PIVOT_MERCHANT_SECRET=wrong` in `.env.local`, attempt checkout. Order row should exist in DB with `status=cancelled`, NOT missing. Restore the correct secret afterward.
4. **Fix 4 — Email dedup:** Manually POST the Pivot webhook twice for the same `pivot_payment_session_id`. Check Resend dashboard — only 1 email sent.
5. **Fix 5 — Biteship alert:** Set `BITESHIP_API_KEY=invalid` in `.env.local`, simulate a payment. Telegram ops channel should receive the failure alert within seconds.
