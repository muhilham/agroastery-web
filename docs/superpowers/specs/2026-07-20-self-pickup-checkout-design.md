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
| `shipping_address` | customer address snapshot | `{ type: "pickup", location: <env pickup address/hours> }` (satisfies existing NOT NULL) |
| `tracking_number` | courier tracking | `null` |
| `status` | `pending_payment → paid → processing → shipped → delivered` | `pending_payment → paid → processing → ready_for_pickup → completed` |

`status` is a free-form TEXT column already (not a DB enum), so introducing `ready_for_pickup` and `completed` values requires no schema migration — only the ops admin panel needs a small update to recognize/offer these new status strings (flagged as an external dependency, not part of this repo's work).

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

## Order detail page (`orders/[id]`) & order email (`lib/resend/sendOrderEmail.ts`)

- When `shipping_courier === "pickup"`: show pickup location/hours and the `ready_for_pickup`/`completed` status labels instead of courier/tracking-number UI.
- Order confirmation email branches the same way — pickup template omits courier/tracking lines, shows pickup info instead.

## Out of scope / unaffected

- `lib/jubelio/orders.ts` auto-sync: uses line items only, not shipping fields — no change needed.
- Stock validation, guest checkout, idempotency: unchanged.
- Ops admin panel changes to support the two new status values — external dependency, not implemented in this repo.

## Testing

- `checkoutSchemas.test.ts`: pickup mode passes without address/postalCode; delivery mode still requires them; missing `fulfillmentMethod` rejected.
- Checkout API route test: pickup order never calls Biteship; asserts `shipping_cost=0`, `shipping_courier="pickup"`, `shipping_address` snapshot shape.
- Order email test: snapshot pickup vs delivery template variants.
- Manual: full pickup checkout in browser — toggle → submit → Pivot pay → success page → order detail shows pickup info.
