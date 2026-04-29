# Discount Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic discount system — global discounts (per-item on `is_global` products) and product-specific discounts — with stacking, visible everywhere from catalog through checkout.

**Architecture:** Two new DB tables (`global_discounts`, `product_discounts`) fetched server-side via service role. A pure utility function computes stacked discounted prices. Product queries enrich variants with `discounted_price`. Cart stores both original and discounted price. Checkout API re-validates discounts server-side.

**Tech Stack:** Supabase (PostgreSQL), Next.js 15, TypeScript, Nanostores, Vitest

---

### Task 1: Discount Types & Calculation Utility

**Files:**
- Create: `types/discount.ts`
- Create: `lib/utils/discount.ts`
- Create: `__tests__/discount.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/discount.spec.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calculateDiscountedPrice } from "@/lib/utils/discount";
import type { Discount } from "@/types/discount";

describe("calculateDiscountedPrice", () => {
  it("returns original price when no discounts", () => {
    const result = calculateDiscountedPrice(100000, [], []);
    expect(result).toEqual({ discountedPrice: 100000, hasDiscount: false });
  });

  it("applies a single percentage product discount", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo", type: "percentage", value: 10, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 90000, hasDiscount: true });
  });

  it("applies a single nominal product discount", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo", type: "nominal", value: 15000, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });

  it("stacks product discount then global discount sequentially", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Product Promo", type: "percentage", value: 10, is_active: true },
    ];
    const globalDiscounts: Discount[] = [
      { id: "2", name: "Global Promo", type: "nominal", value: 5000, is_active: true },
    ];
    // 100000 → 90000 (10% off) → 85000 (5000 off)
    const result = calculateDiscountedPrice(100000, productDiscounts, globalDiscounts);
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });

  it("stacks multiple product discounts sequentially", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo A", type: "percentage", value: 10, is_active: true },
      { id: "2", name: "Promo B", type: "nominal", value: 5000, is_active: true },
    ];
    // 100000 → 90000 (10% off) → 85000 (5000 off)
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 85000, hasDiscount: true });
  });

  it("floors price at 0 when discount exceeds price", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Big Promo", type: "nominal", value: 200000, is_active: true },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 0, hasDiscount: true });
  });

  it("uses floor for percentage calculation (no fractional IDR)", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Promo", type: "percentage", value: 33, is_active: true },
    ];
    // floor(100000 * 33 / 100) = floor(33000) = 33000
    // 100000 - 33000 = 67000
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 67000, hasDiscount: true });
  });

  it("filters out inactive discounts", () => {
    const productDiscounts: Discount[] = [
      { id: "1", name: "Inactive", type: "percentage", value: 50, is_active: false },
    ];
    const result = calculateDiscountedPrice(100000, productDiscounts, []);
    expect(result).toEqual({ discountedPrice: 100000, hasDiscount: false });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/discount.spec.ts`
Expected: FAIL — module `@/lib/utils/discount` not found

- [ ] **Step 3: Create discount types**

Create `types/discount.ts`:

```typescript
export type DiscountType = "percentage" | "nominal";

export type Discount = {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  is_active: boolean;
};

export type GlobalDiscount = Discount;

export type ProductDiscount = Discount & {
  product_id: string;
};

export type DiscountResult = {
  discountedPrice: number;
  hasDiscount: boolean;
};
```

- [ ] **Step 4: Implement calculateDiscountedPrice**

Create `lib/utils/discount.ts`:

```typescript
import type { Discount, DiscountResult } from "@/types/discount";

function applyDiscount(price: number, discount: Discount): number {
  if (discount.type === "percentage") {
    return price - Math.floor(price * discount.value / 100);
  }
  return price - discount.value;
}

export function calculateDiscountedPrice(
  originalPrice: number,
  productDiscounts: Discount[],
  globalDiscounts: Discount[]
): DiscountResult {
  const activeProductDiscounts = productDiscounts.filter((d) => d.is_active);
  const activeGlobalDiscounts = globalDiscounts.filter((d) => d.is_active);

  if (activeProductDiscounts.length === 0 && activeGlobalDiscounts.length === 0) {
    return { discountedPrice: originalPrice, hasDiscount: false };
  }

  let price = originalPrice;

  // Apply product discounts first
  for (const discount of activeProductDiscounts) {
    price = Math.max(0, applyDiscount(price, discount));
  }

  // Then apply global discounts
  for (const discount of activeGlobalDiscounts) {
    price = Math.max(0, applyDiscount(price, discount));
  }

  return { discountedPrice: price, hasDiscount: price !== originalPrice };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/discount.spec.ts`
