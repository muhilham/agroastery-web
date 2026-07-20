# Self-Pickup Checkout — Design Spec

## Problem

Customers bounce at checkout when shipping cost is high, then find cheaper shipping outside the platform. Adding a self-pickup option (zero shipping cost) removes that friction for customers near the roastery.

## Scope

Single fixed pickup location (the Agroastery roastery). No pickup date/time slots — customer picks "Self Pickup" at checkout, staff preps the order and updates status via the ops admin panel (separate repo) when ready. No automated "ready for pickup" notification in v1 — customer checks the order detail page manually.

## Data model — no migration required

Reuse existing `ecom_orders` columns instead of adding a new column, per the "migrations live in agr-ops repo" constraint. A pickup order is encoded as:

| Column | Delivery order | Pickup order |
|---|---|---|
| `shipping_courier` | e.g. `"jne"` | `"pickup"` |
| `shipping_service` | e.g. `"REG"` | `null` |
| `shipping_cost` | Biteship rate | `0` |
| `shipping_etd` | e.g. `"2-3 days"` | `null` |
| `biteship_order_id` | Biteship draft ID | `null` |
| `shipping_address` | customer address snapshot | `{ type: "pickup", recipient_name, phone, address_line: <pickup location text>, hours: <pickup hours> }` (satisfies existing NOT NULL) |
| `tracking_number` | courier tracking | `null` |
| `status` | `pending_payment → paid → processing → shipped → delivered` | `pending_payment → paid → processing → ready_for_pickup → completed` |

`status` is a free-form TEXT column already (not a DB enum), so introducing `ready_for_pickup` and `completed` values requires no schema migration — only the ops admin panel needs a small update to recognize/offer these new status strings (flagged as an external dependency, not part of this repo's work).

**`shipping_address` shape note:** `recipient_name`/`phone` are still the *customer's*, `address_line` holds the *pickup location* text (not the customer's home address) — every existing read path (order detail, tracking page, email template, checkout-time Telegram alert) already destructures `recipient_name`/`address_line` off this object, so reusing those exact keys means those templates render correctly with zero shape-handling changes. Only the courier/tracking *label* logic (which says "Kurir: ...") still needs an explicit `shipping_courier === "pickup"` branch, since there's no courier to name.

## Checkout UI (`app/(root)/checkout/page.tsx`)

- Add a toggle: "Kirim" (Delivery) / "Ambil Sendiri" (Self Pickup), only shown if `NEXT_PUBLIC_PICKUP_ADDRESS` and `NEXT_PUBLIC_PICKUP_HOURS` are both set (feature auto-hides if unconfigured).
- Pickup selected:
  - Hide address input, map picker, postal code, Biteship rate-selection step.
  - Show a static card with pickup location address + hours from env vars.
  - Order total = subtotal only (no shipping line).
- Delivery selected: unchanged existing flow.

## Form validation (`checkoutSchemas.ts`)

- Add `fulfillmentMethod: z.enum(["delivery", "pickup"])` to `baseSchema`.
- Replace unconditional `address`/`postalCode`/`lat`/`lng` requirements with `superRefine`: required only when `fulfillmentMethod === "delivery"`. Optional (and ignored) when `"pickup"`.

## Checkout API (`app/api/checkout/route.ts`)

- Branch on `fulfillmentMethod` early:
  - **Pickup**: skip Biteship rate-check and draft-creation calls entirely. Set the column values per the table above. `total = subtotal`.
  - **Delivery**: unchanged existing Biteship flow.
- Pivot payment invoice creation is identical for both paths (pay-online-upfront, per decision — no COD).
- **Fix required (L185):** the existing guard `if (data.shippingCost === 0 && data.shippingCourier && totalShipWeight > 0) → INVALID_SHIPPING_COST` rejects every pickup order as-is (cost is legitimately 0 with a courier value and nonzero weight). Add an exemption: skip this check entirely when `fulfillmentMethod === "pickup"`.
- `sendOrderNotification` (checkout-time Telegram alert) is called from this route with `shippingAddress` — with the shape fix above (`address_line` = pickup location text) it renders correctly with no code change, but the "Kurir: ..." line still needs a `fulfillmentMethod === "pickup"` branch to say "Ambil Sendiri" instead of naming a courier.

## Checkout page (`app/(root)/checkout/page.tsx`)

