# Auto-Create Jubelio Order on Payment Success — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a customer pays via Pivot QRIS, automatically create a Sales Order (then convert to paid Invoice) in Jubelio WMS, without blocking the webhook response.

**Architecture:** Fire-and-forget side effect added to the existing Pivot webhook handler. A new `lib/jubelio/orders.ts` orchestrator fetches the paid order, looks up Jubelio `item_id` by SKU, creates the SO, converts to invoice, and stores the Jubelio ID. The checkout API populates a new `sku` column on `ecom_order_items` so SKU data is available at sync time.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, Jubelio REST API, Telegram ops alerts.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/api/checkout/route.ts` | **Modify** — populate new `sku` column on `ecom_order_items` at checkout |
| `lib/jubelio/client.ts` | **Modify** — add `fetchJubelioItemBySku`, `createJubelioSalesOrder`, `convertJubelioToInvoicePayment` |
| `lib/jubelio/orders.ts` | **Create** — `createJubelioOrderFromEcom` orchestrates the full flow |
| `app/api/webhooks/pivot/route.ts` | **Modify** — fire-and-forget call to `createJubelioOrderFromEcom` |
| `lib/jubelio/client.test.ts` | **Modify** — unit tests for new client functions |
| `.env.example` | **Modify** — add `JUBELIO_MOCK` |
| `agr-ops` (separate repo) | **Document** — 2 migrations: `jubelio_salesorder_id` on `ecom_orders`, `sku` on `ecom_order_items` |

---

## Task 1: Populate `sku` on `ecom_order_items` at Checkout

**Files:**
- Modify: `app/api/checkout/route.ts:307-321`

The checkout route inserts `ecom_order_items` but does not include `sku`. We need to carry the SKU from the cart/variant through to the insert.

- [ ] **Step 1: Identify where `sku` is available**

In `app/api/checkout/route.ts`, the `verifiedItems` array is built from `itemsWithDiscounts` (around line 210). Each item already has access to the variant's SKU via the database query that fetches variant details. Find the query that builds `itemsWithDiscounts` and add `sku` to the selected fields.

Look for the Supabase query that fetches variant data (around line 130–170). It likely selects from `product_variants`. Add `sku` to the `.select(...)` call.

- [ ] **Step 2: Include `sku` in `verifiedItems` mapping**

In the `verifiedItems` mapping (around line 210–217), add `sku`:

```typescript
const verifiedItems = itemsWithDiscounts.map(({ item, productName, variantDescription, discountedPrice, shipWeightGrams, sku }) => ({
  variantId: item.variantId,
  productName,
  variantDescription,
  unitPrice: discountedPrice,
  quantity: item.quantity,
  shipWeightGrams,
  sku, // ← added
}));
```

- [ ] **Step 3: Include `sku` in `ecom_order_items` insert**

In the `orderItems` mapping (around line 307–321), add `sku`:

```typescript
const orderItems = verifiedItems.map((item) => ({
  order_id: order!.id as string,
  variant_id: item.variantId,
  product_name: item.productName,
  variant_description: item.variantDescription,
  unit_price: item.unitPrice,
  quantity: item.quantity,
  subtotal: item.unitPrice * item.quantity,
  ship_weight_grams: item.shipWeightGrams,
  sku: item.sku, // ← added
}));
```

- [ ] **Step 4: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "feat(checkout): store sku on ecom_order_items for jubelio sync"
```

---

## Task 2: Add Jubelio Client Functions

**Files:**
- Modify: `lib/jubelio/client.ts`
- Test: `lib/jubelio/client.test.ts`

- [ ] **Step 1: Add `fetchJubelioItemBySku`**

In `lib/jubelio/client.ts`, after the existing `fetchJubelioProductDetail` function, add:

```typescript
export async function fetchJubelioItemBySku(
  sku: string
): Promise<{ item_id: number; item_code: string; item_name: string } | null> {
  if (process.env.JUBELIO_MOCK === "true") {
    return { item_id: 999999, item_code: sku, item_name: "Mock Item" };
  }

  const token = await getToken();
  const res = await fetch(
    `${JUBELIO_BASE}/inventory/items/?q=${encodeURIComponent(sku)}&pageSize=1`,
    { headers: { Authorization: token } }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { data?: Array<{ item_id: number; item_code: string; item_name: string }> };
  const items = data.data ?? [];
  const match = items.find((item) => item.item_code === sku);
  return match ?? null;
}
```

- [ ] **Step 2: Add `createJubelioSalesOrder`**

In `lib/jubelio/client.ts`, add:

