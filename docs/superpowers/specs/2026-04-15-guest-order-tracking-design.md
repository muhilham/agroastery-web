# Guest Order Tracking — Design Spec

**Date:** 2026-04-15
**Branch:** claude/review-pr-7AjrY (existing)

---

## Overview

End-to-end post-purchase experience for guest users: required email at checkout, order confirmation email via Resend, a public shareable tracking page, and optional account conversion that automatically links past guest orders.

---

## Scope

### In scope
- Email field: required for guests, hidden for logged-in users
- Public tracking page at `/track/[orderId]` (no login required)
- Enhanced success page with order number + "Track My Order" CTA
- Order confirmation email via Resend (English, from `order@agroastery.com`)
- Auto-link guest orders by email on first Google sign-in

### Out of scope
- Push/SMS notifications
- Email for logged-in users (they already have order history)
- Resend audience/contact management
- Order cancellation or refund emails

---

## User Flow

```
[Checkout Page]
  Guest → email field REQUIRED
  Logged-in user → email field hidden

  Submit → POST /api/checkout
         → order created with customer_email stored
         → redirect to /checkout/payment/[orderId]

[Payment — QRIS]
  User pays
  Pivot webhook: PAYMENT.PAID
    → update order: status=processing, payment_status=paid
    → fire-and-forget: sendOrderEmail(orderId)    ← NEW
    → fire-and-forget: createBiteshipOrder()      (existing)

[Success Page — /checkout/success?order=[orderId]]
  Server fetches order by UUID
  Shows: ✓ icon, "Order Confirmed!", order number chip
  Shows: email note ("Confirmation sent to budi@gmail.com") if customer_email present
  Primary CTA: "Track My Order" → /track/[orderId]
  Secondary CTA: "Continue Shopping" → /katalog

[Email — via Resend]
  From: order@agroastery.com
  Subject: Order [orderNumber] confirmed — Agroastery
  Content (English):
    - Dark hero: logo + checkmark + "Order Confirmed!"
    - Order number chip
    - Items ordered (name, variant, qty, price)
    - Subtotal, shipping cost, total
    - Shipping address + courier + estimated arrival
    - "Track My Order →" CTA button
    - Plain-text fallback URL: agroastery.com/track/[orderId]
    - Footer: @agroastery Instagram, Jakarta

[Tracking Page — /track/[orderId]]
  Public, no login required
  Server component — fetches order via admin client (service role)
  Layout (top → bottom priority):
    1. Order number + date + status badge
    2. Status card (current order status with human-readable label)
    3. Shipping card (courier, ETA, address, tracking number when available)
    4. Items card (product name, variant, qty, subtotal per line + total)
    5. Account conversion CTA (optional, skippable)

[Auth Callback — /api/auth/callback]
  On successful Google login:
    UPDATE ecom_orders
    SET user_id = $uid
    WHERE customer_email = $userEmail AND user_id IS NULL
  Silent — no UI feedback needed (orders just appear in history)
```

---

## Checkout Page Changes

**File:** `app/(root)/checkout/page.tsx`

### Email field visibility
- **Guest users** (`!user`): email field is visible and **required**
  - Zod schema: `z.string().email("Email is not valid").min(1, "Email is required")`
  - Label: "Email" (remove "Opsional")
  - Helper text: "We'll send your order confirmation here"
- **Logged-in users** (`user` is set): email field is **hidden entirely**
  - The user's auth email is used internally when needed; no field shown

### Form schema delta
```ts
// Guest (no user)
email: z.string().email("Email tidak valid").min(1, "Email wajib diisi")

// Logged-in (field not rendered, value not submitted)
// customerEmail sent as undefined or user.email from server
```

---

## Tracking Page

**File:** `app/(root)/track/[orderId]/page.tsx` (new)

### Access control
- No login required
- Fetches order using `createSupabaseAdminClient()` (bypasses RLS)
- If order UUID not found → `notFound()`
- No ownership check — the UUID is the access token (128-bit random, unguessable)

### Data fetched
```ts
supabase
  .from("ecom_orders")
  .select("*, ecom_order_items(*)")
  .eq("id", orderId)
  .single()
```

### Page structure

