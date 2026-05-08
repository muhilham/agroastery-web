# Biteship Order Tracking Flow

## ID Taxonomy

Biteship uses four distinct identifiers. Confusing them breaks the webhook lookup.

| Field | Type | Stored in DB | Example | Purpose |
|---|---|---|---|---|
| `biteship_draft_id` | UUID | `ecom_orders.biteship_draft_id` | `924cb325-bba0-411d-a2af-f00d2a863798` | Draft order ID from `POST /v1/draft_orders`. Saved immediately at draft creation. |
| `biteship_order_id` | hex | `ecom_orders.biteship_order_id` | `69fdd67cb2a80504a1029a4c` | Confirmed order ID. Different from draft ID. Populated lazily on first webhook. |
| `tracking_number` | string | `ecom_orders.tracking_number` | `WYB-1778243196004` | Courier waybill / resi number. Used by our internal tracking page API call. |
| `courier_tracking_id` | string | `ecom_orders.courier_tracking_id` | `SNp0TfxIGdr4X3KBocP4VCLf` | Biteship public tracking ID. Used in `https://track.biteship.com/{courier_tracking_id}`. |

**Key fact**: `biteship_draft_id` ≠ `biteship_order_id`. When staff confirms a draft in the Biteship dashboard, Biteship creates a new confirmed order with a completely different ID and format.

---

## Order Lifecycle

```
1. Customer pays
        ↓
2. createBiteshipDraft() called
   POST /v1/draft_orders  { reference_id: ecom_orders.id }
   → returns draft id
   → saved as ecom_orders.biteship_draft_id
        ↓
3. Staff confirms draft in Biteship dashboard
   → Biteship creates confirmed order with new order_id
   → NO webhook fired at this point
        ↓
4. Courier picks up / status changes
   → Biteship fires order.status webhook
   → webhook body contains:
        order_id          = biteship_order_id (new hex id)
        courier_waybill_id = tracking_number (resi)
        courier_tracking_id = courier_tracking_id (public link id)
        status            = e.g. "confirmed", "picked"
        ↓
5. Webhook handler resolves our order (see below)
   → updates status, tracking_number, courier_tracking_id in DB
```

---

## Webhook Handler: Order Resolution

Biteship webhooks do **not** include `reference_id`. The handler uses a two-step lookup.

### Step 1 — Fast path (all webhooks after the first)

```
biteship_order_id already saved in DB
→ match ecom_orders.biteship_order_id = webhook.order_id
→ apply update
```

### Step 2 — Slow path (first webhook only)

`biteship_order_id` is not yet in DB because draft confirmation fires no webhook.

```
biteship_order_id miss
→ call GET /v1/orders/{order_id}   (Biteship API)
→ response contains draft_order_id = our biteship_draft_id
→ match ecom_orders.biteship_draft_id = draft_order_id
→ apply update
→ save biteship_order_id for future webhooks (fast path from now on)
```

**Why not use `reference_id`?** Biteship webhook payloads do not include `reference_id`. Confirmed by inspecting live webhook payloads and Biteship documentation.

### What each event saves

| Event | Fields saved |
|---|---|
| `order.status` | `status`, `tracking_number` (if present), `courier_tracking_id` (if present) |
| `order.waybill_id` | `tracking_number`, `courier_tracking_id` (if present) |
| `order.price` | unhandled (no ecom_orders field to update) |

---

## Tracking Link

Biteship's public tracking URL format:
```
https://track.biteship.com/{courier_tracking_id}
```

This uses `courier_tracking_id`, **not** `biteship_order_id` or `biteship_draft_id`.

Confirmed from live order detail response:
```json
"courier": {
  "tracking_id": "SNp0TfxIGdr4X3KBocP4VCLf",
  "link": "https://track.biteship.com/SNp0TfxIGdr4X3KBocP4VCLf"
}
```

---

## "Lacak Pesanan" Button (Order Detail Page)

File: `app/(root)/orders/[id]/page.tsx`

Button shows when `ecom_orders.tracking_number` is set (waybill assigned = courier actively handling shipment). Links to internal tracking page `/track/{ecom_order_id}`.

The internal tracking page (`app/(root)/track/[orderId]/`) calls our API at `GET /api/orders/{orderId}/tracking`, which calls:
```
GET https://api.biteship.com/v1/trackings/{tracking_number}/couriers/{shipping_courier}
```

---

## Relevant Files

| File | Role |
|---|---|
| `lib/biteship/createDraft.ts` | Creates Biteship draft order after payment, saves `biteship_draft_id` |
| `app/api/webhooks/biteship/route.ts` | Receives Biteship webhooks, resolves order via two-step lookup |
| `app/api/orders/[orderId]/tracking/route.ts` | Fetches live tracking data from Biteship tracking API |
| `app/(root)/track/[orderId]/` | Customer-facing tracking timeline page |
| `app/(root)/orders/[id]/page.tsx` | Order detail page with "Lacak Pesanan" button |
| `agr-ops/supabase/migrations/016_add_biteship_draft_id.sql` | Adds `biteship_draft_id` column |
| `agr-ops/supabase/migrations/021_add_courier_tracking_id.sql` | Adds `courier_tracking_id` column |
