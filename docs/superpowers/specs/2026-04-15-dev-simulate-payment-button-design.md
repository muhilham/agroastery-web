# Dev: Simulate Payment Button

**Date:** 2026-04-15
**Scope:** Local development only

## Goal

Add a button on the QR payment page that triggers a simulated payment, so developers can test the payment→success flow without scanning a real QRIS code.

## Constraints

- Visible and functional only when `NODE_ENV === "development"`
- Tree-shaken from production builds (no bundle impact)
- No new env vars, no Railway config changes needed

## Design

### Location

`app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`

### Behavior

1. Button renders below the QR code block, wrapped in `{process.env.NODE_ENV === "development" && ...}`
2. On click, POSTs to `/api/dev/simulate-payment` with `{ orderId }`
3. Button disables itself while the request is in flight
4. On success: the existing 3-second polling loop detects `payment_status: "paid"` and redirects to the success page — no extra navigation needed
5. On error: shows a brief inline error message next to the button

### UI

- Label: `[DEV] Simulate Payment`
- Styled to look clearly non-production (e.g., amber/yellow border, small font)
- Disabled + shows loading state during the request

### Error handling

- API error response → display `data.error` or a fallback message inline
- Network failure → display a generic fallback message
- Button re-enables after error so the user can retry

## Out of Scope

- Floating dev toolbar (deferred — revisit if more dev tools accumulate)
- Staging/Railway support (not needed)
