# GA4 Tracking — Design Spec

**Date:** 2026-07-30
**Branch:** `feat/ga4-tracking`
**Status:** Approved, ready for implementation plan

## Goal

Add Google Analytics 4 to the Agroastery e-commerce web app: automatic pageviews
plus the full ecommerce funnel (view item → add to cart → begin checkout → purchase)
with real IDR revenue, and a separate consultation-booking event.

## Scope decisions

- **Level:** pageviews **+** ecommerce events (full funnel).
- **Property:** none exists yet — spec includes GA4 console setup steps.
- **Consent banner:** none. Track all visitors immediately (Indonesia PDP has no hard
  cookie-banner mandate; store is ID-focused). Consent can be added later if EU expansion happens.
- **Library:** `@next/third-parties/google` (official Next helper) — handles script
  injection + route-change pageviews, works on Railway (not Vercel-specific).

## Architecture

```
NEXT_PUBLIC_GA_MEASUREMENT_ID  (env, e.g. G-XXXXXXXXXX)
        │
app/layout.tsx  ──►  <GoogleAnalytics gaId={id}/>   (rendered only when env is set)
        │                → loads gtag.js, auto page_view on every route change
        ▼
lib/analytics/gtag.ts   — typed wrapper (single source of truth for all events)
   • trackEvent(name, params)      no-op when window.gtag is absent
   • cartItemToGA4(item)           CartItem → GA4 item shape
   • trackViewItem(...)
   • trackAddToCart(...)
   • trackBeginCheckout(...)
   • trackPurchase(...)
   • trackBookConsultation(...)
        ▲
   called from funnel components (client side only)
```

**Principles**

- GA must never crash the app. The wrapper checks `typeof window.gtag === "function"`
  and silently no-ops otherwise. Dev/preview without the env var = zero tracking, zero errors.
- All event code goes through `lib/analytics/gtag.ts`. No loose `window.gtag` calls
  scattered across components. One file to audit, typed params.
- `<GoogleAnalytics/>` renders only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is present.

## Events & fire points

| GA4 event | Fires when | File / location | Notes |
|---|---|---|---|
| `page_view` | every route visit | automatic via `@next/third-parties` | needs enhanced measurement on (default) for client route changes |
| `view_item` | product detail viewed | `components/section/product-detail/SupabaseProductDetail.tsx` (already `"use client"`) | fire in `useEffect` keyed on `product.slug`; no new wrapper |
| `add_to_cart` | user adds a variant | `addToCart()` in `lib/stores/cart.ts:87` | real choke point (`useCart` is a pass-through); also covers buy-now path |
| `begin_checkout` | cart hydrated + non-empty on checkout | `app/(root)/checkout/page.tsx` (client) | fire once when `hydrated && cartCount > 0`, not on bare mount |
| `purchase` | payment success **and** order paid | `app/(root)/checkout/success` → client child | gate on `payment_status === "paid"`; `transaction_id` = order_number; GA4 auto-dedupes |
| `book_consultation` | consultation booked **and** confirmed | `app/(root)/konsultasi/sukses` → client child | gate on `status === "confirmed"`; custom event → needs own dedupe guard (see below) |