Expected: All 8 tests PASS

- [ ] **Step 6: Commit**

```bash
git add types/discount.ts lib/utils/discount.ts __tests__/discount.spec.ts
git commit -m "feat(discount): add discount types and calculation utility with tests"
```

---

### Task 2: Supabase Migration — Create Discount Tables

**Files:**
- Create: Supabase migration (via MCP `apply_migration`)

- [ ] **Step 1: Apply migration to create `global_discounts` and `product_discounts` tables**

Run migration SQL:

```sql
-- Global discounts: apply per-item to all products where products.is_global = true
CREATE TABLE global_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'nominal')),
  value BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product-specific discounts: apply to one specific product's variants
CREATE TABLE product_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
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

- [ ] **Step 2: Regenerate Supabase TypeScript types**

Run: `npx supabase gen types typescript --project-id <project-id> > types/supabase.ts`
Then copy to `lib/supabase/types.ts` if that's the convention.

- [ ] **Step 3: Commit**

```bash
git add types/supabase.ts lib/supabase/types.ts
git commit -m "feat(discount): add global_discounts and product_discounts tables"
```

---

### Task 3: Discount Query Layer

**Files:**
- Create: `lib/supabase/queries/discounts.ts`
- Modify: `types/product.ts` — add `is_global` and `discounted_price` fields
- Modify: `lib/supabase/queries/products.ts` — add `is_global` to select, integrate discounts
- Modify: `lib/supabase/queries/productUtils.ts` — update `getMinPrice` for discounted prices

- [ ] **Step 1: Create discount query functions**

Create `lib/supabase/queries/discounts.ts`:

```typescript
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { GlobalDiscount, ProductDiscount } from "@/types/discount";

export async function getActiveGlobalDiscounts(): Promise<GlobalDiscount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("global_discounts")
    .select("id, name, type, value, is_active")
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getActiveGlobalDiscounts error:", error);
    return [];
  }

  return (data ?? []) as GlobalDiscount[];
}

export async function getActiveProductDiscounts(): Promise<ProductDiscount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_discounts")
    .select("id, product_id, name, type, value, is_active")
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getActiveProductDiscounts error:", error);
    return [];
  }

  return (data ?? []) as ProductDiscount[];
}

export async function getActiveProductDiscountsByProductId(
  productId: string
): Promise<ProductDiscount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_discounts")
    .select("id, product_id, name, type, value, is_active")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getActiveProductDiscountsByProductId error:", error);
    return [];
  }

  return (data ?? []) as ProductDiscount[];
}
```

- [ ] **Step 2: Update `types/product.ts` — add `is_global` and discount fields**

Add `is_global` to `SupabaseProduct` and `discounted_price` to `SupabaseProductVariant`:

```typescript
// In SupabaseProductVariant, add:
  discounted_price?: number;

// In SupabaseProduct, add:
  is_global: boolean;
```

Full updated `types/product.ts`:

```typescript
// ============================================================
// Supabase-based types
// ============================================================

export type SupabaseOptionValue = {
  id: string;
  value: string;
  display_order: number;
};

export type SupabaseProductOption = {
  id: string;
  name: string;
  display_order: number;
  product_option_values: SupabaseOptionValue[];
};

export type SupabaseProductVariant = {
  id: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  ship_weight_grams: number;
  is_active: boolean;
  product_variant_option_values: { option_value_id: string }[];
  discounted_price?: number;
};