```
<Navigation />
<main>
  // Header
  <OrderNumber />        // "AGR-20260415-X7K2M"
  <OrderDate />          // "15 April 2026, 14:32"
  <StatusBadge />        // "Dikirim" (colored pill, matches status)

  // Card — Shipping + Biteship live tracking
  <ShippingCard>
    // Always shown:
    Courier + service | Destination address

    // When dispatched (tracking_number present):
    Resi highlight chip (cyan, prominent)
    Estimated arrival

    // Biteship live timeline — rendered by <TrackingTimeline> client component
    // (fetches GET /api/orders/[orderId]/tracking on mount)
    - dispatched: false → "Pesanan sedang disiapkan untuk dikirim"
    - dispatched: true, no history → resi shown, "Menunggu update dari kurir"
    - dispatched: true, history present → event list newest-first
        Most recent event: glowing cyan dot + full opacity
        Older events: dimmed dot + reduced opacity
    - fetch error → "Tidak dapat memuat info pengiriman" (non-blocking)
  </ShippingCard>

  // Card — Items
  <ItemsCard>
    per-item: product name, variant description, qty, subtotal
    Total line (subtotal + shipping cost)
  </ItemsCard>

  // Account conversion (guest-only — shown when order.user_id is null)
  <AccountConversionCard>
    "Simpan pesanan ke akun"
    "Lanjut dengan Google" button → /login?next=/track/[orderId]
    "Lewati" link
  </AccountConversionCard>
</main>
```

### Biteship tracking — client-side fetch

The page is a server component (static order data). The live timeline is isolated in a `<TrackingTimeline orderId={orderId} />` client component that fetches on mount:

```ts
// Calls existing route:
GET /api/orders/[orderId]/tracking

// Response shape (already implemented):
{
  dispatched: boolean
  status: string
  waybill_id?: string
  courier?: string
  history?: { note: string; status: string; updated_at: string }[]
}
```

Loading state: skeleton pulse on the timeline area — does not block the rest of the page.

### Status labels (Indonesian — tracking page is part of the web app, not the email)
| DB value | Display |
|---|---|
| `pending_payment` | Menunggu Pembayaran |
| `processing` | Sedang Diproses |
| `shipped` | Dikirim |
| `delivered` | Diterima |
| `cancelled` | Dibatalkan |
| `refunded` | Dikembalikan |

### Account conversion visibility
- Show `<AccountConversionCard>` only when `order.user_id === null`
- If `user_id` is set, the order is already linked — hide the CTA entirely

---

## Success Page Changes

**File:** `app/(root)/checkout/success/page.tsx`

### Current behavior
- Reads `order` UUID from query param
- Shows generic success message
- "Lihat Detail Pesanan" → `/orders/[id]` (requires login — broken for guests)
- "Lanjut Belanja" → `/katalog`

### New behavior
- Restructure to server component: the current page uses `useSearchParams()` (client component inside a `<Suspense>`). Replace the inner `SuccessContent` client component with a server component that reads the `order` param from `searchParams` prop and fetches the order directly via `createSupabaseAdminClient()`.
  - Fields needed: `order_number`, `customer_email`, `status`
- **Primary CTA:** "Track My Order" → `/track/[orderId]`
- **Secondary CTA:** "Continue Shopping" → `/katalog`
- Remove "Lihat Detail Pesanan" (replaced by Track My Order)
- Show email note if `customer_email` is present:
  > "Confirmation sent to **budi@gmail.com**"

### Layout
```
✓ icon (large, animated zoom-in — existing)
"Order Confirmed!"
"Thank you for ordering from Agroastery."

[Order Number chip]  AGR-20260415-X7K2M

[Email note — guests only]
"Confirmation & tracking link sent to budi@gmail.com"

[Track My Order]   ← primary button
[Continue Shopping] ← secondary button

"Your coffee is on its way"  ← tagline
```

---

## Email (Resend)

**File:** `lib/resend/sendOrderEmail.ts` (new)
**Template:** `lib/resend/templates/OrderConfirmation.tsx` (new — React Email)