- **Fix required (L252):** `if (!selectedShipping) { setSubmitError(...); return; }` blocks form submission unconditionally — pickup mode never has a `selectedShipping` rate. Exempt this check when `fulfillmentMethod === "pickup"`.
- **Fix required (L763/774):** the submit button's `isDisabled`/`disabled` conditions include `!selectedShipping` — same exemption needed there.
- Bottom bar total (L744, currently `selectedShipping ? numberToIdr(shippingCost) : "-"`) should show subtotal only for pickup, no shipping line.

## Pivot webhook (`app/api/webhooks/pivot/route.ts`)

- Calls `createBiteshipDraft(orderId)` fire-and-forget after payment (L102). Verified: `createDraft.ts` (L34) already early-returns without throwing when `!shipping_courier || !shipping_service`, and pickup orders have `shipping_service = null` — so the promise resolves, `.catch()` never fires, and **no false "BITESHIP GAGAL" Telegram alert is sent**. No fix required for correctness. Optional nit: add an explicit `if (updatedOrder.shipping_courier !== "pickup")` guard before the call, purely to skip a wasted DB round-trip — not blocking.

## Order detail page (`app/(root)/orders/[id]/page.tsx`)

- Add `ready_for_pickup` and `completed` entries to `STATUS_LABELS` and `STATUS_COLORS` (L9–27) — without this the raw status string still renders (no crash), just unstyled/untranslated.
- Shipping info card (L132–166) currently renders whenever `shipping_courier || tracking_number || biteship_order_id` is truthy — true for pickup since `shipping_courier = "pickup"`. Branch this card: when `shipping_courier === "pickup"`, render a "Ambil Sendiri" card (location/hours from `shipping_address.address_line`/`.hours`) instead of the "Kurir: ..." / tracking-number block.

## Tracking page (`app/(root)/track/[orderId]/page.tsx` + `app/api/orders/[orderId]/tracking/route.ts`)

- The API route already handles missing tracking data gracefully — `if (!biteship_order_id || !tracking_number || !shipping_courier) return { dispatched: false, status, tracking: null }` — verified this does **not** error for pickup orders (reviewer's claim of an API error was checked and is incorrect).
- The page component still needs a branch: it shows `Kurir: {shipping_courier.toUpperCase()}` (L89–93) which would render "Kurir: PICKUP" — replace with a pickup-specific view (location/hours, no courier/tracking UI, no `TrackingTimeline`) when `shipping_courier === "pickup"`.

## Order confirmation email (`lib/resend/templates/OrderConfirmation.tsx`)

- With the `shipping_address` shape fix, `recipient_name`/`address_line` render correctly with no change. Still needs a branch for the courier-specific copy: "Shipping (COURIER)" line and "Track My Order →" CTA should read "Self Pickup" / pickup location and link to the order detail page instead of the tracking page when `shipping_courier === "pickup"`.

## Checkout success page (`app/(root)/checkout/success/page.tsx`)

- Copy branch: "Your coffee is on its way" / "Track My Order" CTA are wrong for pickup — swap to pickup-appropriate copy ("Pesanan siap diambil setelah diproses" style) and link to order detail instead of tracking when `fulfillmentMethod === "pickup"`.

## Environment variables

Add to `.env.example`: `NEXT_PUBLIC_PICKUP_ADDRESS`, `NEXT_PUBLIC_PICKUP_HOURS`.

## Out of scope / unaffected

- `lib/jubelio/orders.ts` auto-sync: uses line items only, not shipping fields — no change needed.
- Stock validation, guest checkout, idempotency: unchanged.
- Ops admin panel changes to support the two new status values — external dependency, not implemented in this repo.

## Testing

- `checkoutSchemas.test.ts`: pickup mode passes without address/postalCode; delivery mode still requires them; missing `fulfillmentMethod` rejected.
- Checkout API route test: pickup order never calls Biteship; asserts `shipping_cost=0`, `shipping_courier="pickup"`, `shipping_address` snapshot shape; asserts `INVALID_SHIPPING_COST` guard does NOT fire for pickup.
- Checkout page test/manual: submit succeeds in pickup mode with no `selectedShipping`.
- Pivot webhook test: confirm no Telegram alert fires when `createBiteshipDraft` is called on a pickup order (regression test for the already-safe early-return path).
- Order detail / tracking page test: pickup order renders location/hours card, no "Kurir: PICKUP" or crash on missing courier fields.
- Order email test: snapshot pickup vs delivery template variants.
- Manual: full pickup checkout in browser — toggle → submit → Pivot pay → success page → order detail → tracking page all show pickup info correctly.
