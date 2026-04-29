# Katalog Dynamic Category Filter + Legacy Cleanup — Design Spec

## Problem

Two things to fix in one pass:

1. **Category filter broken:** The `/katalog` page shows only "Semua Produk" with no filterable categories. Root cause: the ops admin stores category names directly in `category_ids` (e.g., `"Roasted for Filter"`), but the existing code matches against numeric IDs from the static `data/categories.json` (e.g., `"5"`). The lookup always fails, so no categories appear.

2. **~1500 lines of dead legacy code:** The app has fully migrated from a static JSON product system to Supabase, but the old system's files were never cleaned up. Nothing in `app/` routes uses them anymore.

## Solution

**Fix the category filter** by removing the static categories.json dependency entirely — derive available categories dynamically from whatever strings are stored in `category_ids` across all active products in Supabase.

**Delete all dead legacy code** — the static product loading chain, its stores, types, schemas, and components.

---

## Part 1: Category Filter Fix

### Data layer (`lib/supabase/queries/products.ts`)

`deriveCategoriesFromProducts` changes return type from `TCategory[]` to `string[]`. Collects all unique non-empty strings from `category_ids` across all products, sorted alphabetically:

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

Remove `CATEGORY` import from `constant/category` and `TCategory` import from `types/categories`.

### Katalog page (`app/(root)/katalog/page.tsx`)

No logic changes needed. `p.category_ids.includes(category)` already matches name strings. The `category` URL param is the raw name (e.g., `?category=Roasted+for+Filter`). Type flows correctly with `string[]`.

### UI components

**`components/ui/aside.tsx`** and **`components/categories/index.tsx`**: `categories` prop changes from `TCategory[]` to `string[]`. Each string is both the display label and the URL param value. Remove `TCategory` imports.

### Data flow after fix

```
Supabase products.category_ids ["Roasted for Filter", ...]
  → getProducts()
  → deriveCategoriesFromProducts() → string[] (unique sorted names)
  → katalog/page.tsx → Aside + Categories components
  → user picks category → ?category=Roasted+for+Filter
  → filteredProducts = allProducts.filter(p => p.category_ids.includes(category))
  → ProductGrid renders filtered results
```

---

## Part 2: Legacy Code Deletion

### Files to fully delete

| File | Reason |
|---|---|
| `components/section/checkout/index.tsx` | Old single-product WhatsApp checkout, never imported in app/ |
| `components/section/product-detail/index.tsx` | Old product detail, app uses SupabaseProductDetail instead |
| `lib/stores/category.ts` | `$categories` atom never imported anywhere |
| `lib/stores/product.ts` | All exports become dead after product-grid fallback is removed |
| `constant/category.ts` | `CATEGORY` / `CATEGORY_BY_ID` only used by dead code |
| `constant/product/product-list.ts` | `PRODUCT_LIST` only used by dead checkout/stores |
| `lib/catalog.ts` | `loadCategories`, `loadRawProducts`, `adaptProduct` — all dead |
| `lib/schemas.ts` | Zod schemas for static JSON products — only used by dead lib/catalog.ts |
| `lib/message-builder.ts` | WhatsApp message builder — only used by dead checkout component |
| `lib/catalog.test.ts` | Tests for dead lib/catalog.ts |
| `data/categories.json` | Static category data — replaced by dynamic Supabase derivation |
| `data/products.json` | Static product data — fully replaced by Supabase |
| `types/categories.ts` | `TCategory` type — only used by dead code |

### Files to trim (partial changes)

**`components/product-grid/index.tsx`**
- Remove `$filteredProducts` import from `lib/stores/product`
- Remove the entire store-based fallback branch (lines 39–59)
- Result: always renders `supabaseProducts`; make prop required

**`components/ui/product-card.tsx`**
- Remove `selectProductBySlug` import from `lib/stores/product`
- Remove the call to `selectProductBySlug` on click (if any)
- Result: component works from props only

**`types/product.ts`**
- Remove `TVariant`, `TProductBase`, `TProduct` (legacy static types)
- Keep `SupabaseProduct`, `SupabaseProductOption`, `SupabaseProductVariant`, `SupabaseOptionValue`

### Files intentionally kept

- `lib/utils/weight.ts` — used by live shipping weight calculation
- `lib/utils.ts` — `cn()` and `slugify` used throughout live code
- `app/api/catalog/` — check and keep if it serves any live purpose

---

## Complete File Change List

| File | Action |
|---|---|
| `lib/supabase/queries/products.ts` | Change `deriveCategoriesFromProducts` → `string[]`; remove CATEGORY import |
| `components/ui/aside.tsx` | `categories: string[]`; remove TCategory |
| `components/categories/index.tsx` | `categories: string[]`; remove TCategory |
| `components/product-grid/index.tsx` | Remove store fallback; make `supabaseProducts` required |
| `components/ui/product-card.tsx` | Remove `selectProductBySlug` import and usage |
| `types/product.ts` | Remove legacy TProduct/TProductBase/TVariant |
| `components/section/checkout/index.tsx` | **DELETE** |
| `components/section/product-detail/index.tsx` | **DELETE** |
| `lib/stores/category.ts` | **DELETE** |
| `lib/stores/product.ts` | **DELETE** |
| `constant/category.ts` | **DELETE** |
| `constant/product/product-list.ts` | **DELETE** |
| `lib/catalog.ts` | **DELETE** |
| `lib/schemas.ts` | **DELETE** |
| `lib/message-builder.ts` | **DELETE** |
| `lib/catalog.test.ts` | **DELETE** |
| `data/categories.json` | **DELETE** |
| `data/products.json` | **DELETE** |
| `types/categories.ts` | **DELETE** |

---

## Verification

1. `pnpm build` — zero TypeScript errors
2. Open `/katalog` — "Roasted for Filter" appears as a filter option
3. Click "Roasted for Filter" — only matching products show
4. Click "Semua Produk" — all products show again
5. Open `/product/[slug]` — product detail still works (uses SupabaseProductDetail, unaffected)
6. Open `/checkout` — new unified checkout still works (uses Supabase, unaffected)