export type SupabaseProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_ids: string[];
  images: { url: string; alt?: string; sort_order?: number }[];
  image_url: string | null;
  is_active: boolean;
  is_global: boolean;
  product_options: SupabaseProductOption[];
  product_variants: SupabaseProductVariant[];
};
```

- [ ] **Step 3: Update `lib/supabase/queries/products.ts` — add `is_global` to select and enrich variants with discounted prices**

Update `PRODUCT_SELECT` to include `is_global`:

```typescript
const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  short_description,
  category_ids,
  images,
  image_url,
  is_active,
  is_global,
  product_options (
    id, name, display_order,
    product_option_values (id, value, display_order)
  ),
  product_variants (
    id, sku, price, compare_at_price, stock_quantity, ship_weight_grams, is_active,
    product_variant_option_values (option_value_id)
  )
`;
```

Add a helper to enrich products with discounted prices, and update `getProducts` and `getProductBySlug`:

```typescript
import { getActiveGlobalDiscounts, getActiveProductDiscounts, getActiveProductDiscountsByProductId } from "./discounts";
import { calculateDiscountedPrice } from "@/lib/utils/discount";
import type { ProductDiscount, GlobalDiscount } from "@/types/discount";

function enrichProductWithDiscounts(
  product: SupabaseProduct,
  productDiscounts: ProductDiscount[],
  globalDiscounts: GlobalDiscount[]
): SupabaseProduct {
  const applicableProductDiscounts = productDiscounts.filter(
    (d) => d.product_id === product.id
  );
  const applicableGlobalDiscounts = product.is_global ? globalDiscounts : [];

  return {
    ...product,
    product_variants: product.product_variants.map((variant) => {
      const { discountedPrice } = calculateDiscountedPrice(
        variant.price,
        applicableProductDiscounts,
        applicableGlobalDiscounts
      );
      return {
        ...variant,
        discounted_price: discountedPrice !== variant.price ? discountedPrice : undefined,
      };
    }),
  };
}

export async function getProducts(): Promise<SupabaseProduct[]> {
  const supabase = createSupabaseAdminClient();

  const [productsResult, globalDiscounts, productDiscounts] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .not("slug", "is", null)
      .order("name"),
    getActiveGlobalDiscounts(),
    getActiveProductDiscounts(),
  ]);

  if (productsResult.error) {
    console.error("getProducts error:", productsResult.error);
    return [];
  }

  const products = (productsResult.data ?? []) as unknown as SupabaseProduct[];
  return products
    .filter((p) => p.product_variants?.some((v) => v.is_active))
    .map((p) => enrichProductWithDiscounts(p, productDiscounts, globalDiscounts));
}

export async function getProductBySlug(slug: string): Promise<SupabaseProduct | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("getProductBySlug error:", error);
    }
    return null;
  }

  const product = data as unknown as SupabaseProduct;
  const [globalDiscounts, productDiscounts] = await Promise.all([
    getActiveGlobalDiscounts(),
    getActiveProductDiscountsByProductId(product.id),
  ]);

  return enrichProductWithDiscounts(product, productDiscounts, globalDiscounts);
}
```

- [ ] **Step 4: Update `getMinPrice` in `productUtils.ts`**

Update to return both min price and min discounted price:

```typescript
export function getMinPrice(variants: SupabaseProductVariant[]): number {
  const activePrices = variants.filter((v) => v.is_active).map((v) => v.discounted_price ?? v.price);
  return activePrices.length > 0 ? Math.min(...activePrices) : 0;
}

export function getMinOriginalPrice(variants: SupabaseProductVariant[]): number {
  const activePrices = variants.filter((v) => v.is_active).map((v) => v.price);
  return activePrices.length > 0 ? Math.min(...activePrices) : 0;
}

export function hasAnyDiscount(variants: SupabaseProductVariant[]): boolean {
  return variants.some((v) => v.is_active && v.discounted_price !== undefined);
}
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with no errors

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/queries/discounts.ts types/product.ts lib/supabase/queries/products.ts lib/supabase/queries/productUtils.ts
git commit -m "feat(discount): add discount query layer and enrich products with discounted prices"
```

---

### Task 4: Update Cart Store — Add `originalPrice`

**Files:**
- Modify: `lib/stores/cart.ts` — add `originalPrice` to `CartItem`
- Modify: `lib/hooks/useCart.ts` — update if needed

- [ ] **Step 1: Update `CartItem` type in `lib/stores/cart.ts`**

Add `originalPrice` field:

```typescript
export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantDescription: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  shipWeightGrams: number;
  image: string;
};
```

`unitPrice` will now hold the discounted price (or same as `originalPrice` if no discount). `originalPrice` always holds the original variant price. No changes needed to `addToCart`, `getCartTotal`, etc. — they already use `unitPrice` which will be the discounted price.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Errors in files that construct `CartItem` without `originalPrice` — that's expected, we fix them in the next task.

- [ ] **Step 3: Commit**

```bash
git add lib/stores/cart.ts
git commit -m "feat(discount): add originalPrice field to CartItem type"
```

---

### Task 5: Update Product Detail Page — Discount-Aware Pricing

**Files:**
- Modify: `components/section/product-detail/SupabaseProductDetail.tsx`

- [ ] **Step 1: Update price calculation to use `discounted_price`**

At line 82, change:

```typescript
// Before:
const unitPrice = matchedVariant?.price ?? getMinPrice(activeVariants);

// After:
const unitPrice = matchedVariant
  ? (matchedVariant.discounted_price ?? matchedVariant.price)
  : getMinPrice(activeVariants);
const originalPrice = matchedVariant?.price ?? getMinOriginalPrice(activeVariants);
const hasDiscount = unitPrice < originalPrice;
```

Add import for `getMinOriginalPrice`:

```typescript
import { findMatchingVariant, getMinPrice, getProductImageUrl, getMinOriginalPrice } from "@/lib/supabase/queries/productUtils";
```

- [ ] **Step 2: Update price display to show strikethrough**

At line 139-141, change the price display:

```tsx
{/* Before: */}
<div className="text-lg tablet:text-xl desktop:text-2xl font-extrabold text-secondary">
  {numberToIdr({ nominal: unitPrice })}
</div>

{/* After: */}
<div className="flex items-baseline gap-2">
  <span className="text-lg tablet:text-xl desktop:text-2xl font-extrabold text-secondary">
    {numberToIdr({ nominal: unitPrice })}
  </span>
  {hasDiscount && (
    <span className="text-sm text-gray-400 line-through">
      {numberToIdr({ nominal: originalPrice })}
    </span>
  )}
</div>
```

- [ ] **Step 3: Update `handleAddToCart` to pass both prices**

At line 104-116, update `addToCart` call:

```typescript
function handleAddToCart() {
  if (!matchedVariant || !inStock) return;
  const imageUrl = getProductImageUrl(product);
  addToCart({
    variantId: matchedVariant.id,
    productSlug: product.slug,
    productName: product.name,
    variantDescription,
    unitPrice: matchedVariant.discounted_price ?? matchedVariant.price,
    originalPrice: matchedVariant.price,
    quantity: qty,
    shipWeightGrams: matchedVariant.ship_weight_grams,
    image: imageUrl,
  });
  setAddedToCart(true);
  setTimeout(() => setAddedToCart(false), 2000);
}
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/section/product-detail/SupabaseProductDetail.tsx
git commit -m "feat(discount): show discounted prices on product detail page"
```

---

### Task 6: Update Product Card & Catalog — Discount Display

**Files:**
- Modify: `components/ui/product-card.tsx` — add `originalPrice` prop and strikethrough
- Modify: `components/product-grid/index.tsx` — pass `originalPrice` and discount info

- [ ] **Step 1: Update `ProductCard` props and display**

Update `components/ui/product-card.tsx`:

Add `originalPrice` to the props interface:

```typescript
interface I_ProductCardProps {
  productSlug: string;
  productImage: string;
  productTitle: string;
  productDescription: string;
  productPrice: number;
  originalPrice?: number;
  onClick?: () => void;
}
```

Update the destructured props:

```typescript
export function ProductCard({
  productSlug,
  productDescription,
  productImage,
  productTitle,
  productPrice,
  originalPrice,
  onClick,
}: I_ProductCardProps) {
```

Update `CardFooter` (line 62):

```tsx
{/* Before: */}
<CardFooter>From {numberToIdr({ nominal: productPrice })}</CardFooter>

{/* After: */}
<CardFooter>
  <span>From {numberToIdr({ nominal: productPrice })}</span>
  {originalPrice !== undefined && originalPrice > productPrice && (
    <span className="ml-2 text-xs text-gray-400 line-through">
      {numberToIdr({ nominal: originalPrice })}
    </span>
  )}
</CardFooter>
```

