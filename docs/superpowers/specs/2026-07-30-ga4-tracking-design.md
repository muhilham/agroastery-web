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
| `page_view` | every route visit | automatic via `@next/third-parties` | no custom code |
| `view_item` | product detail viewed | `app/(root)/product/[slug]` → small client child | page is server component; needs client wrapper |
| `add_to_cart` | user adds a variant | `lib/hooks/useCart.ts` (choke point) | single spot, covers all add buttons |
| `begin_checkout` | checkout page opens | `app/(root)/checkout/page.tsx` (client, on mount) | value = cart total |
| `purchase` | payment success | `app/(root)/checkout/success` → client child | `transaction_id` = order_number; GA4 auto-dedupes |
| `book_consultation` | consultation booked | `app/(root)/konsultasi/sukses` → client child | custom event, separate funnel |

**Not in scope now** (easy to add later, YAGNI'd out):
`remove_from_cart`, `view_cart`, `add_shipping_info`, `add_payment_info`.

**Common payload:** every ecommerce event carries `currency: "IDR"`, `value`, and
`items[]` (item_id, item_name, price, quantity). Enables GA4 revenue reports + product
performance out of the box.

## Money handling

IDR has no decimal subunit. GA4 `value` is expressed in major currency units, so the
raw IDR integer is passed directly — **no division**. `currency` is always `"IDR"`.

## Purchase data flow + dedupe

Success page is server-rendered and already fetches the order. Plan:

1. Extend the server query on the success page to also select `total`, `order_number`,
   and line items from `ecom_order_items` (product_name, unit_price, quantity, variant_id).
2. Pass that data into a small client child component `<PurchaseTracking order={...} />`.
3. The child fires `purchase` once on mount:
   - `transaction_id` = `order_number`
   - `value` = `total`
   - `currency` = `"IDR"`
   - `items[]` = mapped line items
4. **Dedupe:** GA4 natively ignores a duplicate `purchase` sharing the same
   `transaction_id`, so a refresh or back-button navigation does not double-count revenue.
   No extra client guard required.

The consultation success page follows the same server→client-child pattern for
`book_consultation`.

## GA4 console setup (manual, done by owner)

1. analytics.google.com → Admin → **Create Property**
   (name "Agroastery", timezone Asia/Jakarta, currency IDR).
2. Add a **Web** data stream → URL `agroastery.com` → copy the **Measurement ID** (`G-XXXXXXXXXX`).
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
- GA4 **Realtime → DebugView** (append `?debug_mode` or use the GA Debugger extension).
- Walk the funnel: view product → add to cart → checkout → complete payment → book a
  consultation. Confirm each event lands with correct `value`, `currency`, and `items`.

**No env set:** wrapper silently no-ops; unit tests still pass.

## Files touched (anticipated)

- `package.json` — add `@next/third-parties`
- `app/layout.tsx` — mount `<GoogleAnalytics/>` (env-gated)
- `lib/analytics/gtag.ts` — new typed wrapper + tests
- `app/(root)/product/[slug]/` — client child fires `view_item`
- `lib/hooks/useCart.ts` — fire `add_to_cart`
- `app/(root)/checkout/page.tsx` — fire `begin_checkout`
- `app/(root)/checkout/success/` — server query extend + `<PurchaseTracking/>` client child
- `app/(root)/konsultasi/sukses/` — `<ConsultationTracking/>` client child
- `.env.example` — document `NEXT_PUBLIC_GA_MEASUREMENT_ID`
