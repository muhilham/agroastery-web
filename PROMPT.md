# Implementation Prompt for AI Agent

> This prompt guides an AI model to implement the e-commerce service for Agroastery.
> Read CLAUDE.md and PLAN.md FIRST — they are the source of truth for architecture decisions.
> This file tells you WHERE to look and HOW to implement each phase.

---

## Before You Start

1. **Read these files first** (they contain all architecture decisions, schemas, and rules):
   - `/home/user/agroastery-web/CLAUDE.md` — architecture, database schema, code patterns, rules
   - `/home/user/agroastery-web/PLAN.md` — step-by-step implementation plan with code examples

2. **Key rules** (from PLAN.md CRITICAL RULES section):
   - Use `products.name` (NOT `title`) — the DB column is `name`
   - Use `ecom_orders` / `ecom_order_items` (NOT `orders` / `order_items` — those are B2B)
   - NO RLS on product/variant tables
   - Node.js runtime only (NOT edge)
   - Use `@/` import alias

---

## Codebase Map — Where Things Are

### Current Project Structure
```
app/
├── (root)/
│   ├── katalog/page.tsx              # Product catalog — MODIFY (fetch from Supabase)
│   └── product/[slug]/
│       ├── page.tsx                  # Product detail — MODIFY (Supabase + variant selector)
│       └── checkout/page.tsx         # Single-product checkout — MODIFY (redirect to unified checkout)
├── api/
│   ├── catalog/[...slug]/route.ts    # CDN proxy — DELETE later (replaced by Supabase)
│   ├── og/route.tsx                  # OG images — KEEP
│   └── shipping/
│       ├── rates/route.ts            # Biteship rates — MODIFY (remove edge, enhance multi-item)
│       └── draft-order/route.ts      # Biteship draft — MODIFY (remove edge)
├── layout.tsx                        # Root layout — MODIFY (add auth provider)
├── page.tsx                          # Homepage — KEEP
└── globals.css                       # Styles — KEEP

components/
├── carousel/                         # Image carousel — KEEP
├── categories/                       # Category filter — KEEP
├── location-display/                 # Location display — KEEP
├── map/
│   ├── AddressSearch.tsx             # Google Places search — KEEP
│   └── MapPicker.tsx                 # Map picker — KEEP
├── mobile-checkout-form/             # Floating checkout btn — MODIFY
├── navigation/index.tsx              # Top navbar — MODIFY (add cart icon + login)
├── product-grid/                     # Product grid — KEEP
├── purchase-dialog/                  # WhatsApp dialog — DELETE later
├── section/
│   ├── product-detail/index.tsx      # Product detail UI — MODIFY (variant selector + Add to Cart)
│   └── checkout/index.tsx            # Checkout form — MODIFY (multi-item, Xendit)
└── ui/                               # Shadcn primitives — KEEP

lib/
├── actions/createDraftOrder.ts       # Biteship draft order — KEEP
├── catalog.ts                        # Static JSON loader — DELETE later
├── catalog.test.ts                   # Tests — UPDATE later
├── data/fetch-locations.ts           # Location data — KEEP
├── hooks/
│   ├── useDebounce.ts                # Debounce — KEEP
│   └── useShippingCalculator.ts      # Shipping calc — MODIFY (multi-item)
├── maps/loadGoogleMaps.ts            # Google Maps loader — KEEP
├── message-builder.ts                # WhatsApp messages — DELETE later
├── numberToIdr.ts                    # Format IDR — KEEP (use this!)
├── schemas.ts                        # Zod schemas — MODIFY (add Supabase types)
├── stores/
│   ├── category.ts                   # $categories, $selectedCategoryId — KEEP
│   ├── checkout.ts                   # $checkoutDraft — MODIFY for multi-item
│   ├── product.ts                    # $selectedProductSlug, $filteredProducts — MODIFY for Supabase
│   ├── search.ts                     # $searchQuery, $searchResults — MODIFY for Supabase
│   └── shipping.ts                   # $shipping, $destinationGeo, $selectedCourier — KEEP
├── types/shipping.ts                 # Shipping Zod types — KEEP
├── utils/
│   ├── postal-code-lookup.ts         # Postal code lookup — KEEP
│   └── weight.ts                     # Weight parsing — KEEP
└── utils.ts                          # cn(), slugify() — KEEP

types/
├── categories.ts                     # TCategory — KEEP
├── product.ts                        # TVariant, TProductBase, TProduct — MODIFY for Supabase
└── ui.ts                             # UI types — KEEP

constant/
├── category.ts                       # CATEGORY array — MODIFY (load from Supabase)
├── coffe-list.ts                     # Homepage content — KEEP
├── menu-list.ts                      # Nav menu items — KEEP
├── product/product-list.ts           # PRODUCT_LIST — DELETE later (use Supabase)
├── resource-and-link.ts              # External URLs — KEEP
├── store-phone-number.ts             # WhatsApp number — DELETE later
├── testimonial.ts                    # Testimonials — KEEP
└── top-content.ts                    # Homepage content — KEEP

data/
├── categories.json                   # Static categories — DELETE later
└── products.json                     # Static products — DELETE later
```