- [ ] **Step 2: Update `ProductGrid` to pass discount info**

Update `components/product-grid/index.tsx`:

```typescript
import { ProductCard } from "@/components/ui/product-card";
import { getMinPrice, getMinOriginalPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import type { SupabaseProduct } from "@/types/product";

interface ProductGridProps {
  supabaseProducts: SupabaseProduct[];
}

export default function ProductGrid({ supabaseProducts }: ProductGridProps) {
  return (
    <div className="px-6 pb-6 grid gap-4 grid-cols-2 tablet:grid-cols-3 tablet:pl-6 tablet:pr-0 desktop:pr-0 desktop:pl-6 desktop:grid-cols-4">
      {supabaseProducts.length === 0 ? (
        <div className="col-span-full text-secondary text-center py-12">
          Produk tidak ditemukan
        </div>
      ) : (
        supabaseProducts.map((item) => {
          const minPrice = getMinPrice(item.product_variants);
          const minOriginalPrice = getMinOriginalPrice(item.product_variants);
          return (
            <ProductCard
              key={item.slug}
              productSlug={item.slug}
              productTitle={item.name}
              productDescription={item.short_description ?? item.description ?? ""}
              productImage={getProductImageUrl(item)}
              productPrice={minPrice}
              originalPrice={minOriginalPrice > minPrice ? minOriginalPrice : undefined}
            />
          );
        })
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/ui/product-card.tsx components/product-grid/index.tsx
git commit -m "feat(discount): show discounted prices on catalog product cards"
```

---

### Task 7: Update Cart Page — Strikethrough Prices

**Files:**
- Modify: `app/(root)/cart/page.tsx`

- [ ] **Step 1: Update cart item price display**

In `app/(root)/cart/page.tsx`, update the three places where `item.unitPrice` is displayed:

At line 87 (individual item price):

```tsx
{/* Before: */}
<p className="text-primary text-sm font-semibold mt-1">
  {numberToIdr({ nominal: item.unitPrice })}
</p>

{/* After: */}
<div className="flex items-baseline gap-1.5 mt-1">
  <p className="text-primary text-sm font-semibold">
    {numberToIdr({ nominal: item.unitPrice })}
  </p>
  {item.originalPrice > item.unitPrice && (
    <p className="text-xs text-gray-400 line-through">
      {numberToIdr({ nominal: item.originalPrice })}
    </p>
  )}
</div>
```

Lines 112 and 143 show `item.unitPrice * item.quantity` — these are the line totals and are correct as-is since `unitPrice` is already the discounted price.

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/(root)/cart/page.tsx
git commit -m "feat(discount): show strikethrough original price in cart"
```

---

### Task 8: Update Checkout Page — Discount Display in Order Summary

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

- [ ] **Step 1: Update checkout order summary line items**

At line 391-396, update the line item display to show strikethrough:

```tsx
{/* Before: */}
{cartItems.map((item) => (
  <div key={item.variantId} className="flex items-start gap-3">
    {/* ... image and info ... */}
    <span className="text-primary text-sm font-semibold shrink-0">
      {numberToIdr({ nominal: item.unitPrice * item.quantity })}
    </span>
  </div>
))}

