# Biteship End-to-End Shipping Lifecycle

**Date**: 2026-04-12
**Status**: Approved
**Branch**: `feat/biteship-lifecycle`

---

## Problem

The Biteship integration is incomplete. Rates are fetched and courier selection works, but after payment is confirmed no Biteship order is ever created. This means:

- No waybill (AWB) is generated — Agroastery cannot print shipping labels
- `biteship_order_id` and `tracking_number` columns in `ecom_orders` are never populated
- Customers cannot track their packages
- Shipping status updates (shipped, delivered) never reach the database

---

## Approach: Rates → Checkout → Create Order After Payment

Keep existing rates flow for courier selection. After the Pivot payment webhook confirms payment, create a Biteship Order directly (`POST /v1/orders`). The Biteship webhook then updates tracking info and order status.

**Why this approach**: payment-first, fulfill-after is the correct model for this business. Draft order confirm was considered but adds complexity (orphaned drafts on payment failure) with no benefit since the courier is already known at checkout time.

---

## Full Lifecycle Flow

```
[Customer]
  │
  ├─ POST /api/shipping/rates ─────→ Biteship POST /v1/rates/couriers
  │    (existing, mostly correct)          returns pricing list
  │
  ├─ POST /api/checkout ───────────→ ecom_orders INSERT
  │    (existing)                          status: pending_payment
  │                                        shipping_courier, shipping_service,
  │                                        shipping_cost, shipping_etd stored
  │
  ├─ POST /api/webhooks/pivot      ← Pivot fires on PAYMENT.PAID
  │    [existing] set payment_status=paid, status=processing
  │    [NEW]      call createBiteshipOrder(orderId) — fire-and-forget
  │                 └→ POST /v1/orders
  │                 └→ UPDATE ecom_orders SET biteship_order_id, tracking_number
  │
  ├─ POST /api/webhooks/biteship   ← Biteship fires on shipping events
  │    [NEW]  order.status    → update ecom_orders.status
  │           order.waybill_id → update ecom_orders.tracking_number
  │
  └─ GET /api/orders/[id]/tracking ← Customer polls tracking
       [NEW] fetch biteship_order_id from ecom_orders
             GET /v1/trackings/:biteship_order_id
             return normalized history events
```

---

## Components

### 1. `lib/biteship/createOrder.ts` (new, server-only)

Exported function: `createBiteshipOrder(orderId: string): Promise<void>`

**Inputs (fetched from DB):**
- `ecom_orders`: `shipping_address` (JSONB), `shipping_courier`, `shipping_service`, `notes`, `order_number`, `customer_name`, `customer_phone`, `customer_email`
- `ecom_order_items`: `product_name`, `unit_price`, `quantity`, `ship_weight_grams`, `variant_id`

**Biteship payload:**
```
origin_contact_name    ← env ORIGIN_CONTACT_NAME
origin_contact_phone   ← env ORIGIN_CONTACT_PHONE
origin_address         ← env ORIGIN_ADDRESS
origin_postal_code     ← env ORIGIN_POSTAL_CODE (number)
origin_coordinate      ← env ORIGIN_LATITUDE + ORIGIN_LONGITUDE (if both present)
destination_contact_name  ← shipping_address.recipient_name
destination_contact_phone ← shipping_address.phone
destination_address       ← shipping_address.address_line
destination_postal_code   ← shipping_address.postal_code (number, if present)
destination_coordinate    ← shipping_address.latitude + longitude (if both present)
courier_company        ← shipping_courier (e.g. "jne")
courier_type           ← shipping_service (e.g. "reg")
delivery_type          ← "now"
order_note             ← notes (if any)
reference_id           ← order_number (e.g. "AGR-20260412-ABCD1E") — unique
items[]                ← one entry per ecom_order_item:
  name                 ← product_name
  value                ← unit_price
  quantity             ← quantity
  weight               ← ship_weight_grams
  category             ← "food_and_drink" (hardcoded — Agroastery sells coffee)
  height / length / width ← 10 / 20 / 15 cm defaults
```

**On success:** update `ecom_orders` row:
```sql
SET biteship_order_id = response.id,
    tracking_number   = response.courier.waybill_id  -- may be null initially
WHERE id = orderId
```

**On failure:** throw with context (caller logs it, does not re-throw to Pivot).

**Guard:** if `shipping_courier` or `shipping_service` is null, skip creation and log a warning (order has no courier selected — edge case for orders created without shipping).

---

### 2. Pivot Webhook Enhancement (`app/api/webhooks/pivot/route.ts`)

In the existing `PAYMENT.PAID` branch, after `updatedOrder` is confirmed:

```typescript
// existing
sendPaymentNotification({ ... });

// new — fire-and-forget, never block the webhook response
createBiteshipOrder(updatedOrder.id).catch((err) =>
  console.error(`[pivot-webhook] Biteship order creation failed for ${updatedOrder.id}:`, err)
);
```

**Why fire-and-forget:** Pivot expects a fast `200`. If Biteship creation were awaited and timed out, Pivot would retry the webhook and could double-charge or duplicate the order. Payment is already recorded; Biteship failure is a fulfillment concern resolved manually.

**Retry / manual recovery:** if `biteship_order_id` is null on a `processing` order, ops can re-trigger creation. A future improvement could add a cron-based retry for null `biteship_order_id` on paid orders.

