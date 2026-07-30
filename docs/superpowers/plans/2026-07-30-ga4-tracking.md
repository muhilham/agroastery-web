# GA4 Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Analytics 4 to the Agroastery web app — automatic pageviews plus the full ecommerce funnel (`view_item` → `add_to_cart` → `begin_checkout` → `purchase`) with real IDR revenue, plus a separate `book_consultation` event.

**Architecture:** `@next/third-parties/google`'s `<GoogleAnalytics/>` mounted in root layout (env-gated) handles script injection + automatic pageviews. All custom events go through one typed wrapper, `lib/analytics/gtag.ts`, which no-ops silently when `window.gtag` is absent (no env var set, ad blocker, etc.) so the app never crashes or throws on missing analytics.

**Tech Stack:** Next.js 16.2.3 (App Router), TypeScript strict, Vitest (`pnpm test`, runs via `vitest-runner.js` for the crypto polyfill), nanostores, pnpm.

## Global Constraints

- Money is IDR (no decimals) — pass raw integers as GA4 `value`/`price`, never divide. `currency` is always `"IDR"`.
- `lib/analytics/gtag.ts` must import `CartItem` as a **type-only** import (`import type { CartItem } from "@/lib/stores/cart"`) — `lib/stores/cart.ts` imports *from* `gtag.ts` at runtime (Task 4), so a runtime import back into `cart.ts` would create a circular dependency. Type-only imports are erased at compile time and carry no such risk.
- Never fire `purchase` or `book_consultation` on unpaid/unconfirmed records — the success page URLs are trivially constructible (`/checkout/success?order=<id>`) independent of actual payment.
- `purchase` needs no client-side dedupe guard (GA4 dedupes by `transaction_id` natively, confirmed against Google's docs). `book_consultation` is a custom event and **does** need one (sessionStorage, keyed on booking id) — transaction-ID dedupe does not apply to custom events.
- Use `pnpm test` to run tests, never bare `vitest` (crypto polyfill requirement, see `AGENTS.md`).
- Follow existing code style: no comments explaining *what* code does, only non-obvious *why* (e.g. the circular-import note above is exactly the kind of comment worth keeping inline).

---

## File Structure

```
lib/analytics/
  gtag.ts                                  # NEW — typed event wrapper, single source of truth
  gtag.test.ts                             # NEW

app/layout.tsx                             # MODIFY — mount <GoogleAnalytics/>, env-gated

components/section/product-detail/
  SupabaseProductDetail.tsx                # MODIFY — fire view_item once per slug

lib/stores/cart.ts                         # MODIFY — fire add_to_cart in addToCart()

app/(root)/checkout/page.tsx               # MODIFY — fire begin_checkout once when hydrated+non-empty

app/(root)/checkout/success/
  page.tsx                                 # MODIFY — extend query, gate + render tracking child
  PurchaseTracking.tsx                     # NEW — client child, fires purchase on mount

app/(root)/konsultasi/sukses/
  page.tsx                                 # MODIFY — extend query, gate + render tracking child
  ConsultationTracking.tsx                 # NEW — client child, fires book_consultation + sessionStorage dedupe

.env.example                               # MODIFY — document NEXT_PUBLIC_GA_MEASUREMENT_ID
AGENTS.md                                  # MODIFY — document lib/analytics/ + env var
package.json                               # MODIFY — add @next/third-parties
```

---

### Task 1: Analytics wrapper (`lib/analytics/gtag.ts`)

**Files:**
- Create: `lib/analytics/gtag.ts`
- Test: `lib/analytics/gtag.test.ts`

**Interfaces:**
- Consumes: `CartItem` type from `lib/stores/cart.ts` (type-only import — see Global Constraints)
- Produces (used by Tasks 3, 4, 5, 6, 7):
  - `trackViewItem(item: { itemId: string; itemName: string; price: number }): void`
  - `trackAddToCart(item: CartItem): void`
  - `trackBeginCheckout(items: CartItem[]): void`
  - `trackPurchase(params: { transactionId: string; value: number; shipping: number; items: PurchaseItem[] }): void` where `PurchaseItem = { itemId: string; itemName: string; price: number; quantity: number }` (exported)
  - `trackBookConsultation(params: { value: number }): void`
  - `cartItemToGA4(item: CartItem): GA4Item` where `GA4Item = { item_id: string; item_name: string; price: number; quantity: number }` (exported, used internally and by tests)

- [ ] **Step 1: Write the failing tests**

Create `lib/analytics/gtag.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  trackEvent,
  cartItemToGA4,
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackBookConsultation,
} from "./gtag";
import type { CartItem } from "@/lib/stores/cart";

const sampleItem: CartItem = {
  variantId: "variant-1",
  productSlug: "kopi-arabika",
  productName: "Kopi Arabika",
  variantDescription: "150g, Halus",
  unitPrice: 50000,
  originalPrice: 60000,
  quantity: 2,
  shipWeightGrams: 200,
  image: "/img.jpg",
};

describe("gtag wrapper", () => {
  afterEach(() => {
    delete (window as { gtag?: unknown }).gtag;
  });

  describe("trackEvent", () => {
    it("does not throw when window.gtag is absent", () => {
      delete (window as { gtag?: unknown }).gtag;
      expect(() => trackEvent("test_event", { foo: "bar" })).not.toThrow();
    });

    it("calls window.gtag with event name and params when present", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackEvent("test_event", { foo: "bar" });
      expect(gtag).toHaveBeenCalledWith("event", "test_event", { foo: "bar" });
    });
  });

  describe("cartItemToGA4", () => {
    it("maps CartItem fields to the GA4 item shape", () => {
      expect(cartItemToGA4(sampleItem)).toEqual({
        item_id: "variant-1",
        item_name: "Kopi Arabika",
        price: 50000,
        quantity: 2,
      });
    });
  });

  describe("trackViewItem", () => {
    it("fires view_item with a single-item payload", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackViewItem({ itemId: "variant-1", itemName: "Kopi Arabika", price: 50000 });
      expect(gtag).toHaveBeenCalledWith("event", "view_item", {
        currency: "IDR",
        value: 50000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 1 }],
      });
    });
  });

  describe("trackAddToCart", () => {
    it("fires add_to_cart with value = unitPrice * quantity", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackAddToCart(sampleItem);
      expect(gtag).toHaveBeenCalledWith("event", "add_to_cart", {
        currency: "IDR",
        value: 100000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
    });
  });

  describe("trackBeginCheckout", () => {
    it("fires begin_checkout with summed value across items", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      const items: CartItem[] = [
        sampleItem,
        { ...sampleItem, variantId: "variant-2", productName: "Kopi Robusta", unitPrice: 30000, quantity: 1 },
      ];
      trackBeginCheckout(items);
      expect(gtag).toHaveBeenCalledWith("event", "begin_checkout", {
        currency: "IDR",
        value: 130000,
        items: [
          { item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 },
          { item_id: "variant-2", item_name: "Kopi Robusta", price: 30000, quantity: 1 },
        ],
      });
    });
  });

  describe("trackPurchase", () => {
    it("fires purchase with transaction_id, shipping, and mapped items", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackPurchase({
        transactionId: "AGR-20260730-0001",
        value: 115000,
        shipping: 15000,
        items: [{ itemId: "variant-1", itemName: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
      expect(gtag).toHaveBeenCalledWith("event", "purchase", {
        transaction_id: "AGR-20260730-0001",
        currency: "IDR",
        value: 115000,
        shipping: 15000,
        items: [{ item_id: "variant-1", item_name: "Kopi Arabika", price: 50000, quantity: 2 }],
      });
    });
  });

  describe("trackBookConsultation", () => {
    it("fires book_consultation with currency and value", () => {
      const gtag = vi.fn();
      window.gtag = gtag;
      trackBookConsultation({ value: 500000 });
      expect(gtag).toHaveBeenCalledWith("event", "book_consultation", {
        currency: "IDR",
        value: 500000,
      });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test gtag.test.ts`
Expected: FAIL — `lib/analytics/gtag.ts` does not exist yet (module not found).

- [ ] **Step 3: Write the implementation**

Create `lib/analytics/gtag.ts`:

```typescript
import type { CartItem } from "@/lib/stores/cart";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type GA4Item = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

export type PurchaseItem = {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
};

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export function cartItemToGA4(item: CartItem): GA4Item {
  return {
    item_id: item.variantId,
    item_name: item.productName,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export function trackViewItem(item: { itemId: string; itemName: string; price: number }): void {
  trackEvent("view_item", {
    currency: "IDR",
    value: item.price,
    items: [{ item_id: item.itemId, item_name: item.itemName, price: item.price, quantity: 1 }],
  });
}

export function trackAddToCart(item: CartItem): void {
  trackEvent("add_to_cart", {
    currency: "IDR",
    value: item.unitPrice * item.quantity,
    items: [cartItemToGA4(item)],
  });
}

export function trackBeginCheckout(items: CartItem[]): void {
  const value = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  trackEvent("begin_checkout", {
    currency: "IDR",
    value,
    items: items.map(cartItemToGA4),
  });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  shipping: number;
  items: PurchaseItem[];
}): void {
  trackEvent("purchase", {
    transaction_id: params.transactionId,
    currency: "IDR",
    value: params.value,
    shipping: params.shipping,
    items: params.items.map((i) => ({
      item_id: i.itemId,
      item_name: i.itemName,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

export function trackBookConsultation(params: { value: number }): void {
  trackEvent("book_consultation", {
    currency: "IDR",
    value: params.value,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test gtag.test.ts`
Expected: PASS — all 7 test cases green.

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/gtag.ts lib/analytics/gtag.test.ts
git commit -m "feat(analytics): add typed GA4 event wrapper"
```

---

### Task 2: Install `@next/third-parties`, mount `<GoogleAnalytics/>`

**Files:**
- Modify: `package.json`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var read by `app/layout.tsx`; no code-level export (this task has no automated test — it's a script-injection concern, verified by build + manual DebugView check per the spec's Testing section)

- [ ] **Step 1: Install the package**

```bash
pnpm add @next/third-parties
```

- [ ] **Step 2: Mount `<GoogleAnalytics/>` in root layout, env-gated**

Modify `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "../style/embla.css";

export const metadata: Metadata = {
  title: "Agroastery",
  description:
    "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
  openGraph: {
    title: "Agroastery",
    description:
      "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
    images: [
      {
        url: "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e",
        width: 1200,
        height: 630,
        alt: "Agroastery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agroastery",
    description:
      "At AGROASTERY we are passionate about sourcing and roasting the highest quality coffee beans from around the world. Our mission is to bring you the perfect cup of coffee every time.",
    images: [
      "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e",
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en">
      <head>
        {/* Preconnect to third-party origins used at checkout */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://maps.gstatic.com" />
      </head>
      <body className="bg-background" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the app still builds and boots without the env var set**

Run: `pnpm build`
Expected: build succeeds; no `<GoogleAnalytics/>` script tag emitted (env var unset in this environment yet — confirm no runtime error).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml app/layout.tsx
git commit -m "feat(analytics): mount GoogleAnalytics component, env-gated"
```

---

### Task 3: `view_item` on product detail view

**Files:**
- Modify: `components/section/product-detail/SupabaseProductDetail.tsx`

**Interfaces:**
- Consumes: `trackViewItem` from `lib/analytics/gtag.ts` (Task 1)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Add the tracking effect**

In `components/section/product-detail/SupabaseProductDetail.tsx`, add the import:

```typescript
import { trackViewItem } from "@/lib/analytics/gtag";
```

Add `useRef` to the existing `react` import (it's already imported — no change needed there since `useRef` is already imported at line 5).

Add this effect after the existing "Reset on product change" effect (the one keyed on `[product.slug]`, ending around line 72):

```typescript
  // Fire view_item once per product slug, as soon as a variant is resolved.
  // Guarded by ref (not just [product.slug] deps) because matchedVariant is
  // derived from selectedValues state, which the reset effect above updates
  // asynchronously — a plain slug-only effect could fire with the previous
  // product's stale matchedVariant during a client-side navigation.
  const trackedViewItemSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!matchedVariant) return;
    if (trackedViewItemSlugRef.current === product.slug) return;
    trackedViewItemSlugRef.current = product.slug;
    trackViewItem({
      itemId: matchedVariant.id,
      itemName: product.name,
      price: matchedVariant.discounted_price ?? matchedVariant.price,
    });
  }, [product.slug, matchedVariant]);
```

Place this after `matchedVariant` is computed (it's computed at line ~77-80, before the JSX return) — so this new effect must go **after** that computation, not up near the other two effects at the top of the component. Insert it directly before the `return (` statement (i.e. after the `variantDescription`/`images`/`carouselImages` block and the `handleAddToCart`/`handleCheckout` function definitions, right before `return (\n    <Fragment>`).

- [ ] **Step 2: Verify manually**

Run: `pnpm dev`, open a product page, open browser console, temporarily add `window.gtag = console.log` before navigating (via devtools), confirm `view_item` logs once on load and does NOT log again when switching variant selection (e.g. clicking a different Size badge).

- [ ] **Step 3: Run the full test suite to confirm no regressions**

Run: `pnpm test`
Expected: all existing tests still pass (no test covers this component today, so this step only guards against a syntax/type error breaking the build).

- [ ] **Step 4: Typecheck**

Run: `pnpm build` (or `tsc --noEmit` if faster — check `package.json` scripts; use whichever the repo's `lint`/typecheck script is)
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add components/section/product-detail/SupabaseProductDetail.tsx
git commit -m "feat(analytics): fire view_item on product detail view"
```

---

### Task 4: `add_to_cart` in the cart store

**Files:**
- Modify: `lib/stores/cart.ts`
- Test: `lib/stores/cart.test.ts` (new)

**Interfaces:**
- Consumes: `trackAddToCart` from `lib/analytics/gtag.ts` (Task 1)
- Produces: nothing new (existing `addToCart` signature unchanged)

- [ ] **Step 1: Write the failing test**

Create `lib/stores/cart.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as gtag from "@/lib/analytics/gtag";

vi.mock("@/lib/analytics/gtag", async () => {
  const actual = await vi.importActual<typeof gtag>("@/lib/analytics/gtag");
  return { ...actual, trackAddToCart: vi.fn() };
});

import { $cartItems, addToCart, type CartItem } from "./cart";

const sampleItem: CartItem = {
  variantId: "variant-1",
  productSlug: "kopi-arabika",
  productName: "Kopi Arabika",
  variantDescription: "150g, Halus",
  unitPrice: 50000,
  originalPrice: 60000,
  quantity: 1,
  shipWeightGrams: 200,
  image: "/img.jpg",
};

describe("addToCart", () => {
  beforeEach(() => {
    $cartItems.set([]);
    vi.mocked(gtag.trackAddToCart).mockClear();
  });

  it("fires trackAddToCart with the added item", () => {
    addToCart(sampleItem);
    expect(gtag.trackAddToCart).toHaveBeenCalledWith(sampleItem);
  });

  it("fires trackAddToCart with the incoming item even when merging with an existing line", () => {
    addToCart(sampleItem);
    const secondAdd = { ...sampleItem, quantity: 2 };
    addToCart(secondAdd);
    expect(gtag.trackAddToCart).toHaveBeenLastCalledWith(secondAdd);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test cart.test.ts`
Expected: FAIL — `trackAddToCart` is never called (not wired into `addToCart` yet).

- [ ] **Step 3: Wire the call into `addToCart`**

Modify `lib/stores/cart.ts` — add the import at the top:

```typescript
import { trackAddToCart } from "@/lib/analytics/gtag";
```

Modify `addToCart` (currently lines 87-102):

```typescript
export function addToCart(item: CartItem) {
  const current = $cartItems.get();
  const existing = current.find((i) => i.variantId === item.variantId);

  if (existing) {
    $cartItems.set(
      current.map((i) =>
        i.variantId === item.variantId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      )
    );
  } else {
    $cartItems.set([...current, item]);
  }
  trackAddToCart(item);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test cart.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass, including the new `gtag.test.ts` from Task 1 (confirms the type-only import in `gtag.ts` didn't create a circular-dependency runtime issue).

- [ ] **Step 6: Commit**

```bash
git add lib/stores/cart.ts lib/stores/cart.test.ts
git commit -m "feat(analytics): fire add_to_cart from the cart store"
```

---

### Task 5: `begin_checkout` on checkout page

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**Interfaces:**
- Consumes: `trackBeginCheckout` from `lib/analytics/gtag.ts` (Task 1); `hydrated`, `cartCount`, `cartItems` already available from `useCart()` (existing, line 59)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Add the tracking effect**

In `app/(root)/checkout/page.tsx`, add the import:

```typescript
import { trackBeginCheckout } from "@/lib/analytics/gtag";
```

Add this effect in the component body, after the existing `const { cartItems, cartTotal, cartCount, clearCart, totalWeight, hydrated } = useCart();` line and its neighboring state declarations — anywhere among the other hooks is fine, but it **must** run before the `if (!mounted || !hydrated) { return ... }` early return (all hooks in this component already run unconditionally before that return; add this one there too):

```typescript
  const trackedBeginCheckoutRef = useRef(false);
  useEffect(() => {
    if (!hydrated || cartCount === 0) return;
    if (trackedBeginCheckoutRef.current) return;
    trackedBeginCheckoutRef.current = true;
    trackBeginCheckout(cartItems);
  }, [hydrated, cartCount, cartItems]);
```

`useRef` and `useEffect` are already imported in this file (line 2: `import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";`) — no import changes needed there.

- [ ] **Step 2: Verify manually**

Run: `pnpm dev`. With `window.gtag = console.log` set in devtools console:
- Add an item to cart, navigate to `/checkout` → confirm `begin_checkout` logs exactly once after the skeleton clears.
- Remove all items from the cart on the checkout page (if the UI allows) → confirm `begin_checkout` does NOT fire again.
- Navigate directly to `/checkout` with an empty cart → confirm `begin_checkout` does NOT fire (empty-cart state shown instead).

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass (no existing test covers this page; this step guards against a syntax/type error).

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/checkout/page.tsx"
git commit -m "feat(analytics): fire begin_checkout once cart is hydrated and non-empty"
```

---

### Task 6: `purchase` on checkout success

**Files:**
- Modify: `app/(root)/checkout/success/page.tsx`
- Create: `app/(root)/checkout/success/PurchaseTracking.tsx`

**Interfaces:**
- Consumes: `trackPurchase` and `PurchaseItem` type from `lib/analytics/gtag.ts` (Task 1)
- Produces: `PurchaseTracking` component — `{ transactionId: string; value: number; shipping: number; items: PurchaseItem[] }` props, renders `null`

- [ ] **Step 1: Create the tracking child component**

Create `app/(root)/checkout/success/PurchaseTracking.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { trackPurchase, type PurchaseItem } from "@/lib/analytics/gtag";

type Props = {
  transactionId: string;
  value: number;
  shipping: number;
  items: PurchaseItem[];
};

export default function PurchaseTracking({ transactionId, value, shipping, items }: Props) {
  useEffect(() => {
    trackPurchase({ transactionId, value, shipping, items });
    // Deliberately fires once per mount keyed only on transactionId — GA4
    // dedupes duplicate purchase events sharing the same transaction_id
    // natively, so no local guard is needed even on refresh/back-nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  return null;
}
```

- [ ] **Step 2: Extend the server query and gate rendering**

Modify `app/(root)/checkout/success/page.tsx`:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import PurchaseTracking from "./PurchaseTracking";
import type { PurchaseItem } from "@/lib/analytics/gtag";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order: orderId } = await searchParams;

  let orderNumber: string | null = null;
  let customerEmail: string | null = null;
  let isPickup = false;
  let paymentStatus: string | null = null;
  let total: number | null = null;
  let shippingCost = 0;
  let purchaseItems: PurchaseItem[] = [];

  if (orderId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("ecom_orders")
      .select(
        "order_number, customer_email, shipping_courier, payment_status, total, shipping_cost, ecom_order_items(product_name, unit_price, quantity, variant_id)"
      )
      .eq("id", orderId)
      .single();
    orderNumber = (data?.order_number as string) ?? null;
    customerEmail = (data?.customer_email as string) ?? null;
    isPickup = data?.shipping_courier === "pickup";
    paymentStatus = (data?.payment_status as string) ?? null;
    total = (data?.total as number) ?? null;
    shippingCost = (data?.shipping_cost as number) ?? 0;
    const items =
      (data?.ecom_order_items as Array<{
        product_name: string;
        unit_price: number;
        quantity: number;
        variant_id: string | null;
      }> | null) ?? [];
    purchaseItems = items.map((i) => ({
      itemId: i.variant_id ?? i.product_name,
      itemName: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
    }));
  }

  const shouldTrackPurchase =
    paymentStatus === "paid" && !!orderNumber && total !== null;

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {shouldTrackPurchase && (
        <PurchaseTracking
          transactionId={orderNumber as string}
          value={total as number}
          shipping={shippingCost}
          items={purchaseItems}
        />
      )}
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">

          {/* Check icon */}
          <div className="animate-in zoom-in-50 fade-in duration-500 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <h1 className="text-2xl font-semibold text-primary mb-2 tracking-wide">
              Order Confirmed!
            </h1>
            <p className="text-secondary text-sm leading-relaxed">
              Thank you for ordering from Agroastery.
            </p>

            {/* Order number chip */}
            {orderNumber && (
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Order
                </span>
                <span className="text-sm font-bold text-primary font-mono tracking-wide">
                  {orderNumber}
                </span>
              </div>
            )}

            {/* Email note — guests only */}
            {customerEmail && (
              <p className="text-xs text-secondary/50 mt-3 leading-relaxed">
                Confirmation &amp; tracking link sent to{" "}
                <span className="text-secondary font-medium">{customerEmail}</span>
              </p>
            )}
          </div>

          {/* CTAs */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3 mt-8"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            {orderId && (
              <Link href={`/track/${orderId}`}>
                <Button className="w-full h-12 gap-2">
                  <MapPin className="w-4 h-4" />
                  {isPickup ? "Lihat Info Pengambilan" : "Track My Order"}
                </Button>
              </Link>
            )}
            <Link href="/katalog">
              <Button className="w-full" variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-primary/20 mt-8">
            {isPickup ? "Pesanan siap diambil setelah diproses" : "Your coffee is on its way"}
          </p>

        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

Complete a real (or sandbox) checkout end to end. With `window.gtag = console.log` set beforehand in devtools, confirm `purchase` fires exactly once on the success page with the correct `transaction_id`, `value`, `shipping`, and `items`. Refresh the success page — confirm `purchase` fires again client-side (expected — the dedupe happens server-side in GA4, not in this code) but does not double-count revenue in GA4 Realtime/DebugView.

Separately, manually navigate to `/checkout/success?order=<some-unpaid-or-fake-id>` and confirm no `purchase` event fires (either `payment_status !== "paid"` or the query returns no row).

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Typecheck / build**

Run: `pnpm build`
Expected: no type errors — confirms the `ecom_order_items` embedded-select typing and `PurchaseItem` mapping are consistent.

- [ ] **Step 6: Commit**

```bash
git add "app/(root)/checkout/success/page.tsx" "app/(root)/checkout/success/PurchaseTracking.tsx"
git commit -m "feat(analytics): fire purchase on paid checkout success, gated on payment_status"
```

---

### Task 7: `book_consultation` on consultation success

**Files:**
- Modify: `app/(root)/konsultasi/sukses/page.tsx`
- Create: `app/(root)/konsultasi/sukses/ConsultationTracking.tsx`

**Interfaces:**
- Consumes: `trackBookConsultation` from `lib/analytics/gtag.ts` (Task 1)
- Produces: `ConsultationTracking` component — `{ bookingId: string; value: number }` props, renders `null`

- [ ] **Step 1: Create the tracking child component with sessionStorage dedupe**

Create `app/(root)/konsultasi/sukses/ConsultationTracking.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { trackBookConsultation } from "@/lib/analytics/gtag";

const DEDUPE_KEY_PREFIX = "ga4_consultation_tracked_";

type Props = {
  bookingId: string;
  value: number;
};

export default function ConsultationTracking({ bookingId, value }: Props) {
  useEffect(() => {
    // book_consultation is a custom event — GA4's transaction_id dedupe
    // (used for `purchase`) does not apply here, so a refresh or back-nav
    // would double-count without this session-scoped guard.
    const dedupeKey = `${DEDUPE_KEY_PREFIX}${bookingId}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");
    trackBookConsultation({ value });
  }, [bookingId, value]);

  return null;
}
```

- [ ] **Step 2: Extend the server query and gate rendering**

Modify `app/(root)/konsultasi/sukses/page.tsx`:

```typescript
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";
import { ADDRESS } from "@/constant/resource-and-link";
import ConsultationTracking from "./ConsultationTracking";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ booking?: string }> };

export default async function KonsultasiSuccessPage({ searchParams }: Props) {
  const { booking: bookingId } = await searchParams;

  let booking: {
    booking_date: string;
    time_slot: string;
    manage_token: string;
    status: string;
    amount: number;
  } | null = null;

  if (bookingId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("consultation_bookings")
      .select("booking_date, time_slot, manage_token, status, amount")
      .eq("id", bookingId)
      .single();
    booking = data;
  }

  const dateLabel = booking ? formatBookingDateId(booking.booking_date) : "";
  const waUrl = booking
    ? buildWhatsAppLink(
        `Halo, saya sudah booking konsultasi tanggal ${dateLabel} jam ${booking.time_slot}. Saya mau koordinasi bahan.`
      )
    : "#";

  const shouldTrackBooking = !!booking && booking.status === "confirmed" && !!bookingId;

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {shouldTrackBooking && (
        <ConsultationTracking bookingId={bookingId as string} value={booking!.amount} />
      )}
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-primary mb-2">Pembayaran berhasil</h1>
          <p className="text-secondary text-sm mb-6">
            Slot konsultasi kamu sudah terkonfirmasi. Detail booking dan link
            untuk mengelola jadwal telah dikirim ke email kamu.
          </p>

          {booking && (
            <div className="rounded-xl border border-white/15 p-4 mb-6 text-left">
              <p className="text-sm text-white/60">
                <span className="text-secondary">Tanggal:</span> {dateLabel}
              </p>
              <p className="text-sm text-white/60 mt-1">
                <span className="text-secondary">Waktu:</span> {booking.time_slot} WIB (2 jam)
              </p>
              <p className="text-sm text-white/60 mt-1">
                <span className="text-secondary">Lokasi:</span> Agroastery Private Bar
              </p>
              <p className="text-xs text-secondary leading-relaxed mt-0.5">{ADDRESS}</p>
            </div>
          )}

          {booking && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block mb-3">
              <Button className="w-full">Koordinasi bahan via WhatsApp</Button>
            </a>
          )}

          {booking && (
            <Link
              href={`/konsultasi/manage/${booking.manage_token}`}
              className="text-sm text-secondary underline-offset-4 hover:underline"
            >
              Kelola booking (ubah jadwal / batalkan)
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

Complete a real (or sandbox) consultation booking + payment end to end. With `window.gtag = console.log` set in devtools, confirm `book_consultation` fires once on the sukses page. Refresh the page — confirm it does **not** fire a second time (sessionStorage guard). Open the same URL in a fresh incognito/private window (new session) — confirm it fires once there too (dedupe is session-scoped, not permanent, matching the spec's "fire once per booking per session").

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass.

- [ ] **Step 5: Typecheck / build**

Run: `pnpm build`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add "app/(root)/konsultasi/sukses/page.tsx" "app/(root)/konsultasi/sukses/ConsultationTracking.tsx"
git commit -m "feat(analytics): fire book_consultation on confirmed booking, session-deduped"
```

---

### Task 8: Environment variable docs

**Files:**
- Modify: `.env.example`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: nothing
- Produces: nothing (documentation only)

- [ ] **Step 1: Add the env var to `.env.example`**

Add a new section near the top of `.env.example` (alongside other `NEXT_PUBLIC_*` vars — check the file for the most relevant existing section, e.g. near Google Maps or a general "Frontend" section) or append a new section:

```bash
# ─── Analytics (GA4) ──────────────────────────────────────────────────────────
# Leave blank to disable all GA4 tracking (wrapper no-ops silently).
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

- [ ] **Step 2: Document in `AGENTS.md`**

In `AGENTS.md`, under the `## Environment Variables` section, add a bullet to the "Required for local dev" list:

```markdown
- GA4 Measurement ID (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, optional — leave blank to disable analytics locally)
```

Under `## Dependencies to Know`, add:

```markdown
- `@next/third-parties` — Google Analytics 4 script injection (`app/layout.tsx`)
```

Optionally add a one-line pointer under the file-structure section of `AGENTS.md` (wherever `lib/` subdirectories are listed) noting `lib/analytics/gtag.ts` as the single source of truth for GA4 events — follow whatever format the existing `lib/` entries use in that file.

- [ ] **Step 3: Commit**

```bash
git add .env.example AGENTS.md
git commit -m "docs(analytics): document NEXT_PUBLIC_GA_MEASUREMENT_ID env var"
```

---

## Post-implementation (manual, owner-side — not part of this plan's automated tasks)

Per the spec's "GA4 console setup" section:
1. Create the GA4 property at analytics.google.com (name "Agroastery", timezone Asia/Jakarta, currency IDR).
2. Add a Web data stream for `agroastery.com`, copy the Measurement ID, confirm Enhanced Measurement is ON.
3. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Railway service variables and local `.env.local`.
4. Mark `purchase` and `book_consultation` as key events (conversions) in the GA4 UI.
5. Walk the full funnel once in production/staging with GA4 DebugView open to confirm end-to-end wiring.
