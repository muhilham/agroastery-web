# Design: WhatsApp Link in Telegram Payment Notifications

**Date:** 2026-08-07  
**Scope:** Append a `wa.me` click-to-chat link to the Telegram payment notification message sent to the admin group. The link pre-fills a short thank-you WhatsApp message so the admin can forward it to the customer with one tap.

---

## Goal

When an e-commerce order is paid (Pivot `PAYMENT.PAID` webhook), the Telegram notification sent to the admin group should include a `wa.me` link. Clicking it opens WhatsApp with a pre-filled thank-you message containing the customer’s order details and tracking page URL. The admin can review and send it immediately.

---

## WhatsApp Message Template (Minimal)

```
Halo {customerName}, order {orderNumber} sudah dikonfirmasi.

{items}

Total: {total}
Tracking: {appUrl}/track/{orderId}/

Terima kasih sudah order di Agroastery! 🙏
```

- `items` rendered as bullet list: `• {productName} ×{quantity}`
- `{appUrl}` from `NEXT_PUBLIC_APP_URL` (fallback `https://agroastery.com`)
- Always include tracking link — `/track/{orderId}/` already handles both delivery (courier + timeline) and self-pickup ("Ambil Sendiri" + address + hours)

---

## Architecture

### Layer 1: `lib/whatsapp.ts` (Reusable Helpers)

Add two exported functions:

1. **`formatPhoneForWaMe(phone: string): string | null`**
   - Normalize Indonesian phone numbers to wa.me-compatible international format (`62...` without `+`).
   - Rules (same as existing `formatPhoneForPivot` in `lib/pivot/client.ts`):
     - `+62...` → remove `+`, keep `62...`
     - `62...` (length > 10) → keep as-is
     - `08...` / `0...` → replace leading `0` with `62`
   - Strip spaces and dashes.
   - Return `null` if result is empty or contains non-numeric characters after normalization.

2. **`buildPaymentWhatsAppLink(params: BuildPaymentWhatsAppLinkParams): string | null`**
   - Build the message above from params.
   - Encode via `encodeURIComponent`.
   - Return `https://wa.me/{phone}?text={encodedMessage}`.
   - Return `null` if phone invalid.

```typescript
type BuildPaymentWhatsAppLinkParams = {
  phone: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: { productName: string; quantity: number }[];
  total: number;
  appUrl?: string; // default NEXT_PUBLIC_APP_URL || "https://agroastery.com"
};
```

### Layer 2: `lib/telegram/notify.ts` (Notification Integration)

Update `PaymentNotificationParams`:

```typescript
type PaymentNotificationParams = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddressPhone?: string | null; // NEW
  paymentMethod?: string | null;
  total: number;
  paidAt: string;
  items?: { productName: string; quantity: number }[]; // NEW
};
```

Update `sendPaymentNotification`:

1. **Determine target phone:** `customerPhone || shippingAddressPhone`.
2. **Build wa.me link:** Call `buildPaymentWhatsAppLink` with params + items.
   - Items sourced from `params.items`. If missing, skip item list in message.
3. **Append to Telegram text:** Add line `WA: {link}` to the message text.
   - Only append for **real payment confirmations** (skip for alert/hack messages where `paymentMethod` starts with `⚠️`).
4. **Send via existing `sendTelegramMessage`.**

### Layer 3: `app/api/webhooks/pivot/route.ts` (Webhook Pass-Through)

On `PAYMENT.PAID` event:

1. Update DB select to include `shipping_address` JSON column:
   ```typescript
   .select("id, order_number, customer_name, customer_phone, total, shipping_address")
   ```
2. Extract `shipping_address.phone` from JSON (fallback):
   ```typescript
   const shippingAddress = updatedOrder.shipping_address as Record<string, unknown> | null;
   const shippingAddressPhone = (shippingAddress?.phone as string) || null;
   ```
