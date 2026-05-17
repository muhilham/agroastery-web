# Auto-Create Jubelio Order on Payment Success

**Date:** 2026-05-15
**Status:** Design — Awaiting Approval

---

## 1. Summary

When a customer pays via Pivot QRIS, the `PAYMENT.PAID` webhook currently updates the order status, creates a Biteship draft, sends a Telegram notification, and emails the customer. We will add one more **fire-and-forget** side effect: automatically creating the order in Jubelio as a Sales Order, then converting it to a paid Invoice.

This is **strictly non-blocking** — if Jubelio creation fails, the e-commerce order remains valid and paid. No retry logic, no queue, no state machine. Failure is surfaced via Telegram ops alert only.

---

## 2. Goals

- Every paid e-commerce order is pushed to Jubelio WMS for fulfillment
- Zero impact on customer experience if Jubelio API is down
- Minimal code and infrastructure changes
- Consistent with existing fire-and-forget patterns (Biteship, Telegram, Resend)

---

## 3. Non-Goals

- Jubelio → e-commerce sync (bidirectional sync is out of scope)
- Retry logic or queue-based processing
- Updating Jubelio order status when Biteship ships (Jubelio WMS handles its own fulfillment lifecycle)
- Inventory validation in Jubelio before creating the order

---

## 4. Data Flow

```
Pivot Webhook (PAYMENT.PAID)
  │
  ├─ 1. Update ecom_orders → status: processing, payment_status: paid, paid_at
  ├─ 2. Send Telegram payment notification
  ├─ 3. Create Biteship draft order → store biteship_draft_id
  ├─ 4. Send Resend order confirmation email → store email_sent_at
  └─ 5. 🆕 Create Jubelio order (fire-and-forget)
       │
       ├─ 5a. Fetch ecom_order + ecom_order_items from Supabase
       ├─ 5b. For each item SKU, query Jubelio to get item_id
       ├─ 5c. POST /sales/orders/ → create Sales Order in Jubelio
       ├─ 5d. POST /sales/packlists/create-invoice-payment → convert to paid Invoice
       └─ 5e. Update ecom_orders.jubelio_salesorder_id with the SO ID
       │
       └─ On any error: log + send Telegram ops alert, do NOT throw or block
```

---

## 5. Database Changes

### 5.1 New column on `ecom_orders`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `jubelio_salesorder_id` | `bigint` | Yes | `null` | The Jubelio Sales Order ID. Used for reference only. |

Migration (in `agr-ops` repo, per project convention):

```sql
ALTER TABLE ecom_orders ADD COLUMN jubelio_salesorder_id bigint;
```

No indexes needed — this column is only read for reference/debugging.

### 5.2 New column on `ecom_order_items`

`ecom_order_items` currently has no `sku` column, but the Jubelio SKU lookup requires it. We will add it at order creation time.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `sku` | `text` | Yes | `null` | Copied from `product_variants.sku` at checkout time |

Migration (in `agr-ops` repo, per project convention):

```sql
ALTER TABLE ecom_order_items ADD COLUMN sku text;
```

Also update the checkout API to populate this column when inserting `ecom_order_items`.

### 5.3 No changes to products/variants

We will **not** store `jubelio_item_id` on `product_variants`. Instead, we do a real-time SKU lookup via `GET /inventory/items/?q={sku}&pageSize=1` at order creation time (per user decision).

---

## 6. API Integration

### 6.1 New Jubelio Client Functions

Added to `lib/jubelio/client.ts`:

#### `fetchJubelioItemBySku(sku: string): Promise<{ item_id: number; item_code: string; item_name: string } | null>`

Searches Jubelio inventory by SKU and returns the exact match.

- **Endpoint:** `GET /inventory/items/?q={sku}&pageSize=1`
- **Logic:** Fetches results, filters for exact `item_code === sku`, returns first match or `null`
- **Error handling:** Returns `null` on any API error (caller decides what to do)

#### `createJubelioSalesOrder(payload: SaveSalesOrderPayload): Promise<number>`

Creates a Sales Order in Jubelio.

- **Endpoint:** `POST /sales/orders/`
- **Returns:** The created `salesorder_id` (number)
- **Key payload fields:**
  - `salesorder_id: 0` (create new)
  - `salesorder_no: "[auto]"` (auto-generate)
  - `contact_id: null`, `customer_name: <ecom customer_name>`
  - `transaction_date: <now>`
  - `sub_total, total_disc, total_tax, grand_total` (from ecom order). **Note:** `total_tax = 0` because Agroastery uses tax-inclusive pricing (sell price already includes PPN 11%)
  - `location_id: -1` (AG KEMANG - Packing — hardcoded per user decision)
  - `source: 524289` (Jubelio Store / webstore channel)
  - `store_id: "127657"` (AGRoastery webstore in Jubelio)
  - `ref_no: <ecom order_number>`
  - `shipping_full_name, shipping_phone, shipping_address, shipping_area, shipping_city, shipping_subdistrict, shipping_province, shipping_post_code, shipping_country`
  - `shipping_cost: <ecom shipping_cost>`
  - `is_paid: true`, `payment_method: <ecom_orders.xendit_payment_method>` (currently always `"QRIS"` since Pivot is the only provider; maps correctly if other methods are added later)
  - `items[]` array with:
    - `item_id, description, price, qty_in_base, unit`
    - `amount: price * qty`
    - `location_id: -1`

#### `convertJubelioToInvoicePayment(salesorderId: number): Promise<string>`

Converts a Sales Order to Invoice and marks it as paid in one step.