**Not in scope now** (easy to add later, YAGNI'd out):
`remove_from_cart`, `view_cart`, `add_shipping_info`, `add_payment_info`.

**Common payload:** every ecommerce event carries `currency: "IDR"`, `value`, and
`items[]` (item_id, item_name, price, quantity). Enables GA4 revenue reports + product
performance out of the box.

**`view_item` semantics:** `item_id` = the default/matched variant for the slug. Fire
once per product view (keyed on `product.slug`); do **not** refire when the user switches
variant selection — keeps view counts honest.

**Gating (data integrity):** the success pages render for any constructible order/booking
URL. Only render the tracking child (and fire the event) when the record is confirmed paid:
`purchase` requires `payment_status === "paid"`, `book_consultation` requires
`status === "confirmed"`. Never fire on unpaid/pending records.

## Money handling

IDR has no decimal subunit. GA4 `value` is expressed in major currency units, so the
raw IDR integer is passed directly — **no division**. `currency` is always `"IDR"`.

## Purchase data flow + dedupe

Success page is server-rendered and already fetches the order (currently selects only
`order_number, customer_email, shipping_courier`). Plan:

1. Extend the server query to also select `payment_status`, `total`, `shipping_cost`,
   and line items from `ecom_order_items` (product_name, unit_price, quantity, variant_id).
2. Render `<PurchaseTracking order={...} />` **only when `payment_status === "paid"`
   and the order data actually loaded** — never with a missing/empty `order_number`.
3. The child fires `purchase` once on mount:
   - `transaction_id` = `order_number` (never an empty string — all empty IDs collapse
     into one deduped transaction in GA4)
   - `value` = `total`
   - `currency` = `"IDR"`
   - `shipping` = `shipping_cost` (so item revenue vs. shipping split correctly in reports)
   - `items[]` = mapped line items
4. **Dedupe:** GA4 natively ignores a duplicate `purchase` sharing the same
   `transaction_id`, so a refresh or back-button navigation does not double-count revenue.
   No extra client guard required. (Confirmed: transaction-ID dedupe is `purchase`-only.)

### Consultation success → `book_consultation`

Same server→client-child pattern, but with two differences:

1. **Gate:** render the tracking child only when `status === "confirmed"`. The sukses
   page already selects `status`.
2. **Dedupe is NOT automatic.** transaction-ID dedupe applies to `purchase` only; a custom
   event double-counts on refresh/back-nav. Guard with `sessionStorage` keyed on the
   booking id (fire once per booking per session).

Payload: `book_consultation` with `value` = `consultation_bookings.amount`,
`currency: "IDR"` (so it can be marked a key event with a monetary value).

> Alternative (future): model consultations as a second `purchase` with
> `item_name: "Consultation"` to get transaction-ID dedupe + revenue reporting for free.
> Rejected for now because it mixes consultation revenue into coffee-sales `purchase`
> reports, against the separate-funnel design.

### Known client-side limitation

Client-fired events are lost if the user closes the tab immediately after paying (before
the success redirect) or runs an ad blocker. Acceptable for v1. Future hardening: fire
`purchase` server-side via GA4 Measurement Protocol from the payment webhook — the shared
`transaction_id` still dedupes against the client event.

## GA4 console setup (manual, done by owner)

1. analytics.google.com → Admin → **Create Property**
   (name "Agroastery", timezone Asia/Jakarta, currency IDR).
2. Add a **Web** data stream → URL `agroastery.com` → copy the **Measurement ID** (`G-XXXXXXXXXX`).
   Confirm **Enhanced measurement** is ON (default) — its history-events tracking is what
   produces `page_view` on client-side (App Router) route changes.
3. Set env var in Railway **and** local:
   - `.env.local`: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
   - Railway service variables: same key/value
   - Add the key (empty/example value) to `.env.example`
4. In GA4 UI, mark `purchase` and `book_consultation` as **key events** (conversions).

## Testing & verification

**Unit (Vitest) — `lib/analytics/gtag.ts`:**
- `trackEvent` no-ops when `window.gtag` is undefined (no throw).
- `cartItemToGA4` maps CartItem fields to the correct GA4 item shape.
- Each helper (`trackViewItem`, `trackAddToCart`, `trackBeginCheckout`, `trackPurchase`,
  `trackBookConsultation`) calls `window.gtag` with the expected event name + payload
  (mock `window.gtag`, assert call args).

**Manual:**
- GA4 **Realtime → DebugView**. Enable debug via the **Tag Assistant**, the **GA Debugger**
  Chrome extension, or `debug_mode: true` in the gtag config (there is no `?debug_mode`
  URL param).
- Walk the funnel: view product → add to cart → checkout → complete payment → book a
  consultation. Confirm each event lands with correct `value`, `currency`, and `items`,
  and that `purchase`/`book_consultation` do NOT fire on unpaid records or refire on refresh.

**No env set:** wrapper silently no-ops; unit tests still pass.

## Files touched (anticipated)

- `package.json` — add `@next/third-parties`
- `app/layout.tsx` — mount `<GoogleAnalytics/>` (env-gated)
- `lib/analytics/gtag.ts` — new typed wrapper + tests
- `components/section/product-detail/SupabaseProductDetail.tsx` — `useEffect` fires `view_item`
- `lib/stores/cart.ts` — fire `add_to_cart` in `addToCart()`
- `app/(root)/checkout/page.tsx` — fire `begin_checkout` when hydrated + non-empty
- `app/(root)/checkout/success/` — extend server query (+`payment_status`, `shipping_cost`, items) + `<PurchaseTracking/>` client child, paid-gated
- `app/(root)/konsultasi/sukses/` — `<ConsultationTracking/>` client child, confirmed-gated + sessionStorage dedupe
- `.env.example` — document `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `AGENTS.md` — document new `lib/analytics/` dir + the env var (repo convention)