---

## Existing Type Shapes (What You're Replacing)

### Current Product Types (types/product.ts)
```typescript
// CURRENT — loaded from static JSON
type TVariant = {
  weight: string;           // "150g", "1kg"
  price: number;            // IDR
  sku: string;
  quantity: number;
  shipWeightGrams: number;
};

type TProductBase = {
  title: string;            // ⚠️ Supabase column is `name`, NOT `title`
  description: string;
  grindSize: string[];
  coffeType: string[];
  category_ids: string[];
  images: { image: string }[];
  shortDescription?: string;
  variants: TVariant[];
};

type TProduct = Omit<TProductBase, "category_ids"> & {
  slug: string;
  category: TCategory[];
  priceBySize: Record<string, number>;
  minPrice: number;
  price: number;
  size: string[];
};
```

### New Product Types (what to create)
```typescript
// NEW — from Supabase, see CLAUDE.md for full schema
type SupabaseProduct = {
  id: string;
  name: string;               // NOT "title"
  slug: string;
  description: string | null;
  short_description: string | null;
  category_ids: string[];
  images: { url: string; alt?: string; sort_order?: number }[];
  image_url: string | null;   // legacy ops column
  is_active: boolean;
  product_options: SupabaseProductOption[];
  product_variants: SupabaseProductVariant[];
};

type SupabaseProductOption = {
  id: string;
  name: string;               // "Size", "Grind Type"
  display_order: number;
  product_option_values: SupabaseOptionValue[];
};

type SupabaseOptionValue = {
  id: string;
  value: string;              // "150g", "Fine Grind"
  display_order: number;
};

type SupabaseProductVariant = {
  id: string;
  sku: string | null;
  price: number;              // BIGINT in IDR
  compare_at_price: number | null;
  stock_quantity: number;
  ship_weight_grams: number;
  is_active: boolean;
  product_variant_option_values: { option_value_id: string }[];
};
```

---

## Current Data Flow (What You're Changing)

### Product Loading (BEFORE — Static JSON)
```
data/products.json
  → lib/catalog.ts loadRawProducts()
  → lib/catalog.ts adaptProduct()
  → constant/product/product-list.ts PRODUCT_LIST
  → lib/stores/product.ts $filteredProducts (computed)
  → components/product-grid/ renders cards
```

### Product Loading (AFTER — Supabase)
```
Supabase products table
  → lib/supabase/queries/products.ts getProducts() / getProductBySlug()
  → Server component fetches directly (no static constant)
  → Pass data as props to client components
  → Cart store manages selections
```

### Checkout Flow (BEFORE — WhatsApp)
```
Product detail page → select size/grind/qty
  → $checkoutDraft store (single item)
  → /product/[slug]/checkout page
  → Fill address → shipping calculator → select courier
  → "Confirm" → lib/message-builder.ts → WhatsApp link
```

### Checkout Flow (AFTER — Xendit)
```
Product detail page → select variant options → "Add to Cart"
  → lib/stores/cart.ts $cartItems (multi-item)
  → /cart page (review items)
  → /checkout page
  → Fill address → shipping calculator → select courier
  → "Pay Now" → POST /api/checkout → Xendit invoice → popup widget
  → Webhook confirms → order in ecom_orders
```

---

## Phase-by-Phase Implementation Guide

### Phase 1: Foundation

**Read these files before starting:**
- `CLAUDE.md` → "Code Patterns" section for exact Supabase client code
- `PLAN.md` → Phase 1 section for middleware code and auth callback code