```typescript
export type JubelioSalesOrderItem = {
  item_id: number;
  description: string;
  price: number;
  qty_in_base: number;
  unit: string;
  amount: number;
  location_id: number;
};

export type JubelioSalesOrderPayload = {
  salesorder_id: number;
  salesorder_no: string;
  contact_id: number | null;
  customer_name: string;
  transaction_date: string;
  is_tax_included: boolean;
  sub_total: number;
  total_disc: number;
  total_tax: number;
  grand_total: number;
  location_id: number;
  source: number;
  store_id: string;
  ref_no: string;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_area: string;
  shipping_city: string;
  shipping_subdistrict: string;
  shipping_province: string;
  shipping_post_code: string;
  shipping_country: string;
  shipping_cost: number;
  is_paid: boolean;
  payment_method: string;
  items: JubelioSalesOrderItem[];
};

export async function createJubelioSalesOrder(
  payload: JubelioSalesOrderPayload
): Promise<number> {
  if (process.env.JUBELIO_MOCK === "true") {
    return 999999;
  }

  const token = await getToken();
  const res = await fetch(`${JUBELIO_BASE}/sales/orders/`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jubelio create SO failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id: number };
  return data.id;
}
```

- [ ] **Step 3: Add `convertJubelioToInvoicePayment`**

In `lib/jubelio/client.ts`, add:

```typescript
export async function convertJubelioToInvoicePayment(
  salesorderId: number
): Promise<string> {
  if (process.env.JUBELIO_MOCK === "true") {
    return "INV-TEST-001";
  }

  const token = await getToken();
  const res = await fetch(
    `${JUBELIO_BASE}/sales/packlists/create-invoice-payment`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ salesorder_id: salesorderId }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jubelio convert invoice failed ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return data.id;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/jubelio/client.ts
git commit -m "feat(jubelio): add item lookup, SO create, and invoice convert client functions"
```

---

## Task 3: Add Unit Tests for New Client Functions

**Files:**
- Modify: `lib/jubelio/client.test.ts`

- [ ] **Step 1: Write test for `fetchJubelioItemBySku`**

In `lib/jubelio/client.test.ts`, add tests (or create if file doesn't exist):

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchJubelioItemBySku,
  createJubelioSalesOrder,
  convertJubelioToInvoicePayment,
} from "./client";