### Trigger
Called fire-and-forget from `PAYMENT.PAID` handler in `app/api/webhooks/pivot/route.ts`:
```ts
sendOrderEmail(updatedOrder.id).catch((err) =>
  console.error(`[pivot-webhook] Email failed for order ${updatedOrder.id}:`, err)
)
```

### Guard
Only send if `customer_email` is present on the order. Skip silently if null.

### Email spec
| Field | Value |
|---|---|
| From | `Agroastery <order@agroastery.com>` |
| Subject | `Order [orderNumber] confirmed — Agroastery` |
| Reply-To | _(none)_ |

### Content (English)
```
[Dark hero]
  AGROASTERY
  ✓
  Order Confirmed!
  Thank you for your order. Here's your order summary.

[Light body]
  Order Number: AGR-20260415-X7K2M  |  Apr 15, 2026

  ITEMS ORDERED
  [product name] — [variant] × [qty]   Rp[price]
  ...

  Subtotal          Rp215,000
  Shipping (JNE REG) Rp30,000
  ─────────────────────────────
  Total             Rp245,000

  SHIPPING TO
  [recipient name] · [phone]
  [address line], [city] [postal_code]
  Estimated arrival: [shipping_etd]

  [Track My Order →]   dark button
  Or copy: agroastery.com/track/[orderId]

[Footer]
  Questions? Reach us on Instagram @agroastery
  Agroastery · Jakarta, Indonesia
```

### Data fetched inside `sendOrderEmail`
```ts
supabase
  .from("ecom_orders")
  .select("*, ecom_order_items(*)")
  .eq("id", orderId)
  .single()
```

### Error handling
- If `customer_email` is null → return early, no send
- If Resend API call fails → log error, do not throw (webhook must return 200)
- No retry logic — Resend handles delivery reliability internally

---

## Auth Callback Changes

**File:** `app/api/auth/callback/route.ts`

### Addition
After successful `exchangeCodeForSession`, if this is the user's profile being created for the first time (or always, idempotently):

```ts
const { data: { user } } = await supabase.auth.getUser()
if (user?.email) {
  await adminClient
    .from("ecom_orders")
    .update({ user_id: user.id })
    .eq("customer_email", user.email)
    .is("user_id", null)
}
```

- Uses `createSupabaseAdminClient()` to bypass RLS
- Runs idempotently — `.is("user_id", null)` ensures already-linked orders are skipped
- Fire-and-forget pattern acceptable here (non-critical, linkage can be retried on next login)
- Only links orders where email matches exactly

---

## DB Changes

**None required.**

- Tracking token = order UUID (already stored, already 128-bit random)
- `customer_email` column already exists on `ecom_orders`
- `user_id` column already exists on `ecom_orders` (nullable)

---

## New Files

| File | Purpose |
|---|---|
| `app/(root)/track/[orderId]/page.tsx` | Public tracking page (server component) |
| `app/(root)/track/[orderId]/TrackingTimeline.tsx` | Client component — fetches Biteship live events |
| `lib/resend/sendOrderEmail.ts` | Resend send function |
| `lib/resend/templates/OrderConfirmation.tsx` | React Email template |

## Modified Files

| File | Change |
|---|---|
| `app/(root)/checkout/page.tsx` | Email required for guests; hidden for logged-in |
| `app/(root)/checkout/success/page.tsx` | Fetch order server-side; show order number + email note; Track CTA |
| `app/api/webhooks/pivot/route.ts` | Fire `sendOrderEmail` on PAYMENT.PAID |
| `app/api/auth/callback/route.ts` | Link guest orders by email on login |

---

## Environment Variables

No new variables needed. Resend MCP is already configured. Add to `.env`:
```env
RESEND_API_KEY=re_...   # already present if Resend MCP is configured
```

Verify `NEXT_PUBLIC_APP_URL` is set — used to build the tracking URL in the email:
```ts
const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`
```

---

## UX Principles (from brief)

- **Reduce anxiety after purchase** — order number visible immediately on success page; email arrives fast
- **No forced signup** — account conversion is optional and skippable; tracking works without login
- **Simple and predictable** — one clear primary action per screen; no decision fatigue
- **Unguessable tracking link** — UUID is 128-bit random; no sequential IDs in public URLs