**Files to CREATE:**
| File | Copy pattern from |
|---|---|
| `lib/supabase/server.ts` | CLAUDE.md "Supabase Server Client" code pattern |
| `lib/supabase/client.ts` | CLAUDE.md "Supabase Browser Client" code pattern |
| `lib/supabase/types.ts` | Empty placeholder: `export type Database = any; // TODO: generate` |
| `middleware.ts` | PLAN.md Phase 1.4 has exact code |
| `app/api/auth/callback/route.ts` | PLAN.md Phase 1.5 has exact code |
| `app/(root)/login/page.tsx` | Create sign-in page with Google button (see PLAN.md 1.5) |
| `lib/stores/auth.ts` | New nanostore for auth state |
| `lib/hooks/useAuth.ts` | Hook wrapping auth store |

**Files to MODIFY:**
| File | What to change | Look at |
|---|---|---|
| `app/layout.tsx` | Add auth context/provider | Currently at line 1-50, just wraps `{children}` with fonts |
| `components/navigation/index.tsx` | Add login button + user avatar | Currently has search + menu only |
| `next.config.ts` | Add `output: 'standalone'` | Currently just has images + trailingSlash config |
| `package.json` | Add `@supabase/supabase-js`, `@supabase/ssr` | Run `pnpm add @supabase/supabase-js @supabase/ssr` |

**Files to MODIFY (remove edge runtime):**
| File | What to change |
|---|---|
| `app/api/shipping/rates/route.ts` | Remove `export const runtime = 'edge'` if present |
| `app/api/shipping/draft-order/route.ts` | Remove `export const runtime = 'edge'` if present |
| `app/(root)/product/[slug]/page.tsx` | Remove `export const runtime = 'edge'` if present |
| `app/(root)/product/[slug]/checkout/page.tsx` | Remove `export const runtime = 'edge'` if present |

---

### Phase 2: Product Catalog from Supabase

**Read these files before starting:**
- `CLAUDE.md` → "Fetching Products with Variants" code pattern
- `CLAUDE.md` → "Database Schema" for exact table/column names
- `PLAN.md` → Phase 2 for query layer and page refactoring

**Files to CREATE:**
| File | Purpose |
|---|---|
| `lib/supabase/queries/products.ts` | `getProducts()`, `getProductBySlug()` — see CLAUDE.md pattern |
| `supabase/migrations/001_ecommerce_schema.sql` | Full migration — see CLAUDE.md schema + PLAN.md 2.1.1 |

**Files to MODIFY:**
| File | What to change | Current behavior |
|---|---|---|
| `app/(root)/katalog/page.tsx` | Make it a server component, fetch from Supabase | Currently renders ProductGrid which reads from $filteredProducts store |
| `app/(root)/product/[slug]/page.tsx` | Fetch product by slug from Supabase, pass as props | Currently reads from $productDetailStore computed store |
| `components/section/product-detail/index.tsx` | Add variant option selectors (radio groups per option axis), replace WhatsApp with "Add to Cart" | Currently shows size/grind selectors from static data + WhatsApp button |
| `types/product.ts` | Add new Supabase-based types alongside existing ones | Currently has TVariant, TProductBase, TProduct |
| `lib/schemas.ts` | Add Zod schemas for Supabase product data | Currently has ProductSchema for static JSON shape |

**Key pattern — Variant Selection Logic:**
```typescript
// Given selected option values (e.g., { Size: "150g", Grind: "Fine" })
// Find the matching variant from product_variants:
function findMatchingVariant(
  variants: SupabaseProductVariant[],
  selectedOptionValueIds: string[]
): SupabaseProductVariant | null {
  return variants.find(variant => {
    const variantValueIds = variant.product_variant_option_values.map(v => v.option_value_id);
    return selectedOptionValueIds.length === variantValueIds.length &&
      selectedOptionValueIds.every(id => variantValueIds.includes(id));
  }) ?? null;
}
```

**Key pattern — Mapping Supabase to existing component props:**
```typescript
// If existing components expect `title`, map from `name`:
const productForUI = {
  title: supabaseProduct.name,  // DB column is `name`
  slug: supabaseProduct.slug,
  description: supabaseProduct.description ?? "",
  images: supabaseProduct.images?.map(img => ({ image: img.url }))
    ?? (supabaseProduct.image_url ? [{ image: supabaseProduct.image_url }] : []),
  // ... etc
};
```

---

### Phase 3: Multi-Item Cart

**Read these files before starting:**
- `PLAN.md` → Phase 3 for cart store design and sync logic
- `lib/stores/checkout.ts` — understand current single-item checkout draft pattern

