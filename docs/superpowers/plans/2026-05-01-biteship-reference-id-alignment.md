# Biteship `reference_id` UUID Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `order_number` with `orderId` (UUID) as the `reference_id` sent to Biteship draft orders, matching the canonical identifier already used by Pivot.

**Architecture:** Two files change: `createDraft.ts` sends UUID instead of order_number; `biteship/route.ts` fallback lookup queries `ecom_orders.id` instead of `ecom_orders.order_number`. Tests updated to match new contract.

**Tech Stack:** TypeScript, Vitest, Next.js Route Handlers, Supabase admin client, Biteship REST API

---

## File Map

| File | Change |
|------|--------|
| `lib/biteship/createDraft.ts` | `reference_id` payload field + idempotent recovery URL + find condition |
| `app/api/webhooks/biteship/route.ts` | Fallback `.eq('order_number', ...)` → `.eq('id', ...)` |
| `__tests__/biteship-create-draft.spec.ts` | Update 2 assertions + 1 mock value |
| `__tests__/biteship-webhook.spec.ts` | Update `reference_id` value in fallback test |

---

### Task 1: Update `createDraft` tests to expect UUID `reference_id`

**Files:**
- Modify: `__tests__/biteship-create-draft.spec.ts`

- [ ] **Step 1: Update happy path assertion**

In the `'calls POST /v1/draft_orders and stores biteship_draft_id'` test, change:
```typescript
expect(payload.reference_id).toBe('AGR-20260427-ABC');
```
to:
```typescript
expect(payload.reference_id).toBe('order-1');
```

- [ ] **Step 2: Update idempotent recovery URL assertion**

In the `'recovers idempotently when reference_id already exists (42211015)'` test, change:
```typescript
expect(mockFetch.mock.calls[1][0]).toContain('/v1/draft_orders?reference_id=AGR-20260427-ABC');
```
to:
```typescript
expect(mockFetch.mock.calls[1][0]).toContain('/v1/draft_orders?reference_id=order-1');
```

- [ ] **Step 3: Update idempotent recovery mock response**

In the same test, change the mock lookup response:
```typescript
// Before
json: async () => ({
  success: true,
  drafts: [{ id: 'bs-draft-existing', reference_id: 'AGR-20260427-ABC' }],
}),

// After
json: async () => ({
  success: true,
  drafts: [{ id: 'bs-draft-existing', reference_id: 'order-1' }],
}),
```

- [ ] **Step 4: Run tests to confirm they now fail**

```bash
npm test -- --reporter=verbose --testPathPattern=biteship-create-draft
```
Expected: FAIL — `AssertionError: expected 'AGR-20260427-ABC' to be 'order-1'`

---

### Task 2: Update `createDraft.ts` to send UUID as `reference_id`

**Files:**
- Modify: `lib/biteship/createDraft.ts`

- [ ] **Step 1: Change payload `reference_id` field**

In the `payload` object (around line 83), change:
```typescript
reference_id: order.order_number,
```
to:
```typescript
reference_id: orderId,
```

- [ ] **Step 2: Change idempotent recovery lookup URL**

In the error `42211015` block, change:
```typescript
const lookupRes = await fetch(
  `https://api.biteship.com/v1/draft_orders?reference_id=${encodeURIComponent(order.order_number)}`,
  { method: 'GET', headers }
);
```
to:
```typescript
const lookupRes = await fetch(
  `https://api.biteship.com/v1/draft_orders?reference_id=${encodeURIComponent(orderId)}`,
  { method: 'GET', headers }
);
```

- [ ] **Step 3: Change idempotent recovery `find` condition**

In the same block, change:
```typescript
const found = lookup.drafts?.find((d) => d.reference_id === order.order_number);
if (!found?.id) {
  throw new Error(
    `[createBiteshipDraft] Reference ID ${order.order_number} taken but lookup found no matching draft`
  );
}
```
to:
```typescript
const found = lookup.drafts?.find((d) => d.reference_id === orderId);
if (!found?.id) {
  throw new Error(
    `[createBiteshipDraft] Reference ID ${orderId} taken but lookup found no matching draft`
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose --testPathPattern=biteship-create-draft
```
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add lib/biteship/createDraft.ts __tests__/biteship-create-draft.spec.ts
git commit -m "feat(biteship): use orderId UUID as reference_id in draft order payload"
```

---

### Task 3: Update webhook fallback lookup to match by `id`

**Files:**
- Modify: `app/api/webhooks/biteship/route.ts`
- Modify: `__tests__/biteship-webhook.spec.ts`

- [ ] **Step 1: Update webhook fallback test — `reference_id` value**

In `'falls back to reference_id lookup when biteship_order_id miss, then persists order_id'`, change the request body:
```typescript
// Before
reference_id: 'AGR-20260427-ABC',

// After
reference_id: 'ecom-order-uuid-99',
```

- [ ] **Step 2: Run webhook tests to confirm the fallback test still passes**

The test mocks DB calls directly and doesn't assert the `.eq()` column name, so this change is cosmetic — it should still pass. Confirm:

```bash
npm test -- --reporter=verbose --testPathPattern=biteship-webhook
```
Expected: PASS — all 8 tests green (mock doesn't inspect `.eq()` args)

- [ ] **Step 3: Update webhook fallback lookup column in `route.ts`**

In `app/api/webhooks/biteship/route.ts`, inside `applyUpdate()`, change:
```typescript
const byRef = await supabase
  .from('ecom_orders')
  .update(update)
  .eq('order_number', referenceId)
  .select('id')
  .single();
if (!byRef.data) {
  console.warn(
    `[biteship-webhook] No order found for biteship_order_id=${bsOrderId} or reference_id=${referenceId} (${label})`
  );
  return false;
}
```
to:
```typescript
const byRef = await supabase
  .from('ecom_orders')
  .update(update)
  .eq('id', referenceId)
  .select('id')
  .single();
if (!byRef.data) {
  console.warn(
    `[biteship-webhook] No order found for biteship_order_id=${bsOrderId} or reference_id=${referenceId} (${label})`
  );
  return false;
}
```

- [ ] **Step 4: Run all Biteship tests**

```bash
npm test -- --reporter=verbose --testPathPattern=biteship
```
Expected: PASS — all tests across `biteship-create-draft`, `biteship-webhook`, `biteship-tracking` green

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/biteship/route.ts __tests__/biteship-webhook.spec.ts
git commit -m "feat(biteship): fallback webhook lookup by order id instead of order_number"
```
