# Discount Feature Design

## Overview

Automatic discount system for Agroastery e-commerce. Discounts can be **global** (apply per-item to all products where `products.is_global = true`) or **per-product**. Discount types: **percentage** or **fixed nominal** (IDR). Discounts stack when both global and product-level exist.

## Requirements

- **Scope:** Global or per-product
- **Type:** Percentage or nominal (IDR)
- **Stacking:** Global + product-level discounts both apply (sequential)
- **Trigger:** Automatic — no coupon codes
- **Activation:** `is_active` toggle, no date ranges
- **Visibility:** Discounted prices shown everywhere — catalog, product detail, cart, checkout — with strikethrough on original price
- **Management:** Supabase dashboard (manual DB edits), no admin UI
- **Global eligibility:** Only products with `products.is_global = true` receive global discounts

## Database Schema

```sql
-- Global discounts: apply per-item to all products where products.is_global = true
CREATE TABLE global_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- e.g. "Ramadan Sale 2026"
  type TEXT NOT NULL CHECK (type IN ('percentage', 'nominal')),
  value BIGINT NOT NULL,                 -- percentage: 10 = 10%, nominal: 5000 = Rp 5,000
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product-specific discounts: apply to one specific product's variants
CREATE TABLE product_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- e.g. "Arabica Toraja Promo"
  type TEXT NOT NULL CHECK (type IN ('percentage', 'nominal')),
  value BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_global_discounts_active ON global_discounts(is_active) WHERE is_active = true;
CREATE INDEX idx_product_discounts_product ON product_discounts(product_id);
CREATE INDEX idx_product_discounts_active ON product_discounts(is_active) WHERE is_active = true;
```

- **No RLS** on either table (same pattern as products — read server-side via service role key)
- `value` for percentage is a whole number (10 = 10%), for nominal it's IDR (5000 = Rp 5,000)

## Discount Calculation Logic

### Stacking Order

1. Start with `product_variants.price` (original price)
2. Apply all active `product_discounts` for that product (in creation order)
3. Apply all active `global_discounts` (only if `product.is_global = true`)

### Calculation Rules

- **Percentage:** `discount_amount = floor(current_price * value / 100)`
- **Nominal:** `discount_amount = value`
- Each discount reduces the running price — subsequent discounts apply to the already-reduced price
- Floor price is **Rp 0** — price can never go negative (`Math.max(0, price)`)

### Example

Variant price Rp 100,000 with product discount 10% + global discount Rp 5,000:

1. Product discount: `floor(100,000 * 10 / 100)` = Rp 10,000 → price becomes Rp 90,000
2. Global discount: Rp 5,000 → final price **Rp 85,000**

## Data Flow & Integration Points

### Product Query Layer (`lib/supabase/queries/`)

- New `discounts.ts`: fetches active `global_discounts` and `product_discounts`
- `getProducts()` and `getProductBySlug()` fetch discounts alongside products
- Each variant is enriched with `discounted_price` alongside existing `price`

### Discount Utility (`lib/utils/discount.ts`)

Pure function that computes final discounted price given:
- Variant price (BIGINT)
- Array of applicable product discounts
- Array of applicable global discounts (only if `is_global = true`)

Returns `{ discountedPrice: number, hasDiscount: boolean }`

### Catalog Page (`/katalog`)

- Display `discounted_price` as the shown price
- If `discounted_price < price`: show original price with strikethrough + discount badge

### Product Detail Page (`/product/[slug]`)

- Same strikethrough pattern on selected variant's price
- Discount info visible before add-to-cart

### Cart Store (`lib/stores/cart.ts`)

- `CartItem.unitPrice` set to `discounted_price` when adding to cart
- New `CartItem.originalPrice` field to support strikethrough display in cart
- Cart UI displays both prices per line item when discounted

### Checkout Page

- Cart summary shows discounted prices (from cart store)
- Line items display original + discounted prices

### Checkout API (`/api/checkout`)

- Re-fetches active discounts and recalculates `discounted_price` server-side
- Uses server-calculated prices for `ecom_order_items.unit_price` and order totals
- Does **not** trust client-sent `unitPrice`

### Order Records

- `ecom_order_items.unit_price` stores the final discounted price (what the customer paid)
- No separate discount column on order items — discount is baked into unit price at time of purchase

## Edge Cases

### Discount toggled off mid-session
- Catalog/product pages fetch fresh data on each load — updated prices shown immediately
- Cart may hold stale `unitPrice` — checkout API re-validates server-side and uses recalculated price. Order is created at current correct price. No error shown.

### Product removed from `is_global` while global discount is active
- Global discount stops applying to that product on next fetch. No cleanup needed.

### Discount makes price zero or negative
- Clamped at Rp 0 via `Math.max(0, price)`.

### Multiple global discounts active simultaneously
- They all stack (applied sequentially). In practice, typically one active at a time. No enforcement in code.

### Multiple product discounts on the same product
- Stack sequentially. Controlled via Supabase dashboard.

### `compare_at_price` on variants
- When an active discount exists, the original `price` becomes the strikethrough price (ignore `compare_at_price`). When no discount is active, `compare_at_price` behaves as before.

## Files to Create/Modify

### New Files
- `lib/supabase/queries/discounts.ts` — fetch active discounts from Supabase
- `lib/utils/discount.ts` — pure discount calculation function
- Supabase migration for `global_discounts` and `product_discounts` tables

### Modified Files
- `lib/supabase/queries/products.ts` — integrate discount fetching into product queries
- `lib/supabase/queries/productUtils.ts` — update price helpers for discount-aware pricing
- `types/product.ts` — add discount-related types and extend variant type with `discounted_price`
- `lib/stores/cart.ts` — add `originalPrice` to `CartItem`
- `app/(root)/checkout/page.tsx` — display strikethrough prices in checkout summary
- `app/api/checkout/route.ts` — server-side discount re-validation
- Catalog and product detail components — strikethrough + discount badge UI