describe("fetchJubelioItemBySku", () => {
  it("returns item when exact SKU match exists", async () => {
    // Mock the fetch implementation
    // ... setup mock response
  });

  it("returns null when no exact match", async () => {
    // ... setup mock with different SKU
  });

  it("returns null on API error", async () => {
    // ... setup mock returning 500
  });
});
```

- [ ] **Step 2: Write test for `createJubelioSalesOrder`**

```typescript
describe("createJubelioSalesOrder", () => {
  it("returns salesorder_id on success", async () => {
    // ... mock POST /sales/orders/ returning { id: 12345 }
  });

  it("throws on API error", async () => {
    // ... mock returning 400, expect throw
  });
});
```

- [ ] **Step 3: Write test for `convertJubelioToInvoicePayment`**

```typescript
describe("convertJubelioToInvoicePayment", () => {
  it("returns invoice id on success", async () => {
    // ... mock POST /sales/packlists/create-invoice-payment returning { id: "INV-001" }
  });

  it("throws on API error", async () => {
    // ... mock returning 500, expect throw
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test lib/jubelio/client.test.ts
```

Expected: All new tests pass (may fail if mocks not set up — fix mocks).

- [ ] **Step 5: Commit**

```bash
git add lib/jubelio/client.test.ts
git commit -m "test(jubelio): add tests for SO creation and invoice conversion"
```

---

## Task 4: Create `lib/jubelio/orders.ts` Orchestrator

**Files:**
- Create: `lib/jubelio/orders.ts`

This is the main orchestration function called from the webhook.

- [ ] **Step 1: Create the file**

```typescript
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  fetchJubelioItemBySku,
  createJubelioSalesOrder,
  convertJubelioToInvoicePayment,
  type JubelioSalesOrderPayload,
  type JubelioSalesOrderItem,
} from "./client";

const JUBELIO_LOCATION_ID = -1; // AG KEMANG - Packing
const JUBELIO_SOURCE = 524289; // Jubelio Store
const JUBELIO_STORE_ID = "127657"; // AGRoastery webstore

export async function createJubelioOrderFromEcom(
  orderId: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // 1. Fetch order + items
  const { data: order, error: orderError } = await supabase
    .from("ecom_orders")
    .select("*, ecom_order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order ${orderId} not found: ${orderError?.message}`);
  }

  // Idempotency guard
  if (order.jubelio_salesorder_id) {
    console.log(`[jubelio] Order ${orderId} already synced, skipping`);
    return;
  }

  const items: Array<{
    id: string;
    sku: string | null;
    product_name: string;
    variant_description: string | null;
    unit_price: number;
    quantity: number;
  }> = order.ecom_order_items ?? [];

  if (items.length === 0) {
    throw new Error(`Order ${orderId} has no items`);
  }

  // 2. Look up each SKU in Jubelio
  const jubelioItems: JubelioSalesOrderItem[] = [];

  for (const item of items) {
    if (!item.sku) {
      throw new Error(`Order ${orderId} item ${item.id} has no SKU`);
    }

    const jubelioItem = await fetchJubelioItemBySku(item.sku);
    if (!jubelioItem) {
      throw new Error(`SKU not found in Jubelio: ${item.sku}`);
    }

    jubelioItems.push({
      item_id: jubelioItem.item_id,
      description: item.variant_description ?? item.product_name,
      price: item.unit_price,
      qty_in_base: item.quantity,
      unit: "Buah",
      amount: item.unit_price * item.quantity,
      location_id: JUBELIO_LOCATION_ID,
    });
  }

  // 3. Parse shipping address from JSON
  const shipping = order.shipping_address as {
    recipient_name?: string;
    phone?: string;
    address_line?: string;
    postal_code?: string;
    // Additional fields may exist
  } | null;

  // 4. Build and create Sales Order
  const payload: JubelioSalesOrderPayload = {
    salesorder_id: 0,
    salesorder_no: "[auto]",
    contact_id: null,
    customer_name: (order.customer_name as string) ?? "Guest",
    transaction_date: new Date().toISOString(),
    is_tax_included: false,
    sub_total: (order.subtotal as number) ?? 0,
    total_disc: 0,
    total_tax: 0, // Tax-inclusive pricing — sell price already includes PPN 11%
    grand_total: (order.total as number) ?? 0,
    location_id: JUBELIO_LOCATION_ID,
    source: JUBELIO_SOURCE,
    store_id: JUBELIO_STORE_ID,
    ref_no: (order.order_number as string) ?? orderId,
    shipping_full_name: shipping?.recipient_name ?? (order.customer_name as string) ?? "Guest",
    shipping_phone: shipping?.phone ?? (order.customer_phone as string) ?? "",
    shipping_address: shipping?.address_line ?? "",
    shipping_area: "",
    shipping_city: "",
    shipping_subdistrict: "",
    shipping_province: "",
    shipping_post_code: shipping?.postal_code ?? "",
    shipping_country: "Indonesia",
    shipping_cost: (order.shipping_cost as number) ?? 0,
    is_paid: true,
    payment_method: (order.xendit_payment_method as string) ?? "QRIS",
    items: jubelioItems,
  };

  const salesorderId = await createJubelioSalesOrder(payload);

  // 5. Convert to invoice
  await convertJubelioToInvoicePayment(salesorderId);

  // 6. Store the Jubelio SO ID
  const { error: updateError } = await supabase
    .from("ecom_orders")
    .update({ jubelio_salesorder_id: salesorderId })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(
      `Failed to store jubelio_salesorder_id for ${orderId}: ${updateError.message}`
    );
  }

  console.log(`[jubelio] Order ${orderId} synced to Jubelio SO ${salesorderId}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/jubelio/orders.ts
git commit -m "feat(jubelio): add order sync orchestrator"
```

---

## Task 5: Wire Up Webhook

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts`

- [ ] **Step 1: Import the orchestrator**

At the top of `app/api/webhooks/pivot/route.ts`, add:

```typescript
import { createJubelioOrderFromEcom } from "@/lib/jubelio/orders";
```

- [ ] **Step 2: Add fire-and-forget call after existing side effects**

In the `PAYMENT.PAID` block (after the `sendOrderEmail` call, around line 123), add:

```typescript
// Fire-and-forget: push order to Jubelio (must never block the webhook)
createJubelioOrderFromEcom(updatedOrder.id as string).catch((err: unknown) => {
  console.error(
    `[pivot-webhook] Jubelio order sync failed for order ${updatedOrder.id}:`
    err
  );
  // Alert ops — customer paid but order not in Jubelio. Requires manual sync.
  sendPaymentNotification({
    orderId: updatedOrder.id as string,
    orderNumber: updatedOrder.order_number as string,
    customerName: updatedOrder.customer_name as string,
    customerPhone: updatedOrder.customer_phone as string,
    paymentMethod: "⚠️ JUBELIO GAGAL — sync manual ke Jubelio",
    total: updatedOrder.total as number,
    paidAt: new Date().toISOString(),
  }).catch(() => {});
});
```

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "feat(webhook): auto-create Jubelio order on payment success"
```

---

## Task 6: Update `.env.example`

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add `JUBELIO_MOCK`**

Find the Jubelio credentials section in `.env.example` and add:

```bash
# Set to "true" to skip real Jubelio API calls in dev/CI
JUBELIO_MOCK=false
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(env): add JUBELIO_MOCK toggle"
```

---

## Task 7: Migrations (agr-ops repo)

> **Note:** These migrations live in the `agr-ops` repository, not `agroastery-web`. Apply them there.

- [ ] **Step 1: Create migration for `ecom_orders.jubelio_salesorder_id`**

```sql
ALTER TABLE ecom_orders ADD COLUMN jubelio_salesorder_id bigint;
```

- [ ] **Step 2: Create migration for `ecom_order_items.sku`**

```sql
ALTER TABLE ecom_order_items ADD COLUMN sku text;
```

- [ ] **Step 3: Apply migrations and verify**

Run the migrations in the `agr-ops` repo and confirm the columns exist:

```sql
\d ecom_orders
\d ecom_order_items
```

- [ ] **Step 4: Commit migrations in agr-ops**

```bash
git add supabase/migrations/
git commit -m "feat(db): add jubelio_salesorder_id and sku columns for Jubelio integration"
```

---

## Task 8: Integration Test

- [ ] **Step 1: Set `JUBELIO_MOCK=true`**

Add to your `.env.local`:

```bash
JUBELIO_MOCK=true
```

- [ ] **Step 2: Run a test checkout and payment**

1. Complete a test checkout on the site
2. Check the database — `ecom_order_items.sku` should be populated
3. Check `ecom_orders.jubelio_salesorder_id` — should be `999999` (mock value)

- [ ] **Step 3: Verify webhook flow**

Trigger the Pivot webhook locally (or check logs after a real test payment):

```bash
# Look for these log lines:
# "[jubelio] Order <uuid> synced to Jubelio SO 999999"
# or
# "[pivot-webhook] Jubelio order sync failed..."
```

- [ ] **Step 4: Remove `JUBELIO_MOCK` for real testing**

```bash
# Remove from .env.local or set to false
JUBELIO_MOCK=false
```

- [ ] **Step 5: Run real end-to-end test**

1. Place a real order (or reuse an existing paid order)
2. Check Jubelio dashboard at `app2.jubelio.com` → Sales Orders
3. Verify the order appears with correct items, customer, and totals
4. Verify the invoice is created and marked as paid

- [ ] **Step 6: Roll back test data if needed**

If testing created unwanted data in Jubelio, delete the test Sales Order from the Jubelio dashboard.

---

## Task 9: Final Review

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: No errors in modified files.

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 3: Build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: auto-create Jubelio order on payment success

- Add sku column to ecom_order_items, populated at checkout
- Add Jubelio client: item lookup, SO creation, invoice conversion
- Add order sync orchestrator with idempotency guard
- Fire-and-forget webhook integration (non-blocking)
- Telegram ops alert on failure"
```

---

## Spec Coverage Checklist

| Spec Requirement | Plan Task |
|---|---|
| Fire-and-forget Jubelio sync on `PAYMENT.PAID` | Task 5 |
| Non-blocking — errors don't affect customer | Tasks 4, 5 (`.catch()` pattern) |
| SKU lookup by `item_code` | Task 2 (`fetchJubelioItemBySku`) |
| Create Sales Order (`POST /sales/orders/`) | Task 2 (`createJubelioSalesOrder`) |
| Convert to paid Invoice (`POST /sales/packlists/create-invoice-payment`) | Task 2 (`convertJubelioToInvoicePayment`) |
| Store `jubelio_salesorder_id` on `ecom_orders` | Tasks 4, 7 |
| Populate `sku` on `ecom_order_items` at checkout | Task 1 |
| Idempotency guard (`jubelio_salesorder_id` check) | Task 4 |
| Location: AG KEMANG - Packing (`-1`) | Task 4 (constant) |
| Channel: Jubelio Store (`source: 524289`, `store_id: "127657"`) | Task 4 (constants) |
| Payment method maps from `xendit_payment_method` | Task 4 |
| `total_tax = 0` (tax-inclusive pricing) | Task 4 |
| Telegram ops alert on failure | Task 5 |
| `JUBELIO_MOCK` env var | Tasks 2, 6 |
| Migrations in `agr-ops` repo | Task 7 |

**No placeholders detected. All spec requirements have matching tasks.**