{/* After: */}
{cartItems.map((item) => (
  <div key={item.variantId} className="flex items-start gap-3">
    {/* ... image and info ... */}
    <div className="text-right shrink-0">
      <span className="text-primary text-sm font-semibold">
        {numberToIdr({ nominal: item.unitPrice * item.quantity })}
      </span>
      {item.originalPrice > item.unitPrice && (
        <div className="text-xs text-gray-400 line-through">
          {numberToIdr({ nominal: item.originalPrice * item.quantity })}
        </div>
      )}
    </div>
  </div>
))}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/(root)/checkout/page.tsx
git commit -m "feat(discount): show strikethrough prices in checkout order summary"
```

---

### Task 9: Update Checkout API — Server-Side Discount Validation

**Files:**
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Import discount functions**

Add imports at the top of `app/api/checkout/route.ts`:

```typescript
import { getActiveGlobalDiscounts, getActiveProductDiscounts } from "@/lib/supabase/queries/discounts";
import { calculateDiscountedPrice } from "@/lib/utils/discount";
```

- [ ] **Step 2: Fetch active discounts alongside variant validation**

After the `dbVariants` fetch (around line 71-74), add a parallel fetch for discounts. Also add `is_global` to the products fetch. Update the products query (around line 95-97):

```typescript
// Replace the existing product+description fetches with a parallel Promise.all:
const [{ data: dbProducts }, { data: dbOptionValues }, globalDiscounts, allProductDiscounts] = await Promise.all([
  admin
    .from("products")
    .select("id, name, is_global")
    .in("id", productIds),
  admin
    .from("product_variant_option_values")
    .select("variant_id, product_option_values(value)")
    .in("variant_id", variantIds),
  getActiveGlobalDiscounts(),
  getActiveProductDiscounts(),
]);
```

- [ ] **Step 3: Update subtotal calculation to use discounted prices**

Replace the subtotal calculation (around line 121-124):

```typescript
// Calculate totals using server-side discounted prices
const subtotal = data.items.reduce((sum, item) => {
  const dbVariant = variantMap.get(item.variantId)!;
  const productId = dbVariant.product_id as string;
  const product = (dbProducts ?? []).find((p) => p.id === productId);
  const isGlobal = product?.is_global ?? false;

  const applicableProductDiscounts = allProductDiscounts.filter(
    (d) => d.product_id === productId
  );
  const applicableGlobalDiscounts = isGlobal ? globalDiscounts : [];

  const { discountedPrice } = calculateDiscountedPrice(
    dbVariant.price as number,
    applicableProductDiscounts,
    applicableGlobalDiscounts
  );

  return sum + discountedPrice * item.quantity;
}, 0);
```

- [ ] **Step 4: Update `verifiedItems` to use discounted prices**

Update the `verifiedItems` mapping (around line 162-174):

```typescript
const verifiedItems = data.items.map((item) => {
  const dbVariant = variantMap.get(item.variantId)!;
  const productId = dbVariant.product_id as string;
  const productName = productMap.get(productId) ?? "Unknown Product";
  const variantDescription = variantDescriptionMap.get(item.variantId) ?? "";
  const product = (dbProducts ?? []).find((p) => p.id === productId);
  const isGlobal = product?.is_global ?? false;

  const applicableProductDiscounts = allProductDiscounts.filter(
    (d) => d.product_id === productId
  );
  const applicableGlobalDiscounts = isGlobal ? globalDiscounts : [];

  const { discountedPrice } = calculateDiscountedPrice(
    dbVariant.price as number,
    applicableProductDiscounts,
    applicableGlobalDiscounts
  );

  return {
    variantId: item.variantId,
    productName,
    variantDescription,
    unitPrice: discountedPrice,
    quantity: item.quantity,
    shipWeightGrams: dbVariant.ship_weight_grams as number,
  };
});
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "feat(discount): server-side discount validation in checkout API"
```

---

### Task 10: Export Updates & Final Verification

**Files:**
- Modify: `lib/supabase/queries/products.ts` — update exports
- Modify: `lib/supabase/queries/productUtils.ts` — update exports

- [ ] **Step 1: Ensure all new functions are properly exported**

Verify `lib/supabase/queries/products.ts` exports include the new functions:

```typescript
export { findMatchingVariant, getMinPrice, getMinOriginalPrice, hasAnyDiscount, getProductImageUrl } from "./productUtils";
```

- [ ] **Step 2: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Manual smoke test checklist**

Verify in the browser:
- Catalog page shows discounted prices with strikethrough (when discounts exist in DB)
- Product detail page shows discounted price with strikethrough original
- Adding to cart stores the discounted price as `unitPrice` and original as `originalPrice`
- Cart page shows both prices with strikethrough
- Checkout order summary shows both prices
- Checkout API uses server-calculated discounted prices (check order in Supabase)

- [ ] **Step 5: Final commit**

```bash
git add lib/supabase/queries/products.ts lib/supabase/queries/productUtils.ts
git commit -m "feat(discount): finalize exports and complete discount feature"
```
