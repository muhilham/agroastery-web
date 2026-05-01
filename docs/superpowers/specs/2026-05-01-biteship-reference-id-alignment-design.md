# Biteship `reference_id` UUID Alignment

**Date:** 2026-05-01  
**Status:** Approved

## Problem

`reference_id` sent to Biteship draft orders uses `order_number` (e.g. `AGR-20260319-XXXX`), while Pivot uses `orderId` UUID (dashes stripped). Inconsistent reference identifiers across third-party systems make cross-system tracing require the DB as an intermediary.

## Goal

Single canonical reference ID across all third-party integrations: `ecom_orders.id` (UUID). Any webhook from any provider maps directly to the DB primary key.

## Decision

Use `orderId` (UUID) as `reference_id` in Biteship draft order payload. Pivot already uses `orderId` — no Pivot changes needed.

## Changes

### 1. `lib/biteship/createDraft.ts`

**Payload field:**
```typescript
// Before
reference_id: order.order_number,

// After
reference_id: orderId,
```

**Idempotent recovery URL:**
```typescript
// Before
`/v1/draft_orders?reference_id=${encodeURIComponent(order.order_number)}`

// After
`/v1/draft_orders?reference_id=${encodeURIComponent(orderId)}`
```

### 2. `app/api/webhooks/biteship/route.ts`

Fallback lookup (when `biteship_order_id` not yet stored) matches `reference_id` against DB:

```typescript
// Before
.eq("order_number", biteshipWebhookReferenceId)

// After
.eq("id", biteshipWebhookReferenceId)
```

### 3. `__tests__/biteship-create-draft.spec.ts`

Update assertions: `reference_id` in payload must equal `orderId` UUID, not `order_number`.

### 4. `__tests__/biteship-webhook.spec.ts`

Update fallback test: mock `reference_id` with UUID, assert lookup is by `id` column.

## Out of Scope

- Pivot changes — already uses UUID
- DB migrations — no schema changes
- Biteship webhook lazy-persist of `biteship_order_id` — unchanged
- `statementDescriptor: orderNumber` in Pivot — keep as human-readable label, not a reference key

## Reference ID Map (post-change)

| System   | Field               | Value          | DB lookup         |
|----------|---------------------|----------------|-------------------|
| Pivot    | `clientReferenceId` | UUID no dashes | `WHERE id = ...`  |
| Biteship | `reference_id`      | UUID with dashes | `WHERE id = ...` |