---

### 3. Biteship Webhook Handler (`POST /api/webhooks/biteship`) (new)

**Authentication:** Biteship does not provide cryptographic request signing. The webhook URL registered in the Biteship dashboard includes a query-param secret:
```
https://agroastery.com/api/webhooks/biteship?secret=BITESHIP_WEBHOOK_SECRET
```
The handler compares this against `process.env.BITESHIP_WEBHOOK_SECRET` using `timingSafeEqual`.

**New env var required:** `BITESHIP_WEBHOOK_SECRET`

**Events handled:**

| Event | Action |
|---|---|
| `order.status` | Map Biteship status → `ecom_orders.status`, update row by `biteship_order_id` |
| `order.waybill_id` | Update `ecom_orders.tracking_number` with new `courier_waybill_id` |
| `order.price` | Log only — price delta is a Biteship billing concern, not surfaced to customer |
| anything else | Log and return 200 |

**Status mapping:**

| Biteship status | `ecom_orders.status` |
|---|---|
| `confirmed`, `scheduled`, `allocated`, `picking_up` | `processing` |
| `picked`, `dropping_off` | `shipped` |
| `delivered` | `delivered` |
| `cancelled`, `rejected`, `courier_not_found`, `disposed` | `cancelled` |
| `returned`, `return_in_transit` | `refunded` |
| `on_hold` | `processing` (no-op change, just keep processing) |

Lookup: `ecom_orders WHERE biteship_order_id = payload.order_id`.

If no matching order found: log warning, return 200 (don't error — could be a test event).

---

### 4. Tracking Endpoint (`GET /api/orders/[id]/tracking`) (new)

`[id]` = `ecom_orders.id` (UUID).

**Auth:**
- If a Supabase session exists: verify `ecom_orders.user_id = auth.uid()`.
- If no session (guest): allow — the UUID is cryptographically unguessable (no PII returned beyond what the customer already knows).

**Response when no `biteship_order_id` yet:**
```json
{ "dispatched": false, "status": "processing", "tracking": null }
```

**Response when dispatched:**
Requires `tracking_number` (waybill ID, set by Biteship webhook) to be non-null. If it is null, return `dispatched: false` even if `biteship_order_id` exists (order created but courier not yet assigned a waybill).

Call `GET https://api.biteship.com/v1/trackings/:tracking_number/couriers/:shipping_courier` (public tracking endpoint — requires waybill_id + courier_code, both stored in `ecom_orders`). Server-side call with API key.

Return normalized:
```json
{
  "dispatched": true,
  "status": "shipped",
  "waybill_id": "JNE-XXXX",
  "courier": "jne",
  "link": "https://...",
  "history": [
    { "status": "confirmed", "note": "...", "updated_at": "2026-04-12T..." },
    { "status": "picked",    "note": "...", "updated_at": "2026-04-12T..." }
  ]
}
```

---

### 5. Cleanup (alongside new work)

| Item | File | Action |
|---|---|---|
| Dead `fetchShippingRates` | `lib/stores/shipping.ts` | Delete function + `TShippingRate` type (only used there) |
| Silent geo-retry | `app/api/shipping/rates/route.ts` | Remove retry block; single fetch, return error directly |
| Multi-item `useShippingCalculator` | `lib/hooks/useShippingCalculator.ts` | Accept `items: ShippingCalcItem[]`; keep single-item shorthand working |

**Multi-item detail:** `ShippingCalcParams` gains an optional `items` array. When `items` is provided it is sent directly. When not provided, the hook builds the single-item payload from the existing scalar fields (backward compat for the product page). This lets the cart page pass all cart items in one Biteship call, getting correct aggregate weight pricing.

---

## New / Changed Files

| File | Change |
|---|---|
| `lib/biteship/createOrder.ts` | New |
| `app/api/webhooks/biteship/route.ts` | New |
| `app/api/orders/[id]/tracking/route.ts` | New |
| `app/api/webhooks/pivot/route.ts` | Add `createBiteshipOrder` call |
| `lib/stores/shipping.ts` | Remove dead `fetchShippingRates` + `TShippingRate` |
| `app/api/shipping/rates/route.ts` | Remove silent geo-retry |
| `lib/hooks/useShippingCalculator.ts` | Multi-item support |
| `.env.example` | Add `BITESHIP_WEBHOOK_SECRET` |

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `BITESHIP_API_KEY` | Server | Existing — used for all Biteship API calls |
| `BITESHIP_WEBHOOK_SECRET` | Server | **New** — shared secret for webhook URL auth |
| `ORIGIN_CONTACT_NAME` | Server | Existing — shipper name for Biteship order |
| `ORIGIN_CONTACT_PHONE` | Server | Existing |
| `ORIGIN_ADDRESS` | Server | Existing |
| `ORIGIN_POSTAL_CODE` | Server | Existing |
| `ORIGIN_LATITUDE` | Server | Existing |
| `ORIGIN_LONGITUDE` | Server | Existing |

All origin env vars are server-only (no `NEXT_PUBLIC_` prefix needed for order creation).

---

## Out of Scope

- Shipping label generation (requires Biteship Order API activation + label template — separate task)
- Biteship order cancellation on ecom_order cancellation (future)
- Cron-based retry for failed `createBiteshipOrder` calls (future)
- Insurance / COD support (not currently offered)