3. Fetch order items from `ecom_order_items` for item list (or add to select via join if efficient).
4. Pass to `sendPaymentNotification`:
   ```typescript
   sendPaymentNotification({
     orderId: updatedOrder.id,
     orderNumber: updatedOrder.order_number,
     customerName: updatedOrder.customer_name,
     customerPhone: updatedOrder.customer_phone,       // primary: buyer
     shippingAddressPhone,                              // fallback: recipient
     paymentMethod: "QRIS",
     total: updatedOrder.total,
     paidAt,
     items: orderItems.map(i => ({ productName: i.product_name, quantity: i.quantity })),
   })
   ```

---

## Phone Fallback Priority

1. `customerPhone` (from `ecom_orders.customer_phone`) — the buyer who placed and paid for the order
2. `shippingAddressPhone` (from `shipping_address.phone` JSON) — recipient phone entered at checkout

If both invalid/null → no wa.me link appended. Telegram text unchanged. Log warning.

Rationale: the thank-you message is for the customer (buyer), not the recipient. If a customer orders a gift for someone else, the appreciation goes to the buyer.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Invalid/empty phone | Skip wa.me link. Telegram text unchanged. Log warning. |
| `buildPaymentWhatsAppLink` throws | Catch, skip link, proceed with Telegram send. |
| Missing `NEXT_PUBLIC_APP_URL` | Fallback to `https://agroastery.com`. |
| `items` not provided | WhatsApp message skips item list section. |
| Alert message (`paymentMethod` starts with `⚠️`) | Skip wa.me link entirely. |

---

## Testing Plan

### `lib/whatsapp.test.ts`

Add tests:

1. `formatPhoneForWaMe` converts `08123456789` → `628123456789`
2. `formatPhoneForWaMe` converts `+628123456789` → `628123456789`
3. `formatPhoneForWaMe` keeps `628123456789` as-is
4. `formatPhoneForWaMe` strips spaces and dashes before normalizing
5. `formatPhoneForWaMe` returns `null` for empty/invalid/non-numeric input
3. `buildPaymentWhatsAppLink` returns valid `wa.me` URL with encoded message
4. `buildPaymentWhatsAppLink` includes tracking URL with `NEXT_PUBLIC_APP_URL`
6. `buildPaymentWhatsAppLink` returns `null` for invalid phone
7. `buildPaymentWhatsAppLink` renders item list correctly
8. `buildPaymentWhatsAppLink` skips item list when `items` empty

### Existing Tests

- Update `app/api/webhooks/pivot/route.ts` tests (if any) to mock `shipping_address`.
- Ensure no regression in Telegram notification tests.

---

## Files Changed

| File | Change |
|---|---|
| `lib/whatsapp.ts` | Add `formatPhoneForWaMe` and `buildPaymentWhatsAppLink` |
| `lib/whatsapp.test.ts` | Add tests for new helpers |
| `lib/telegram/notify.ts` | Integrate wa.me link into `sendPaymentNotification`; update params |
| `app/api/webhooks/pivot/route.ts` | Select `shipping_address`, extract phone, pass items and phone to notification |

---

## Out of Scope

- No changes to order-created (`sendOrderNotification`) Telegram message.
- No changes to Biteship webhook alerts or Jubelio sync notifications.
- No new env vars — reuse `NEXT_PUBLIC_APP_URL` and `ORIGIN_CONTACT_PHONE`.
- No DB schema changes.

---

## Acceptance Criteria

- [ ] `PAYMENT.PAID` webhook triggers Telegram message with `WA: https://wa.me/...` link
- [ ] Clicking link opens WhatsApp with pre-filled thank-you message including order number, items, total, tracking URL
- [ ] Pickup orders still show tracking link (page renders "Ambil Sendiri" correctly)
- [ ] Invalid/missing phone → Telegram sent without wa.me link
- [ ] Alert messages (`⚠️ BITESHIP...`) skip wa.me link
- [ ] All new code covered by tests
