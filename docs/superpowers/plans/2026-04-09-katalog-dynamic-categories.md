# Katalog Dynamic Category Filter + Legacy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the katalog category filter by deriving categories dynamically from Supabase product data (removing the broken static categories.json lookup), and delete ~13 files of dead legacy static product system code.

**Architecture:** `deriveCategoriesFromProducts` returns `string[]` (unique category names from products); the Aside and Categories components render strings directly; the legacy static JSON product chain (catalog.ts, schemas.ts, stores, constants, data files) is deleted after its remaining import sites in product-card and product-grid are removed.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Vitest (existing test runner), Supabase.

---

### Task 1: Update `deriveCategoriesFromProducts` (TDD)

**Files:**
- Modify: `lib/supabase/queries/products.ts`
- Modify: `lib/supabase/queries/products.test.ts`

- [ ] **Step 1: Replace the existing tests**

Overwrite the entire content of `lib/supabase/queries/products.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { deriveCategoriesFromProducts } from './products';
import type { SupabaseProduct } from '@/types/product';

function makeProduct(category_ids: string[]): SupabaseProduct {
  return {
    id: 'test-id',
    name: 'Test Product',
    slug: 'test-product',
    description: null,
    short_description: null,
    category_ids,
    images: [],
    image_url: null,
    is_active: true,
    product_options: [],
    product_variants: [],
  };
}

describe('deriveCategoriesFromProducts', () => {
  it('returns empty array when no products', () => {
    expect(deriveCategoriesFromProducts([])).toEqual([]);
  });

  it('returns unique category names sorted alphabetically', () => {
    const products = [makeProduct(['Roasted for Filter', 'AG Signature Blend'])];
    expect(deriveCategoriesFromProducts(products)).toEqual([
      'AG Signature Blend',
      'Roasted for Filter',
    ]);
  });

  it('deduplicates category names across multiple products', () => {
    const products = [
      makeProduct(['Roasted for Filter']),
      makeProduct(['Roasted for Filter', 'Fine Robusta']),
    ];
    expect(deriveCategoriesFromProducts(products)).toEqual([
      'Fine Robusta',
      'Roasted for Filter',
    ]);
  });

  it('ignores empty strings in category_ids', () => {
    const products = [makeProduct(['', 'Roasted for Filter', ''])];
    expect(deriveCategoriesFromProducts(products)).toEqual(['Roasted for Filter']);
  });

  it('returns empty array when all products have empty category_ids', () => {
    const products = [makeProduct([]), makeProduct([])];
    expect(deriveCategoriesFromProducts(products)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
pnpm test lib/supabase/queries/products.test.ts 2>&1 | tail -30
```

Expected: failures — the current `deriveCategoriesFromProducts` signature takes `TCategory[]` not `string[]`.

- [ ] **Step 3: Update `deriveCategoriesFromProducts` in `lib/supabase/queries/products.ts`**

Remove these two lines from the top of the file:
```typescript
import { CATEGORY } from "@/constant/category";
import type { TCategory } from "@/types/categories";
```

Replace the entire `deriveCategoriesFromProducts` function (currently lines 67–78):
```typescript
export function deriveCategoriesFromProducts(products: SupabaseProduct[]): string[] {
  const seen = new Set<string>();
  for (const p of products) {
    for (const cat of p.category_ids) {
      if (cat) seen.add(cat);
    }
  }
  return [...seen].sort();
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
pnpm test lib/supabase/queries/products.test.ts 2>&1 | tail -20
```

Expected: 5 tests passing, 0 failing.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/queries/products.ts lib/supabase/queries/products.test.ts
git commit -m "fix(katalog): derive categories dynamically from product names, drop static JSON lookup"
```

---

### Task 2: Update Aside component (desktop sidebar)

**Files:**
- Modify: `components/ui/aside.tsx`

- [ ] **Step 1: Replace the full file content**

```typescript
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AsideProps {
  categories: string[];
  activeCategoryId: string | null;
}

