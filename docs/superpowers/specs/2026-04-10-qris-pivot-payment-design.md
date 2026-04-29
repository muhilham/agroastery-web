# QRIS Payment via Pivot — Design Spec

**Date:** 2026-04-10
**Status:** Approved

## Overview

Replace Xendit as the payment provider with Pivot's QRIS payment method. Customers will scan a dynamic QR code displayed on a dedicated payment page. The entire Xendit integration (invoice creation, popup widget, webhook) is removed and replaced with Pivot's Payment Session API.

## Payment Flow

1. User fills checkout form → `POST /api/checkout`
2. Server validates cart, stock, and prices; creates `ecom_orders` row; calls Pivot `POST /v2/payments` with `paymentMethod.type: "QR"`, `mode: "API"`, QR expiry 15 minutes
3. Pivot returns `paymentSessionId` + `chargeDetails[0].qr.qrUrl`
4. Server stores `pivot_payment_session_id`, `pivot_qr_url`, `pivot_qr_expires_at` on the order; returns `{ orderId }` to client
5. Frontend redirects to `/checkout/payment/[orderId]`
6. Payment page displays the QR image; client polls `/api/orders/[orderId]/status` every 3 seconds
7. Pivot sends `PAYMENT.PAID` callback to `/api/webhooks/pivot` → server verifies `X-API-Key` → updates `payment_status: 'paid'`, `status: 'processing'`
8. Polling detects `paid` → clears cart → redirects to `/checkout/success?order=[orderId]`
9. If QR expires → "Refresh QR" button → `POST /api/checkout/refresh-qr` → creates new Pivot session → returns new `qrUrl` + `qrExpiresAt` (no page reload)

## Files

### New
| File | Purpose |
|------|---------|
| `lib/pivot/client.ts` | Pivot API wrapper: token cache, `createQrisPaymentSession()`, `getPaymentSession()` |
| `app/api/webhooks/pivot/route.ts` | Callback handler — verifies `X-API-Key`, handles `PAYMENT.PAID` and `PAYMENT.EXPIRED` |
| `app/api/checkout/refresh-qr/route.ts` | Creates new Pivot session for an existing `pending_payment` order |
| `app/api/orders/[orderId]/status/route.ts` | Returns `{ payment_status, status }` for client polling |
| `app/(root)/checkout/payment/[orderId]/page.tsx` | QR display page with countdown, refresh, and polling |

### Modified
| File | Change |
|------|--------|
| `app/api/checkout/route.ts` | Replace Xendit invoice creation with Pivot session creation |
| `app/(root)/checkout/page.tsx` | Remove Xendit script tag; redirect to `/checkout/payment/[orderId]` on success |

### Deleted
- `lib/xendit/client.ts`
- `lib/xendit/webhook.ts`
- `app/api/webhooks/xendit/route.ts`

## Database Migration

```sql
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_payment_session_id TEXT;
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_qr_url TEXT;
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_qr_expires_at TIMESTAMPTZ;
CREATE INDEX idx_ecom_orders_pivot ON ecom_orders(pivot_payment_session_id);
```

`pivot_qr_url` and `pivot_qr_expires_at` are stored so the payment page can render the QR code without an extra Pivot API call on every load. Both are updated on refresh too.

The existing `xendit_invoice_id` column is left as-is (nullable, unused going forward — safe for existing rows).

## Pivot API Client (`lib/pivot/client.ts`)

**Token management:**
- Module-level cache: `{ token: string, expiresAt: number }`
- Before every API call, check if token expires within 60 seconds — fetch a new one if so
- `POST /v1/access-token` with `X-MERCHANT-ID` + `X-MERCHANT-SECRET` headers and `{ grantType: "client_credentials" }` body

