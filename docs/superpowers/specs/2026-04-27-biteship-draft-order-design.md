# Biteship Draft Order Flow — Design Spec

**Date:** 2026-04-27
**Branch:** TBD (suggest `feat/biteship-draft-order`)
**Status:** Draft, awaiting user review

## Problem

Current flow creates a live Biteship order (`POST /v1/orders`) immediately when Pivot payment webhook fires. Staff has no chance to review the order before Biteship dispatches a courier pickup. Wrong courier, wrong address, wrong items, etc. cannot be corrected without cancelling and recreating the order.

## Goal

Allow staff to review and confirm each shipment in the Biteship dashboard before pickup is dispatched.

## Solution Summary

Replace the live order call with a **draft order** call. Staff confirms drafts manually inside the Biteship dashboard. Our system listens for the resulting order webhooks and reconciles the new `biteship_order_id` via the shared `reference_id`.

## Non-Goals (v1)

- No in-app admin UI for confirmation. Staff uses Biteship dashboard.
- No automatic confirm timeout / cron fallback.
- No customer-initiated refund-before-confirm flow (no `DELETE /v1/draft_orders/:id` integration).
- No edit-draft endpoints exposed to staff (admin UI). Staff edits in Biteship dashboard if needed.

## Architecture

### Flow

1. Customer pays. Pivot webhook fires (`PAYMENT.PAID`).
2. Webhook handler updates `ecom_orders.status='paid'`, then triggers `createBiteshipDraft(orderId)`.
3. `createBiteshipDraft` calls `POST /v1/draft_orders` with `reference_id = order_number`. Stores returned `id` in `ecom_orders.biteship_draft_id`.
4. Staff opens Biteship dashboard, reviews draft, clicks confirm.
5. Biteship internally creates a real Order with the same `reference_id`. Existing Biteship webhooks fire (`order.status`, `order.waybill_id`).
6. Our Biteship webhook handler looks up the row by `biteship_order_id` first. On miss, falls back to `reference_id = order_number`. On fallback hit, persists `biteship_order_id` for future webhooks.
7. Status mapping unchanged. `confirmed` → `processing`, etc.

### Schema

Schema changes must be applied in the **agr-ops** repo (`/Users/muhammadilham/Documents/GitHub/agr-ops`). This repo only consumes the columns. Required column:

```sql
-- Apply in agr-ops migration, not here.
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS biteship_draft_id TEXT;
```

`biteship_order_id` stays. Populated lazily on first webhook after staff confirms in dashboard.

No `shipping_status` column. Existing `status` enum already covers states (`paid` → `processing` after confirm).

After the migration ships, regenerate Supabase types in this repo (`lib/supabase/types.ts`) so the new column is type-safe.

### Code Changes

| File | Action | Notes |
|------|--------|-------|
| `lib/biteship/createOrder.ts` | Rename → `lib/biteship/createDraft.ts`. Export `createBiteshipDraft`. | Switch endpoint to `/v1/draft_orders`. Store `id` in `biteship_draft_id`. Update idempotency error mapping (`42211015` "Reference ID already taken") so a retry recovers existing draft via `GET /v1/draft_orders` lookup by `reference_id` if needed. |
| `app/api/webhooks/pivot/route.ts` | Replace `createBiteshipOrder` import + call with `createBiteshipDraft`. | Same call site, same fire-and-forget pattern. |
| `app/api/webhooks/biteship/route.ts` | Update lookup. Try `biteship_order_id` match first; on miss, fall back to `order_number = body.reference_id`. On fallback success, also `UPDATE ecom_orders SET biteship_order_id = body.order_id`. | Status mapping table unchanged. |
| `lib/actions/createDraftOrder.ts` | Delete. Orphan, unused. |  |
| `app/api/shipping/draft-order/route.ts` | Delete. Orphan, unused. |  |
| `__tests__/biteship-create-order.spec.ts` | Update / replace with `biteship-create-draft.spec.ts`. | Cover: draft creation, idempotent recovery on duplicate `reference_id`, no courier short-circuit, missing items error. |
| `docs/THIRD_PARTY_INTEGRATIONS.md` | Update Biteship section. | Replace "POST /orders" with "POST /v1/draft_orders" in the live flow. Add note that staff confirms drafts manually in Biteship dashboard. |

### Webhook Lookup Pseudocode

```ts
// Biteship webhook handler
const { order_id, reference_id, event, status } = body;

let row = await supabase
  .from('ecom_orders')
  .select('id, biteship_order_id')
  .eq('biteship_order_id', order_id)
  .maybeSingle();

if (!row.data && reference_id) {
  // Draft was just confirmed — order_id is new, look up by reference_id
  row = await supabase
    .from('ecom_orders')
    .select('id, biteship_order_id')
    .eq('order_number', reference_id)
    .maybeSingle();
  if (row.data) {
    await supabase
      .from('ecom_orders')
      .update({ biteship_order_id: order_id })
      .eq('id', row.data.id);
  }
}

if (!row.data) {
  console.warn(`[biteship-webhook] No order for biteship_order_id=${order_id} or reference_id=${reference_id}`);
  return ack();
}

// proceed with status / waybill update as today
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Webhook body may not include `reference_id` from Biteship | Test on staging before deploy. If absent, fallback path: poll `GET /v1/draft_orders/:draft_id` periodically until it returns a confirmed-state response with the new order id. Defer implementation until proven needed. |
| Draft expires before staff confirms | Verify Biteship draft TTL (docs unclear). If needed, surface a warning in Telegram notification or admin tooling. Defer. |
| Pivot retry creates duplicate draft | Existing `reference_id` uniqueness in Biteship returns error `42211015`. Handle: lookup existing draft by `reference_id`, store its id, treat as success. |
| Staff forgets to confirm draft | Out of scope v1. Telegram already notifies staff on payment. Add "draft pending review" reminder later if needed. |
| Refund issued before confirm | v1 leaves draft dangling. Staff manually deletes in dashboard. Build proper cancellation flow later. |

## Test Plan

- Unit: `createBiteshipDraft` happy path, no-courier short-circuit, no-items error, idempotent recovery.
- Integration: Pivot webhook → draft created → `biteship_draft_id` set, `biteship_order_id` null.
- Manual on staging: confirm draft in Biteship dashboard → verify Biteship webhook → verify `biteship_order_id` populated and `status='processing'`.
- Webhook regression: existing live-order flow tests still pass for orders that already have `biteship_order_id`.

## Rollout

Order matters: schema must exist before this code deploys.

1. Land migration in **agr-ops**: `ALTER TABLE ecom_orders ADD COLUMN biteship_draft_id TEXT`. Apply to production Supabase.
2. Regenerate Supabase types in this repo from updated schema.
3. Merge + deploy this repo. Single deploy. No feature flag (clean cutover; old `createBiteshipOrder` removed).
4. Existing in-flight orders with `biteship_order_id` already set keep working unchanged (webhook still matches by that column first).