**Files to CREATE:**
| File | Purpose |
|---|---|
| `lib/stores/cart.ts` | Nanostore: `$cartItems` atom with localStorage persistence |
| `lib/hooks/useCart.ts` | Hook: `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()`, `cartCount`, `cartTotal` |
| `app/api/cart/route.ts` | API: GET/POST/DELETE for logged-in user cart sync to `cart_items` table |
| `app/(root)/cart/page.tsx` | Cart page: list items, quantity controls, subtotal, "Checkout" button |

**Files to MODIFY:**
| File | What to change |
|---|---|
| `components/navigation/index.tsx` | Add cart icon with badge count (use `$cartItems.length`) |
| `components/section/product-detail/index.tsx` | Change purchase button to "Add to Cart" → calls `addToCart()` |
| `lib/stores/checkout.ts` | May need to update or deprecate `$checkoutDraft` (single-item) in favor of cart |

**Cart item shape:**
```typescript
type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;          // from products.name (NOT title)
  variantDescription: string;   // e.g., "150g, Fine Grind"
  unitPrice: number;            // BIGINT IDR
  quantity: number;
  shipWeightGrams: number;
  image: string;                // first product image URL
};
```

**localStorage pattern:**
```typescript
import { atom, onMount } from "nanostores";

export const $cartItems = atom<CartItem[]>([]);

// Load from localStorage on mount
onMount($cartItems, () => {
  const stored = localStorage.getItem("cart");
  if (stored) $cartItems.set(JSON.parse(stored));
  // Subscribe to save on change
  return $cartItems.subscribe(items => {
    localStorage.setItem("cart", JSON.stringify(items));
  });
});
```

---

### Phase 4: Checkout & Payment

**Read these files before starting:**
- `PLAN.md` → Phase 4 for Xendit integration and checkout API
- `CLAUDE.md` → "Xendit Popup Widget" section
- `CLAUDE.md` → "API Route Pattern" code pattern
- `components/section/checkout/index.tsx` — understand current checkout form (address, shipping, maps)

**Files to CREATE:**
| File | Purpose |
|---|---|
| `lib/xendit/client.ts` | Xendit API wrapper for invoice creation |
| `lib/xendit/webhook.ts` | Webhook signature verification |
| `app/api/checkout/route.ts` | POST: validate cart → create ecom_order + ecom_order_items → Xendit invoice → return URL |
| `app/(root)/checkout/page.tsx` | Unified checkout: cart summary + customer info + address + shipping + pay |
| `app/(root)/checkout/success/page.tsx` | Payment success: order number, total, "Continue Shopping" |

**Files to MODIFY:**
| File | What to change |
|---|---|
| `components/section/checkout/index.tsx` | Reuse address/shipping form parts, add Xendit popup trigger |
| `lib/hooks/useShippingCalculator.ts` | Support multi-item weight aggregation from cart |
| `app/api/shipping/rates/route.ts` | Enhance for multi-item (aggregate weights from array) |

**Xendit invoice creation pattern:**
```typescript
// app/api/checkout/route.ts
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  // 1. Validate items, calculate totals
  // 2. Create ecom_orders row (use admin client for guest support)
  const supabase = createSupabaseAdminClient();
  const { data: order } = await supabase.from("ecom_orders").insert({
    order_number: generateOrderNumber(), // e.g., AGR-20260319-XXXX
    status: "pending_payment",
    customer_name: body.customerName,
    customer_phone: body.customerPhone,
    // ... see CLAUDE.md ecom_orders schema for all fields
  }).select().single();

  // 3. Create ecom_order_items rows
  // 4. Create Xendit invoice
  // 5. Return { invoiceUrl, orderId }
}
```

**Important — Existing checkout form reuse:**
- `components/section/checkout/index.tsx` already has address form, Google Maps picker, shipping rate selector
- Reuse these UI components but wire them to the new multi-item cart flow
- Replace the WhatsApp "Confirm" button with a "Pay Now" button that opens Xendit popup

---

### Phase 5: Order Management

**Read these files before starting:**
- `PLAN.md` → Phase 5 for webhook handler and order pages
- `CLAUDE.md` → "ecom_orders" schema for status values

**Files to CREATE:**
| File | Purpose |
|---|---|
| `app/api/webhooks/xendit/route.ts` | POST: verify signature → update ecom_orders status |
| `app/(root)/orders/page.tsx` | Protected: list user's orders from ecom_orders |
| `app/(root)/orders/[id]/page.tsx` | Protected: order detail with items and status |