- **Endpoint:** `POST /sales/packlists/create-invoice-payment`
- **Request body:** `{ salesorder_id: <id> }`
- **Returns:** The invoice number (string)

### 6.2 Error Handling

| Scenario | Behavior |
|---|---|
| SKU not found in Jubelio | Log error, send Telegram alert, abort entire Jubelio sync for this order |
| Jubelio API returns 4xx/5xx | Log error, send Telegram alert, abort |
| Partial item lookup failure (e.g. 2 of 3 items found) | Abort entire order — never create a partial Sales Order |
| Invoice conversion fails after SO created | Log error, send Telegram alert. SO exists but is not invoiced — your team must handle it manually in Jubelio dashboard |
| Telegram alert fails | Log to console; order is still paid and valid |

---

## 7. Webhook Integration

File: `app/api/webhooks/pivot/route.ts`

After the existing `Promise.all([telegram, biteship, email])` block, add:

```typescript
// Fire-and-forget: push order to Jubelio (must never block the webhook)
createJubelioOrderFromEcom(orderId).catch((err) => {
  console.error("[jubelio] Order sync failed for", orderNumber, err);
  sendOpsAlert(`⚠️ JUBELIO GAGAL sync order ${orderNumber}: ${err.message}`).catch(() => {});
});
```

The `createJubelioOrderFromEcom` function lives in a new file: `lib/jubelio/orders.ts`.

**Idempotency guard:** Before calling Jubelio, check if `ecom_orders.jubelio_salesorder_id` is already set. If so, skip the sync. This prevents duplicate Sales Orders if the webhook fires twice.

### 7.1 `lib/jubelio/orders.ts`

```typescript
export async function createJubelioOrderFromEcom(orderId: string): Promise<void>
```

Steps:
1. Fetch `ecom_orders` + `ecom_order_items` (joined) from Supabase
2. For each item, read `item.sku` (from the `ecom_order_items.sku` column added in §5.2) and call `fetchJubelioItemBySku(item.sku)`:
   - If any return `null`, throw `Error("SKU not found in Jubelio: ${sku}")`
3. Build `SaveSalesOrderPayload`
4. Call `createJubelioSalesOrder(payload)` → get `salesorderId`
5. Call `convertJubelioToInvoicePayment(salesorderId)`
6. Update `ecom_orders.jubelio_salesorder_id = salesorderId`

---

## 8. Telegram Alerts

Reuses existing `sendOpsAlert` pattern. Message format:

```
⚠️ JUBELIO GAGAL sync order AGR-20260115-000001: SKU PS-BK-XXX not found in Jubelio
```

Or:

```
⚠️ JUBELIO GAGAL sync order AGR-20260115-000001: Jubelio API returned 500
```

---

## 9. Testing

### 9.1 Unit Tests

Mock Jubelio API responses in `lib/jubelio/client.test.ts`:
- `fetchJubelioItemBySku` — success, no match, API error
- `createJubelioSalesOrder` — success, validation error
- `convertJubelioToInvoicePayment` — success, failure

### 9.2 Integration Test

- Create a test Sales Order in Jubelio using real API (use a dummy customer and items)
- Verify it appears in Jubelio dashboard
- Delete the test order afterwards

### 9.3 Mock Mode

Add `JUBELIO_MOCK=true` env var. When set:
- `fetchJubelioItemBySku` returns a dummy item_id
- `createJubelioSalesOrder` returns `999999`
- `convertJubelioToInvoicePayment` returns `"INV-TEST-001"`
- `createJubelioOrderFromEcom` still runs through all steps but doesn't hit the real API

Useful for local dev and CI.

---

## 10. Environment Variables

No new env vars required. Reuses existing:
- `JUBELIO_EMAIL`
- `JUBELIO_PASSWORD`

Optional new:
- `JUBELIO_MOCK=false` (default)

---

## 11. Files to Create / Modify

| File | Action |
|---|---|
| `lib/jubelio/client.ts` | Add `fetchJubelioItemBySku`, `createJubelioSalesOrder`, `convertJubelioToInvoicePayment` |
| `lib/jubelio/orders.ts` | **New** — `createJubelioOrderFromEcom` orchestration function |
| `app/api/webhooks/pivot/route.ts` | Add fire-and-forget Jubelio call |
| `agr-ops` repo (DB migrations) | Add `jubelio_salesorder_id` to `ecom_orders`, `sku` to `ecom_order_items` — **migrations live in agr-ops** |
| Checkout API (`app/api/checkout/` or similar) | Populate `sku` column when inserting `ecom_order_items` |
| `lib/jubelio/client.test.ts` | Add tests for new client functions |
| `.env.example` | Add `JUBELIO_MOCK=false` (optional) |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Jubelio API is down during checkout peak | Fire-and-forget design means no customer impact. Ops alert lets team know to sync manually later |
| SKU lookup returns wrong item_id | Exact-match filtering on `item_code` minimizes risk |
| Jubelio rate limit (600 req/min) | SKU lookup is 1-3 requests per order; at current volume this is well within limits |
| Order created twice in Jubelio | We only run on `PAYMENT.PAID` webhook which is idempotent. Even if webhook fires twice, `jubelio_salesorder_id` on ecom_orders can act as a guard (check before creating) |
| Shipping address format mismatch | Map ecom fields to Jubelio fields as closely as possible; any validation errors surface as Telegram alerts |

---

## 13. Open Questions

1. **Customer mapping:** Should we try to match existing Jubelio contacts by phone/email, or always create orders with `contact_id: null` and just `customer_name`? For now: `contact_id: null`, `customer_name` only.

---

## 14. Approval

**Design approved by:** _______________  
**Date:** _______________
