# Katalog Category Filter — Design Spec

**Date:** 2026-04-03
**Branch:** claude/review-pr-7AjrY

## Problem

Two bugs exist in the `/katalog` page:

1. The category sidebar (`Aside` on desktop, `Categories` sheet on mobile) reads from a nanostore seeded by `data/categories.json` — a static hardcoded list. It does not reflect which categories actually have active products in the database.
2. When `supabaseProducts` is passed to `ProductGrid`, the component bypasses the `$selectedCategoryId` nanostore entirely and renders all products regardless of the selected category. Category filtering is completely broken for the Supabase product path.

## Goal

- Derive the category list dynamically from the products already fetched from Supabase.
- Make category filtering happen server-side via URL search params.
- Show only categories that have at least one active product.

## Decision: URL Search Params (Option A)

Category selection updates the URL: `/katalog?category=2`. The server re-renders with filtered products. No client-side store involved.

Chosen over:
- **Two parallel queries** — unnecessary extra DB round-trip; categories can be derived for free from the single product fetch.
- **Nanostore seeding** — contradicts the server-side filtering preference; adds complexity.

## Data Flow

```
GET /katalog?category=2

katalog/page.tsx (server component)
  1. await searchParams → extract category?: string
  2. getProducts() → fetch ALL active products from Supabase (one query)
  3. deriveCategoriesFromProducts(products) → unique categories ordered by CATEGORY_BY_ID
  4. filter products: if category set → products.filter(p => p.category_ids.includes(category))
  5. render:
     ├─ <Aside categories activeCategoryId />           (desktop sidebar)
     ├─ <Categories categories activeCategoryId />      (mobile sheet)
     └─ <ProductGrid supabaseProducts={filteredProducts} />
```

No changes to `getProducts()` — all filtering is JS on the server.

## Components

### `katalog/page.tsx`
- Add `props: { searchParams: Promise<{ category?: string }> }` (Next.js 15 async searchParams).
- Await searchParams, extract `category`.
- Call `getProducts()`, derive categories, filter products.
- Pass `categories`, `activeCategoryId` props to `Aside` and `Categories`.

### `lib/supabase/queries/products.ts`
- Add `deriveCategoriesFromProducts(products: SupabaseProduct[]): TCategory[]`.
- Collects all `category_ids` from all products, deduplicates, maps to `TCategory` via `CATEGORY_BY_ID`, and preserves the original display order defined in `data/categories.json` (i.e. sort by the index of each entry in the `CATEGORY` array, not by first-seen order in products).

### `components/ui/aside.tsx`
- Remove `useStore($categories)` and `useStore($selectedCategoryId)`.
- Accept props: `categories: TCategory[]`, `activeCategoryId: string | null`.
- Each list item becomes a `<Link href="/katalog?category=X">` (or `href="/katalog"` for "Semua Produk").
- Convert to a server component — no interactivity needed, `<Link>` handles navigation, active state is computed from props.

### `components/categories/index.tsx` (mobile sheet)
- Remove nanostore reads.
- Accept same props: `categories: TCategory[]`, `activeCategoryId: string | null`.
- On selection, call `router.push("/katalog?category=X")` (stays `"use client"` due to `open`/`setOpen` state).

### `components/product-grid/index.tsx`
- No changes. Already correctly renders `supabaseProducts` when provided.

### `lib/stores/category.ts`
- No changes. Left intact in case other parts of the codebase reference it.

## Edge Cases

| Scenario | Behaviour |
|---|---|
| `?category=X` not in derived list | Filter returns empty array → "Produk tidak ditemukan" shown |
| Product with `category_ids = []` | Appears only under "Semua Produk", never under a specific category |
| Category with no active products | Never appears in sidebar — derived list is built from active products only |

## Out of Scope

- Creating a `product_categories` table in Supabase (not needed — names from `CATEGORY_BY_ID` constant).
- Changing `getProducts()` to accept a category filter parameter (JS filtering on server is sufficient).
- Updating the nanostore-based product filtering (`$filteredProducts`) — that path is only used as a fallback for the legacy static product list.