**Webhook pattern:**
```typescript
// app/api/webhooks/xendit/route.ts
export async function POST(request: NextRequest) {
  const token = request.headers.get("x-callback-token");
  if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const supabase = createSupabaseAdminClient();  // admin for server-side update

  if (body.status === "PAID") {
    await supabase.from("ecom_orders")
      .update({
        payment_status: "paid",
        status: "processing",
        paid_at: new Date().toISOString(),
        xendit_payment_method: body.payment_method,
      })
      .eq("xendit_invoice_id", body.id);
  }
  return NextResponse.json({ received: true });
}
```

---

### Phase 6: Polish & Cleanup

**Read these files before starting:**
- `PLAN.md` → Phase 6 for cleanup checklist
- `PLAN.md` → "Files to DELETE" section

**Files to DELETE:**
```
data/products.json
data/categories.json
constant/product/product-list.ts
lib/catalog.ts
lib/catalog.test.ts
lib/message-builder.ts
constant/store-phone-number.ts
components/purchase-dialog/
app/api/catalog/[...slug]/route.ts
```

---

## Existing Utilities to REUSE (Don't Recreate These)

| Utility | Location | Purpose |
|---|---|---|
| `numberToIdr()` | `lib/numberToIdr.ts` | Format number as IDR currency: `numberToIdr({ nominal: 140000 })` |
| `cn()` | `lib/utils.ts` | Combine classnames: `cn("base", conditional && "extra")` |
| `slugify()` | `lib/utils.ts` | String to URL slug |
| `parseWeightToGrams()` | `lib/utils/weight.ts` | Parse "150g" → 150, "1kg" → 1000 |
| `applyPackaging()` | `lib/utils/weight.ts` | Add packaging weight |
| `useDebounce()` | `lib/hooks/useDebounce.ts` | Debounce values |
| `useShippingCalculator()` | `lib/hooks/useShippingCalculator.ts` | Shipping rate calculations |
| `$destinationGeo` | `lib/stores/shipping.ts` | Store for shipping destination |
| `$selectedCourier` | `lib/stores/shipping.ts` | Store for selected shipping method |
| `fetchShippingRates()` | `lib/stores/shipping.ts` | Fetch rates from API |
| `MapPicker` | `components/map/MapPicker.tsx` | Google Maps address picker |
| `AddressSearch` | `components/map/AddressSearch.tsx` | Google Places autocomplete |
| `Button` | `components/ui/button.tsx` | Styled button component |
| `RadioGroup` | `components/ui/radio-group.tsx` | Radio selection (for variants, shipping) |
| `Dialog` | `components/ui/dialog.tsx` | Modal dialog |
| `Sheet` | `components/ui/sheet.tsx` | Side drawer |
| `Card` | `components/ui/card.tsx` | Card container |
| `Input` | `components/ui/input.tsx` | Text input |
| `ProductCard` | `components/ui/product-card.tsx` | Product card for grid |

---

## Package.json — Current Dependencies (Don't Duplicate)

Already installed:
- `next@15.1.2`, `react@19`, `react-dom@19`
- `nanostores@1.0.1`, `@nanostores/react@1.0.0`
- `react-hook-form@7.56.3`, `zod@3.24.4`
- `@googlemaps/js-api-loader@2.0.1`
- `lucide-react@0.503.0` (icons)
- `@radix-ui/*` (dialog, label, radio-group, slot)
- `tailwindcss@3.4.1`, `tailwind-merge`, `tailwindcss-animate`
- `class-variance-authority`, `clsx`
- `embla-carousel@8.6.0`

Need to install:
```bash
pnpm add @supabase/supabase-js @supabase/ssr    # Phase 1
pnpm add xendit-node                              # Phase 4
```

---

## Testing

- Framework: Vitest (already configured at `vitest.config.mts`)
- Existing test: `lib/catalog.test.ts` (will be removed when static catalog is deleted)
- Run tests: `pnpm test`
- Run dev server: `pnpm dev`
- Run build: `pnpm build`

---

## Environment Variables Needed

Create `.env.local` with (see CLAUDE.md for full list):
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
BITESHIP_API_KEY=                    # already exists
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=     # already exists
NEXT_PUBLIC_APP_URL=https://agroastery.com
```