export function Aside({ categories, activeCategoryId }: AsideProps) {
  return (
    <aside className="desktop:block hidden">
      <div className="w-[232px] sticky rounded-xl bg-[#242424] border border-primary p-6">
        <ul className="flex flex-col gap-4">
          <li>
            <Link
              href="/katalog"
              className={cn(
                "text-primary text-sm font-normal block hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                activeCategoryId === null && "bg-primary text-[#242424]",
              )}
            >
              Semua Produk
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat}>
              <Link
                href={`/katalog?category=${encodeURIComponent(cat)}`}
                className={cn(
                  "text-primary text-sm font-normal block hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                  activeCategoryId === cat && "bg-primary text-[#242424]",
                )}
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "aside\|TCategory\|Error" | head -20
```

Expected: no errors from `components/ui/aside.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/aside.tsx
git commit -m "refactor(aside): accept string[] categories instead of TCategory[]"
```

---

### Task 3: Update Categories component (mobile sheet)

**Files:**
- Modify: `components/categories/index.tsx`

- [ ] **Step 1: Replace the full file content**

```typescript
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CategoriesProps {
  categories: string[];
  activeCategoryId: string | null;
}

const Categories = ({ categories, activeCategoryId }: CategoriesProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (category: string | null) => {
    router.push(
      category ? `/katalog?category=${encodeURIComponent(category)}` : "/katalog"
    );
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="px-5 mb-5 desktop:hidden">
        <SheetTrigger className="text-primary rounded-full border bg-[#f5ebc9]/10 border-primary w-full inline-flex justify-between px-4 py-2 text-sm">
          <span>{activeCategoryId ?? "Semua Kategori"}</span>
          <span>▾</span>
        </SheetTrigger>
      </div>

      <SheetContent side="bottom" className="pb-4">
        <SheetHeader className="mb-2">
          <SheetTitle>Kategori</SheetTitle>
        </SheetHeader>

        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
            activeCategoryId === null ? "font-semibold" : "font-normal"
          }`}
          aria-pressed={activeCategoryId === null}
        >
          <span>Semua Kategori</span>
          {activeCategoryId === null && <Check aria-hidden="true" />}
        </button>

        {categories.map((cat) => {
          const active = activeCategoryId === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
                active ? "font-semibold" : "font-normal"
              }`}
              aria-pressed={active}
            >
              <span>{cat}</span>
              {active && <Check aria-hidden="true" />}
            </button>
          );
        })}
      </SheetContent>
    </Sheet>
  );
};

export default Categories;
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "categories\|TCategory\|Error" | head -20
```

Expected: no errors from `components/categories/index.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/categories/index.tsx
git commit -m "refactor(categories): accept string[] categories instead of TCategory[]"
```

---

### Task 4: Remove `selectProductBySlug` from ProductCard

**Files:**
- Modify: `components/ui/product-card.tsx`

- [ ] **Step 1: Replace the full file content**

```typescript
"use client";
import { numberToIdr } from "@/lib/numberToIdr";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface I_ProductCardProps {
  productSlug: string;
  productImage: string;
  productTitle: string;
  productDescription: string;
  productPrice: number;
  onClick?: () => void;
}