**`createQrisPaymentSession(params)`:**
- `POST /v2/payments`
- `paymentMethod.type: "QR"`, `mode: "API"`, `paymentType: "SINGLE"`
- `paymentMethodOptions.qr.expiryAt` set to 15 minutes from now
- `X-REQUEST-ID` header: use `orderId` (UUID, 36 chars, alphanumeric with hyphens — strip hyphens to meet Pivot's alphanumeric requirement)
- Returns `{ paymentSessionId, qrUrl, qrExpiresAt }`

## Webhook Handler (`app/api/webhooks/pivot/route.ts`)

**Verification:** Compare `X-API-Key` request header against `PIVOT_CALLBACK_API_KEY` env var using `crypto.timingSafeEqual`.

**Events handled:**
- `PAYMENT.PAID` → update order: `payment_status: 'paid'`, `status: 'processing'`, `paid_at: now`, `xendit_payment_method: 'QRIS'` (reuse existing column). Idempotent — skip if already `paid`.
- `PAYMENT.EXPIRED` / `PAYMENT.CANCELLED` → update order: `payment_status: 'expired'`, `status: 'cancelled'`. Restore stock. Idempotent — skip if already in terminal state.

**Order lookup:** Match by `pivot_payment_session_id = data.id` from callback body.

## Polling Endpoint (`/api/orders/[orderId]/status`)

- `GET` route, no auth required
- Returns only `{ payment_status, status }` — no sensitive fields
- Order ID is UUID (unguessable) — sufficient security for status-only data

## QR Payment Page (`/checkout/payment/[orderId]`)

**Server component** fetches order from DB: order number, total, `pivot_qr_url`, `pivot_qr_expires_at`. Passes to client component. No extra Pivot API call needed on page load.

**Client component behavior:**
- Displays: order number, total amount, QR code image, countdown timer
- Polls `/api/orders/[orderId]/status` every 3 seconds
- On `paid` → clear cart → redirect to `/checkout/success?order=[orderId]`
- On `cancelled`/`expired` → show error message + link back to `/checkout`
- If already `paid` on initial load → redirect immediately
- When countdown hits 0 (or < 30s remain): show "Refresh QR" button
- Refresh: `POST /api/checkout/refresh-qr` → replace QR image + reset countdown in-place

## Refresh QR Endpoint (`/api/checkout/refresh-qr`)

- Validates `orderId` in body
- Fetches order from DB — rejects if `payment_status` is not `pending_payment`
- Creates new Pivot session (new `X-REQUEST-ID` = `orderId + timestamp` trimmed to 36 chars, alphanumeric only)
- Updates `pivot_payment_session_id`, `pivot_qr_url`, `pivot_qr_expires_at` on order
- Returns `{ qrUrl, qrExpiresAt }`

## Auth & Security

**Pivot credentials (server-side only):**
```env
PIVOT_MERCHANT_ID=...
PIVOT_MERCHANT_SECRET=...
PIVOT_CALLBACK_API_KEY=...
PIVOT_API_URL=https://api.pivot-payment.com  # https://api-stg.pivot-payment.com for sandbox
```

**Removed env vars:** `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_TOKEN`, `NEXT_PUBLIC_XENDIT_PUBLIC_KEY`

**Callback security:** `timingSafeEqual` comparison of `X-API-Key` header prevents timing attacks.

**Polling security:** UUID order IDs are unguessable; only `payment_status` + `status` are returned (no PII).

## Local Development

### Environment (`.env.local`)
```env
PIVOT_MERCHANT_ID=your_sandbox_merchant_id
PIVOT_MERCHANT_SECRET=your_sandbox_merchant_secret
PIVOT_CALLBACK_API_KEY=your_sandbox_callback_api_key
PIVOT_API_URL=https://api-stg.pivot-payment.com
```

### Option 1 — ngrok tunnel (full callback flow)
1. `npx ngrok http 3000` → get a public URL, e.g. `https://abc123.ngrok-free.app`
2. Register `https://abc123.ngrok-free.app/api/webhooks/pivot` in Pivot sandbox dashboard (**Developer Settings → Callbacks**)
3. Use Pivot's simulation endpoint to trigger a payment without real QR scan:
   ```
   POST https://api-stg.pivot-payment.com/v2/payments/simulations
   ```
   with the `paymentSessionId` to mark it as paid — Pivot fires the callback to your ngrok URL.
4. Note: free ngrok URLs change every session — re-register in the dashboard each time.

### Option 2 — Dev manual trigger (no tunnel needed)
Add a dev-only API route `POST /api/dev/simulate-payment` guarded by `NODE_ENV !== 'production'`. It accepts `{ orderId }` and directly sets `payment_status: 'paid'`, `status: 'processing'` on the order in the DB. The payment page's polling detects it and redirects as normal — letting you test the full frontend flow without Pivot reaching your machine.

This route must **not** be deployed to production (enforce with a build-time check or middleware guard).

### Recommended workflow
- Use **Option 2** for day-to-day frontend development (fastest iteration)
- Use **Option 1 + Pivot simulation** when testing the actual webhook handler code

---

## Pivot Dashboard Setup Required

Before going live, register the callback URL in:
**Dashboard → Setting → Developer Settings → Callbacks**

Set callback URL to: `https://agroastery.com/api/webhooks/pivot`

Note the **Callback API Key** shown there — this goes into `PIVOT_CALLBACK_API_KEY`.
