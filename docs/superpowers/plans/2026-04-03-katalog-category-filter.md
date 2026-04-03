# Katalog Category Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded static category list in the `/katalog` sidebar with categories derived from live Supabase product data, and make category filtering server-side via URL search params.

**Architecture:** The `katalog/page.tsx` server component reads `?category=X` from `searchParams`, fetches all active products once, derives visible categories from their `category_ids`, filters the product list server-side, then passes everything as props to `Aside`, `Categories`, and `ProductGrid`. Category clicks navigate to a new URL, triggering a full server re-render.

**Tech Stack:** Next.js 15 App Router (server components, `searchParams` as Promise), Next.js `<Link>`, `useRouter` from `next/navigation`, nanostores removed from affected components, Vitest for tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/supabase/queries/products.ts` | Modify | Add `deriveCategoriesFromProducts()` pure utility |
| `lib/supabase/queries/products.test.ts` | Create | Unit tests for `deriveCategoriesFromProducts()` |
| `app/(root)/katalog/page.tsx` | Modify | Read searchParams, derive categories, filter products, pass props |
| `components/ui/aside.tsx` | Modify | Remove nanostore; accept props; become server component with `<Link>` |
| `components/categories/index.tsx` | Modify | Remove nanostore; accept props; use `useRouter` for navigation |

---

## Task 1: Add `deriveCategoriesFromProducts` utility

**Files:**
- Modify: `lib/supabase/queries/products.ts`
- Create: `lib/supabase/queries/products.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// lib/supabase/queries/products.test.ts
import { describe, it, expect } from 'vitest';
import { deriveCategoriesFromProducts } from './products';
import type { SupabaseProduct } from '@/types/product';
import type { TCategory } from '@/types/categories';

