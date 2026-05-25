# Product OpenGraph Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-product OpenGraph metadata so product links show rich previews (name, price, description, image) when shared on WhatsApp/Telegram/Facebook.

**Architecture:** Export `generateMetadata` from the product detail page. It reuses the existing `getProductBySlug` server fetch and transforms the product data into a Next.js `Metadata` object with OG/Twitter tags.

**Tech Stack:** Next.js App Router (`generateMetadata`), existing `getProductBySlug` and `getMinPrice` from `lib/supabase/queries/products`, `numberToIdr` from `lib/numberToIdr`.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `app/(root)/product/[slug]/page.tsx` | Modify | Add `generateMetadata` export that builds per-product OG metadata |

No new files needed.

---

## Task 1: Implement `generateMetadata` in Product Page

**Files:**
- Modify: `app/(root)/product/[slug]/page.tsx`

---

### Step 1: Add `Metadata` import and `generateMetadata` export

Modify `app/(root)/product/[slug]/page.tsx` to add the following above the `Page` component:

```typescript
import type { Metadata } from "next";
import { getMinPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import { numberToIdr } from "@/lib/numberToIdr";

const DEFAULT_OG_IMAGE = "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + "...";
  }
  return truncated + "...";
}

function buildProductDescription(product: SupabaseProduct, price: number): string {
  const priceStr = numberToIdr({ nominal: price });
  
  // Try short_description first
  if (product.short_description) {
    const truncated = truncateText(product.short_description, 150);
    return `${truncated} — ${priceStr}`;
  }
  
  // Fallback to description (strip HTML, truncate)
  if (product.description) {
    const plain = stripHtml(product.description);
    if (plain.trim()) {
      const truncated = truncateText(plain.trim(), 150);
      return `${truncated} — ${priceStr}`;
    }
  }
  
  // Ultimate fallback
  return `Beli ${product.name} di Agroastery — ${priceStr}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  
  if (!product) {
    return {};
  }
  
  const minPrice = getMinPrice(product.product_variants);
  const description = buildProductDescription(product, minPrice);
  const imageUrl = getProductImageUrl(product);
  const ogImage = imageUrl.startsWith("http") ? imageUrl : DEFAULT_OG_IMAGE;
  
  return {
    title: `${product.name} | Agroastery`,
    description,
    openGraph: {
      title: `${product.name} | Agroastery`,
      description,
      images: [
        {
          url: ogImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Agroastery`,
      description,
      images: [ogImage],
    },
  };
}
```

Also add `SupabaseProduct` import if not already present:
```typescript
import type { SupabaseProduct } from "@/types/product";
```

- [ ] **Step 1: Add the imports, helper functions, and `generateMetadata` export to `page.tsx`**

- [ ] **Step 2: Verify TypeScript compilation**

Run: `pnpm build`
Expected: Compiles without errors

- [ ] **Step 3: Run tests to ensure no regressions**

Run: `npx vitest run lib/supabase/queries/`
Expected: All existing product query tests pass

- [ ] **Step 4: Manual test — verify meta tags in page source**

1. Start dev server: `pnpm dev`
2. Visit `http://localhost:3000/product/{any-valid-slug}`
3. View page source (`Ctrl+U` / `Cmd+Opt+U`)
4. Verify these meta tags exist with correct values:
   - `<meta property="og:title" content="{product.name} | Agroastery">`
   - `<meta property="og:description" content="... — Rp ...">`
   - `<meta property="og:image" content="...">`
   - `<meta name="twitter:title" content="...">`
   - `<meta name="twitter:description" content="...">`
   - `<meta name="twitter:image" content="...">`

- [ ] **Step 5: Commit**

```bash
git add app/(root)/product/[slug]/page.tsx
git commit -m "feat(product): add OpenGraph metadata for link sharing

- generateMetadata returns per-product title, description (with price), and image
- description uses short_description or truncated full description
- price is minimum active variant price (matches product page 'from' price)
- falls back to site-wide OG image when product has no images"
```

---

## Self-Review

**1. Spec coverage check:**
- ✅ Title: `{product.name} | Agroastery` — implemented in Step 1
- ✅ Description with price appended — `buildProductDescription` helper handles this
- ✅ Price uses `getMinPrice` — implemented
- ✅ OG image uses product image or site default — `getProductImageUrl` + fallback
- ✅ `short_description` used first, then truncated `description` — handled
- ✅ Null description fallback — `"Beli {name} di Agroastery — Rp {price}"`
- ✅ Next.js metadata merging — explicit `openGraph.images` array returned

**2. Placeholder scan:**
- ✅ No "TBD", "TODO", or vague instructions
- ✅ All code is complete and exact
- ✅ All file paths are exact
- ✅ All commands are exact with expected output

**3. Type consistency:**
- ✅ `getProductBySlug` returns `Promise<SupabaseProduct | null>` — handled
- ✅ `getMinPrice` takes `SupabaseProductVariant[]` — correct usage
- ✅ `numberToIdr` takes `{ nominal: number }` — correct usage
- ✅ `getProductImageUrl` returns string — correct usage

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-25-product-og-metadata.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