export function ProductCard({
  productSlug,
  productDescription,
  productImage,
  productTitle,
  productPrice,
  onClick,
}: I_ProductCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) return onClick();
    router.push(`/product/${productSlug}`);
  };

  return (
    <Card
      className="relative flex flex-col justify-between cursor-pointer"
      role="button"
      onClick={handleClick}
    >
      <div>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl mb-4">
          <div className="w-full h-14 bg-gradient-to-t from-[#252525] absolute bottom-0"></div>
          <div className="w-full h-14 bg-gradient-to-b from-[#252525] absolute top-0"></div>
          <Image
            src={productImage}
            alt={productTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        </div>
        <CardHeader>
          <CardTitle>{productTitle}</CardTitle>
          <CardDescription className="line-clamp-2 text-[#CCC4A9]">
            {productDescription}
          </CardDescription>
        </CardHeader>
      </div>
      <CardFooter>From {numberToIdr({ nominal: productPrice })}</CardFooter>
    </Card>
  );
}
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "product-card\|selectProductBySlug\|Error" | head -20
```

Expected: no errors from `components/ui/product-card.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ui/product-card.tsx
git commit -m "refactor(product-card): remove dead selectProductBySlug store call"
```

---

### Task 5: Remove store fallback from ProductGrid

**Files:**
- Modify: `components/product-grid/index.tsx`

- [ ] **Step 1: Replace the full file content**

```typescript
import { ProductCard } from "@/components/ui/product-card";
import { getMinPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
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
        supabaseProducts.map((item) => (
          <ProductCard
            key={item.slug}
            productSlug={item.slug}
            productTitle={item.name}
            productDescription={item.short_description ?? item.description ?? ""}
            productImage={getProductImageUrl(item)}
            productPrice={getMinPrice(item.product_variants)}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "product-grid\|filteredProducts\|Error" | head -20
```

Expected: no errors from `components/product-grid/index.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/product-grid/index.tsx
git commit -m "refactor(product-grid): remove dead store-based fallback, always use supabaseProducts"
```

---

### Task 6: Delete dead component files

**Files:**
- Delete: `components/section/checkout/index.tsx`
- Delete: `components/section/product-detail/index.tsx`

- [ ] **Step 1: Delete the files**

```bash
rm components/section/checkout/index.tsx
rm components/section/product-detail/index.tsx
```

- [ ] **Step 2: Verify nothing imports them**

```bash
pnpm build 2>&1 | grep "checkout/index\|product-detail/index\|Error" | head -20
```

Expected: no import errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete dead legacy checkout and product-detail components"
```

---

### Task 7: Delete dead store files

**Files:**
- Delete: `lib/stores/category.ts`
- Delete: `lib/stores/product.ts`

- [ ] **Step 1: Delete the files**

```bash
rm lib/stores/category.ts
rm lib/stores/product.ts
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "stores/category\|stores/product\|Error" | head -20
```

Expected: no import errors (both were fully removed from their consumers in Tasks 4 and 5).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete dead legacy category and product nanostores"
```

---

### Task 8: Delete dead constant files

**Files:**
- Delete: `constant/category.ts`
- Delete: `constant/product/product-list.ts`
- Delete: `constant/store-phone-number.ts`

- [ ] **Step 1: Delete the files**

```bash
rm constant/category.ts
rm constant/product/product-list.ts
rm constant/store-phone-number.ts
rmdir constant/product 2>/dev/null || true
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "constant/category\|product-list\|store-phone\|Error" | head -20
```

Expected: no import errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete dead legacy category, product-list, and store-phone constants"
```

---

### Task 9: Delete dead lib files

**Files:**
- Delete: `lib/catalog.ts`
- Delete: `lib/schemas.ts`
- Delete: `lib/message-builder.ts`
- Delete: `lib/catalog.test.ts`

- [ ] **Step 1: Delete the files**

```bash
rm lib/catalog.ts
rm lib/schemas.ts
rm lib/message-builder.ts
rm lib/catalog.test.ts
```

- [ ] **Step 2: Build check**

```bash
pnpm build 2>&1 | grep "catalog\|schemas\|message-builder\|Error" | head -20
```

Expected: no import errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete dead legacy catalog loader, schemas, and WhatsApp message builder"
```

---

### Task 10: Delete dead data files, types, and trim types/product.ts

**Files:**
- Delete: `data/categories.json`
- Delete: `data/products.json`
- Delete: `types/categories.ts`
- Modify: `types/product.ts`

- [ ] **Step 1: Delete the data and types files**

```bash
rm data/categories.json
rm data/products.json
rm types/categories.ts
```

- [ ] **Step 2: Trim `types/product.ts`**

Replace the full file content with only the Supabase types (remove `TVariant`, `TProductBase`, `TProduct`):

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
  product_options: SupabaseProductOption[];
  product_variants: SupabaseProductVariant[];
};
```

- [ ] **Step 3: Full build check**

```bash
pnpm build 2>&1 | tail -30
```

Expected: exit 0, zero TypeScript errors (pre-existing `@typescript-eslint/no-explicit-any` in `lib/supabase/queries/profiles.test.ts` is unrelated — ignore it).

- [ ] **Step 4: Run tests**

```bash
pnpm test 2>&1 | tail -20
```

Expected: `lib/supabase/queries/products.test.ts` — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete dead static product data files and legacy TProduct types"
```

---

### Verification

1. `pnpm dev` → open `http://localhost:3000/katalog`
2. **Desktop sidebar:** "Semua Produk" + "Roasted for Filter" visible
3. **Mobile sheet:** tap the category button → "Semua Kategori" + "Roasted for Filter" listed
4. Click "Roasted for Filter" → URL becomes `/katalog?category=Roasted+for+Filter`, only matching products shown
5. Click "Semua Produk" / "Semua Kategori" → all products shown
6. Navigate to `/product/[slug]` → product detail still loads correctly
7. Navigate to `/checkout` → new unified checkout still works