const ALL_CATEGORIES: TCategory[] = [
  { category_id: '1', category_name: 'Kopi Susu' },
  { category_id: '2', category_name: 'AG Signature' },
  { category_id: '3', category_name: 'Full Arabica' },
];

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
    const result = deriveCategoriesFromProducts([], ALL_CATEGORIES);
    expect(result).toEqual([]);
  });

  it('returns only categories that appear in at least one product', () => {
    const products = [makeProduct(['1', '3'])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1', '3']);
  });

  it('preserves the order defined in allCategories, not the order in products', () => {
    const products = [makeProduct(['3', '1'])]; // reversed order in product
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1', '3']); // still in allCategories order
  });

  it('deduplicates category_ids across multiple products', () => {
    const products = [makeProduct(['1', '2']), makeProduct(['1', '3'])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1', '2', '3']);
  });

  it('ignores category_ids that do not exist in allCategories', () => {
    const products = [makeProduct(['1', 'unknown-id'])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1']);
  });

  it('returns empty array when products have empty category_ids', () => {
    const products = [makeProduct([]), makeProduct([])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node vitest-runner.js lib/supabase/queries/products.test.ts
```

Expected: FAIL with "deriveCategoriesFromProducts is not a function" or similar.

- [ ] **Step 3: Add the import and function to `lib/supabase/queries/products.ts`**

At the top of `lib/supabase/queries/products.ts`, add this import after the existing imports:

```typescript
import { CATEGORY } from '@/constant/category';
import type { TCategory } from '@/types/categories';
```

After the `getProductBySlug` function, add:

```typescript
export function deriveCategoriesFromProducts(
  products: SupabaseProduct[],
  allCategories: TCategory[] = CATEGORY
): TCategory[] {
  const seenIds = new Set<string>();
  for (const p of products) {
    for (const id of p.category_ids) {
      seenIds.add(id);
    }
  }
  return allCategories.filter((c) => seenIds.has(c.category_id));
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node vitest-runner.js lib/supabase/queries/products.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/queries/products.ts lib/supabase/queries/products.test.ts
git commit -m "feat: add deriveCategoriesFromProducts utility with tests"
```

---

## Task 2: Update `katalog/page.tsx` to use searchParams and pass props

**Files:**
- Modify: `app/(root)/katalog/page.tsx`

- [ ] **Step 1: Replace the page component**

Replace the entire content of `app/(root)/katalog/page.tsx` with:

```typescript
import Categories from "@/components/categories";
import Navigation from "@/components/navigation";
import ProductGrid from "@/components/product-grid";
import { Aside } from "@/components/ui/aside";
import { Footer } from "@/components/ui/footer";
import { getProducts, deriveCategoriesFromProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allProducts = await getProducts();
  const categories = deriveCategoriesFromProducts(allProducts);
  const filteredProducts = category
    ? allProducts.filter((p) => p.category_ids.includes(category))
    : allProducts;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 tablet:px-10 desktop:px-20">
        <Categories categories={categories} activeCategoryId={category ?? null} />
        <div className="flex justify-between w-full">
          <Aside categories={categories} activeCategoryId={category ?? null} />
          <ProductGrid supabaseProducts={filteredProducts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Confirm the build compiles (TypeScript will catch prop mismatches)**

```bash
npx tsc --noEmit
```

Expected: errors about `Aside` and `Categories` not accepting the new props yet. That is expected — we fix them in the next tasks.

- [ ] **Step 3: Commit**

```bash
git add app/(root)/katalog/page.tsx
git commit -m "feat: derive categories from Supabase products and filter via URL searchParams"
```

---

## Task 3: Refactor `Aside` to a server component with `<Link>`

**Files:**
- Modify: `components/ui/aside.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TCategory } from "@/types/categories";

interface AsideProps {
  categories: TCategory[];
  activeCategoryId: string | null;
}

export function Aside({ categories, activeCategoryId }: AsideProps) {
  const menu = [
    { category_id: null, category_name: "Semua Produk" },
    ...categories,
  ];

  return (
    <aside className="desktop:block hidden">
      <div className="w-[232px] sticky rounded-xl bg-[#242424] border border-primary p-6">
        <ul className="flex flex-col gap-4">
          {menu.map((item) => {
            const isActive = activeCategoryId === item.category_id;
            return (
              <li key={item.category_id ?? "all"}>
                <Link
                  href={
                    item.category_id
                      ? `/katalog?category=${item.category_id}`
                      : "/katalog"
                  }
                  className={cn(
                    "text-primary text-sm font-normal block hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                    isActive && "bg-primary text-[#242424]",
                  )}
                >
                  {item.category_name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Confirm TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: one remaining error about `Categories` props. That's fine — fixed in the next task.

- [ ] **Step 3: Commit**

```bash
git add components/ui/aside.tsx
git commit -m "refactor: convert Aside to server component driven by props and Link navigation"
```

---

## Task 4: Refactor `Categories` (mobile sheet) to use props and router

**Files:**
- Modify: `components/categories/index.tsx`

- [ ] **Step 1: Replace the entire file**

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
import type { TCategory } from "@/types/categories";

interface CategoriesProps {
  categories: TCategory[];
  activeCategoryId: string | null;
}

const Categories = ({ categories, activeCategoryId }: CategoriesProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const selectedCategory = categories.find(
    (c) => c.category_id === activeCategoryId,
  );

  const handleSelect = (categoryId: string | null) => {
    router.push(categoryId ? `/katalog?category=${categoryId}` : "/katalog");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="px-5 mb-5 desktop:hidden">
        <SheetTrigger className="text-primary rounded-full border bg-[#f5ebc9]/10 border-primary w-full inline-flex justify-between px-4 py-2 text-sm">
          <span>
            {selectedCategory
              ? selectedCategory.category_name
              : "Semua Kategori"}
          </span>
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

        {categories.map((category) => {
          const active = activeCategoryId === category.category_id;
          return (
            <button
              key={category.category_id}
              type="button"
              onClick={() => handleSelect(category.category_id)}
              className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
                active ? "font-semibold" : "font-normal"
              }`}
              aria-pressed={active}
            >
              <span>{category.category_name}</span>
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

- [ ] **Step 2: Confirm TypeScript is clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run all tests to confirm nothing is broken**

```bash
node vitest-runner.js
```

Expected: all tests PASS including the new `products.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add components/categories/index.tsx
git commit -m "refactor: convert Categories mobile sheet to props-driven with router navigation"
```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the following in the browser**

1. Navigate to `http://localhost:3000/katalog` — sidebar shows only categories that have active products in Supabase (not a hardcoded list of 7).
2. Click a category in the desktop sidebar — URL changes to `/katalog?category=X`, sidebar highlights the active category, product grid shows only matching products.
3. Click "Semua Produk" — URL returns to `/katalog`, all products shown.
4. On mobile (or narrow viewport), open the category sheet — same behaviour with the bottom sheet.
5. Direct URL `/katalog?category=2` works — correct category is active on initial load.
6. Invalid URL `/katalog?category=99` — "Produk tidak ditemukan" message shown, no crash.
