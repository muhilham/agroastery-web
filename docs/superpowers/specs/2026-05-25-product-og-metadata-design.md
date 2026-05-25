# Product OpenGraph Metadata for Link Sharing

**Date:** 2026-05-25
**Status:** Approved

---

## 1. Summary

When a product URL (e.g. `https://agroastery.com/product/kopi-arabika`) is shared on WhatsApp, Telegram, Facebook, or any platform that reads OpenGraph meta tags, the preview card should show the **product name**, **price**, and **short description** (or truncated full description) instead of the generic site-wide metadata.

This is achieved by adding a `generateMetadata` export to the product detail page. Next.js calls this server-side and injects the correct `<meta>` tags into the HTML `<head>`. Link preview crawlers read these static tags directly — no client-side JS required.

---

## 2. Goals

- Product links show rich, accurate previews on all platforms that support OpenGraph
- Title includes product name only (clean, readable)
- Description includes product context + price always appended
- OG image uses the product's first uploaded photo
- Zero new dependencies

## 3. Non-Goals

- Dynamic OG image generation (branded card with overlay) — out of scope
- Native mobile share sheet (Web Share API) — out of scope
- Per-variant metadata (e.g. different price per variant in OG) — out of scope; uses minimum price

---

## 4. Data Flow

```
Request: GET /product/{slug}
  │
  ├─ generateMetadata({ params: { slug } })
  │    └─ getProductBySlug(slug)  ← reused from page.tsx, Next.js deduplicates
  │         └─ Build Metadata object
  │              ├─ title: "{name} | Agroastery"
  │              ├─ description: "{short_description or truncated_desc} — Rp {price}"
  │              ├─ openGraph.images: [product image URL]
  │              └─ twitter.card: "summary_large_image"
  │
  └─ Page component renders as usual
```

---

## 5. Metadata Specification

| Field | Value | Example |
|-------|-------|---------|
| `title` | `{product.name} \| Agroastery` | `Kopi Arabika \| Agroastery` |
| `description` | `{short_description ?? truncated(description, ~150 chars) ?? fallback} — Rp {price}` | `Kopi premium single origin dari Ethiopia... — Rp 120.000` |
| `openGraph.title` | Same as `title` | |
| `openGraph.description` | Same as `description` | |
| `openGraph.images` | `[product.images[0].url]` or site default fallback | |
| `twitter.card` | `"summary_large_image"` | |
| `twitter.title` | Same as `title` | |
| `twitter.description` | Same as `description` | |
| `twitter.images` | Same as `openGraph.images` | |

### Price
Use `getMinPrice(product.product_variants)` — the minimum price among active variants. This matches the "from" price shown on the product page.

### Description Truncation
1. If `short_description` is present and ≤150 chars, use it. If longer, truncate to ~150 chars (breaking at the last word boundary) and append `"..."`.
2. If no `short_description`, strip HTML tags from `description`, then truncate to ~150 chars (breaking at the last word boundary) and append `"..."`.
3. If both are null/empty, use the fallback: `"Beli {product.name} di Agroastery"`.
4. Append ` — Rp {formattedPrice}` to the result.

### Image Fallback
If `product.images` is empty and `product.image_url` is null, fall back to the absolute site-wide default OG image:
`https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e`

This URL must be included explicitly in the returned `openGraph.images` array — Next.js does not deep-merge `openGraph` objects from parent layouts.

---

## 6. Files to Modify

| File | Action |
|------|--------|
| `app/(root)/product/[slug]/page.tsx` | Add `generateMetadata` async export |

### No New Files or Dependencies

---

## 7. Implementation Notes

- `generateMetadata` is a Next.js App Router built-in. It must be an `async` function when data fetching is needed.
- Next.js automatically deduplicates `fetch` and server data fetches within the same request, so `getProductBySlug` called in both `generateMetadata` and the page component will only execute once.
- The function should return `null` (or the default metadata) if the product is not found, letting Next.js fall back to the root `layout.tsx` metadata.
- Use `numberToIdr` (already imported in the project) for price formatting.

---

## 8. Testing

### Manual Test
1. Visit a product page (e.g. `/product/kopi-arabika`)
2. View page source (`Ctrl+U` / `Cmd+Opt+U`)
3. Verify `<meta property="og:title" content="...">` contains the product name
4. Verify `<meta property="og:description" content="...">` contains the price
5. Verify `<meta property="og:image" content="...">` points to the product image
6. Paste the URL into https://developers.facebook.com/tools/debug/ or Telegram — should show the product preview

### Unit Test (Optional)
Test the helper logic (description truncation + price append) in isolation if a helper function is extracted.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Product image is not 1200x630 (optimal OG size) | Use whatever image is uploaded; most platforms scale gracefully. Out of scope to enforce dimensions. |
| Description is too long after price append | Truncate description to ~150 chars before appending price, keeping total under ~200 chars. |
| `getProductBySlug` throws | Return `null` from `generateMetadata` so Next.js falls back to default metadata. |

---

## 10. Approval

**Design approved by:** Muhammad Ilham
**Date:** 2026-05-25
