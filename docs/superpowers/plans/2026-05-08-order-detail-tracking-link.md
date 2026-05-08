# Order Detail → Tracking Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Lacak Pesanan" link inside the "Info Pengiriman" card on `/orders/[id]` that opens the live Biteship tracking page (`/track/[id]`) in a new tab.

**Architecture:** Single file change to `app/(root)/orders/[id]/page.tsx`. Add a `TRACKABLE_STATUSES` constant, expand the "Info Pengiriman" card render condition to include trackable status (so the card/link shows even before courier info is populated), and append a `Link` + `ExternalLink` icon at the bottom of that card.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, lucide-react

---

### Task 1: Add Tracking Link to Order Detail Page

**Files:**
- Modify: `app/(root)/orders/[id]/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/(root)/orders/[id]/__tests__/trackable-statuses.test.ts`:

```ts
import { TRACKABLE_STATUSES } from "../trackable-statuses";

describe("TRACKABLE_STATUSES", () => {
  it("includes all active order statuses", () => {
    expect(TRACKABLE_STATUSES).toContain("pending_payment");
    expect(TRACKABLE_STATUSES).toContain("paid");
    expect(TRACKABLE_STATUSES).toContain("processing");
    expect(TRACKABLE_STATUSES).toContain("shipped");
    expect(TRACKABLE_STATUSES).toContain("delivered");
  });

  it("excludes terminal statuses", () => {
    expect(TRACKABLE_STATUSES).not.toContain("cancelled");
    expect(TRACKABLE_STATUSES).not.toContain("refunded");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run app/\(root\)/orders/\[id\]/__tests__/trackable-statuses.test.ts
```

Expected: FAIL — `Cannot find module '../trackable-statuses'`

- [ ] **Step 3: Create the constant module**

Create `app/(root)/orders/[id]/trackable-statuses.ts`:

```ts
export const TRACKABLE_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
] as const;
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run app/\(root\)/orders/\[id\]/__tests__/trackable-statuses.test.ts
```

Expected: PASS — 2 tests pass

- [ ] **Step 5: Update the page**

In `app/(root)/orders/[id]/page.tsx`:

**5a.** Add `ExternalLink` to the lucide-react import (line 7):
```tsx
import { ArrowLeft, ExternalLink } from "lucide-react";
```

**5b.** Import the constant after the existing imports:
```tsx
import { TRACKABLE_STATUSES } from "./trackable-statuses";
```

**5c.** Remove the inline `TRACKABLE_STATUSES` array if you added one — use the import only.

**5d.** Expand the "Info Pengiriman" card condition (currently `{(order.shipping_courier || order.tracking_number) && (`):
```tsx
{(order.shipping_courier ||
  order.tracking_number ||
  TRACKABLE_STATUSES.includes(order.status as (typeof TRACKABLE_STATUSES)[number])) && (
```

**5e.** Inside the card, after the last `{order.tracking_number && (...)}` block and before the closing `</div>` of the card, add:
```tsx
{TRACKABLE_STATUSES.includes(order.status as (typeof TRACKABLE_STATUSES)[number]) && (
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

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add "app/(root)/orders/[id]/trackable-statuses.ts" \
        "app/(root)/orders/[id]/__tests__/trackable-statuses.test.ts" \
        "app/(root)/orders/[id]/page.tsx"
git commit -m "feat(orders): add Lacak Pesanan link to order detail page"
```
