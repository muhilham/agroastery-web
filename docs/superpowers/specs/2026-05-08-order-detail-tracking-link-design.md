# Order Detail → Tracking Link

**Date:** 2026-05-08  
**Status:** Approved

## Problem

`/orders/[id]` (auth-gated order detail) and `/track/[orderId]` (public live tracking) are disconnected. Users on the order detail page see a static resi number but have no path to the live Biteship tracking timeline.

## Solution

Add a "Lacak Pesanan" link inside the existing "Info Pengiriman" card on the order detail page. Link opens `/track/[id]` in a new tab.

## Scope

Single file change: `app/(root)/orders/[id]/page.tsx`

## Behavior

- Link appears when `order.status` is in `['pending_payment', 'paid', 'processing', 'shipped', 'delivered']`
- Link hidden when status is `cancelled` or `refunded`
- No dependency on `tracking_number` being present — tracking page handles the empty state
- Opens in new tab (`target="_blank"`, `rel="noopener noreferrer"`)

## UI

Inside the "Info Pengiriman" card, below existing courier/ETD/resi rows, separated by `border-t border-white/10`:

```tsx
const TRACKABLE_STATUSES = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered'];

{TRACKABLE_STATUSES.includes(order.status as string) && (
  <div className="pt-3 mt-3 border-t border-white/10">
    <Link
      href={`/track/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
    >
      Lacak Pesanan
      <ExternalLink className="w-3.5 h-3.5" />
    </Link>
  </div>
)}
```

`ExternalLink` imported from `lucide-react` (already a project dependency).

## Edge Cases

- Order has no shipping info yet (`shipping_courier` null): the "Info Pengiriman" card is conditionally rendered at line 132 with `{(order.shipping_courier || order.tracking_number) && ...}`. For `pending_payment`/`paid` orders neither field is set yet, so the card (and link) would be hidden. **Decision:** expand the card condition to include trackable status:
  ```tsx
  {(order.shipping_courier || order.tracking_number || TRACKABLE_STATUSES.includes(order.status as string)) && (
  ```
  This ensures the card (and tracking link) renders for all active orders even before courier info is populated.
- Tracking page for `pending_payment` / `paid` orders: shows order info + empty timeline — already handled gracefully.
