# Katalog Dynamic Category Filter — Design Spec

## Problem

The `/katalog` page shows only "Semua Produk" with no filterable categories, even though products in Supabase have `category_ids` values set via the ops admin panel.

**Root cause:** The ops admin stores category names directly in `category_ids` (e.g., `"Roasted for Filter"`), but the existing code matches against numeric IDs from the static `data/categories.json` (e.g., `"5"`). The lookup always fails, so `deriveCategoriesFromProducts` returns an empty list and only the hardcoded "Semua Produk" option appears.

## Solution

Remove the static `categories.json` dependency from the katalog category system entirely. Derive available categories dynamically from whatever strings are actually stored in `category_ids` across all active products in Supabase. Each unique non-empty string becomes a category option.

## Architecture

### Data layer (`lib/supabase/queries/products.ts`)

`deriveCategoriesFromProducts` changes return type from `TCategory[]` to `string[]`:

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

- Removes `CATEGORY` import from `constant/category`
- Removes `TCategory` import from `types/categories`
- No other changes to `getProducts()` or `getProductBySlug()`

### Katalog page (`app/(root)/katalog/page.tsx`)

No logic changes needed. The filter `p.category_ids.includes(category)` already works because both the stored values and the URL param are the same name string. Type flows through correctly with `string[]`.

### UI components

**`components/ui/aside.tsx`** and **`components/categories/index.tsx`**:
- `categories` prop changes from `TCategory[]` to `string[]`
- Each category string serves as both the display label and the URL param value
- Remove `TCategory` imports

### Deleted file

- `lib/stores/category.ts` — exports `$categories` nanostores atom that is imported nowhere; dead code

### Files intentionally NOT changed

- `data/categories.json`, `constant/category.ts`, `types/categories.ts`, `lib/catalog.ts` — still used by the legacy static product system (`constant/product/product-list.ts`)

## Data flow

```
Supabase products.category_ids (string[])
  → getProducts()
  → deriveCategoriesFromProducts() → string[] (e.g., ["Roasted for Filter"])
  → katalog/page.tsx passes to Aside + Categories
  → user picks a category
  → URL: ?category=Roasted+for+Filter
  → filteredProducts = allProducts.filter(p => p.category_ids.includes(category))
  → ProductGrid renders filtered results
```

## Files changed

| File | Change |
|---|---|
| `lib/supabase/queries/products.ts` | `deriveCategoriesFromProducts` returns `string[]`; remove CATEGORY import |
| `components/ui/aside.tsx` | `categories: string[]` prop; remove TCategory |
| `components/categories/index.tsx` | `categories: string[]` prop; remove TCategory |
| `lib/stores/category.ts` | Delete |

## Verification

1. Run `pnpm dev`, open `/katalog`
2. "Roasted for Filter" appears as a filterable category in the sidebar and mobile dropdown
3. Clicking it filters products to only those with `"Roasted for Filter"` in `category_ids`
4. Clicking "Semua Produk" shows all products again
5. `pnpm build` completes with no TypeScript errors
