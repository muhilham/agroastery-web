# E-Commerce Service Implementation Plan

## CRITICAL RULES (Read Before Implementing)

### DO:
- Use `products.name` column (NOT `title`) — the existing DB column is called `name`
- Use `ecom_orders` and `ecom_order_items` for consumer orders
- Use `createSupabaseAdminClient()` (service role key) for product reads and guest order creation
- Use `createSupabaseServerClient()` (anon key + cookies) for authenticated user operations
- Use Node.js runtime (NOT edge) for all routes and pages
- Use `@/` import alias for all imports
- Store money as BIGINT in IDR (no decimals)
- Return `{ error: string, code?: string }` from all API error responses
- Use Zod for all API input validation
- Use nanostores for client-side state

### DO NOT:
- Do NOT create a new `products` table — EXTEND the existing one with ALTER TABLE
- Do NOT use `orders` or `order_items` tables — those are B2B. Use `ecom_orders` / `ecom_order_items`
- Do NOT enable RLS on `products`, `product_options`, `product_variants`, or `product_variant_option_values`
- Do NOT modify existing columns on the `products` table (`name`, `unit`, `sku`, `base_price`, `image_url`, `is_active`, `is_global`)
- Do NOT modify any ops tables: `orders`, `order_items`, `clients`, `client_products`, `employees`, `attendance`, etc.
- Do NOT use `export const runtime = 'edge'` — use Node.js runtime
- Do NOT reference `product.title` in Supabase queries — the column is `name`

### Table Name Quick Reference:
| Purpose | Table Name | Notes |
|---|---|---|
| Products | `products` | EXISTING table, extended with new columns |
| Product options | `product_options` | NEW table |
| Option values | `product_option_values` | NEW table |
| Variants | `product_variants` | NEW table |
| Variant↔Option junction | `product_variant_option_values` | NEW table |
| Consumer orders | `ecom_orders` | NEW table (NOT `orders`) |
| Consumer order items | `ecom_order_items` | NEW table (NOT `order_items`) |
| User profiles | `profiles` | NEW table |
| Saved addresses | `addresses` | NEW table |
| Cart (logged-in) | `cart_items` | NEW table |
| B2B orders | `orders` | EXISTING — DO NOT USE for ecom |
| B2B order items | `order_items` | EXISTING — DO NOT USE for ecom |

---

## Overview

Transform the current catalog + WhatsApp-based ordering site into a full e-commerce platform with:
- Google OAuth authentication (Supabase Auth)
- Live product catalog from Supabase with flexible N-level variants
- Multi-item shopping cart
- Xendit embedded payment (popup widget)
- Biteship shipping integration (improved for multi-item)
- Purchase history for logged-in users

Deployed on **Railway** (Node.js runtime). Shares Supabase database with ops admin panel.

---

## Phase 1: Foundation (Auth + Supabase + Runtime)

### 1.1 Switch to Node.js Runtime
- **Why**: Supabase SSR (`@supabase/ssr`) needs cookie access, which works best with Node.js runtime. Railway runs Node.js natively.
- **Tasks**:
  - Remove `export const runtime = 'edge'` from all existing API routes
  - ~~Remove Cloudflare-specific config (`wrangler.toml`, `@cloudflare/next-on-pages`)~~ ✅ Done
  - Update `next.config.ts` — remove Cloudflare adapter, set `output: 'standalone'` for Railway
  - Add `Dockerfile` or `Procfile` for Railway deployment (or use Railway's nixpacks auto-detect)
  - Update `.env.example` with new environment variables

### 1.2 Install Dependencies
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 1.3 Supabase Client Setup
- `lib/supabase/client.ts` — browser client (uses anon key + cookies)
- `lib/supabase/server.ts` — server client (reads cookies from `next/headers`)
- `lib/supabase/types.ts` — placeholder for generated DB types (run `supabase gen types` later)
- See CLAUDE.md "Code Patterns" section for exact implementation of both clients

### 1.4 Auth Middleware
- `middleware.ts` at project root — refreshes Supabase auth session on every request
- Only applies to routes that need auth (not static assets)
- Does NOT block unauthenticated users (guest access is allowed)

```typescript
// middleware.ts — at project root
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  // Refresh session — do NOT remove this line
  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### 1.5 Google OAuth Flow
- `app/(root)/login/page.tsx` — sign-in page with "Continue with Google" button
- `app/api/auth/callback/route.ts` — handles OAuth redirect, exchanges code for session
- Auth state store: `lib/stores/auth.ts` — tracks current user in nanostores
- Auth hook: `lib/hooks/useAuth.ts` — provides `user`, `signIn()`, `signOut()`, `loading`
- Navigation: add login/user avatar button to header

```typescript
// app/api/auth/callback/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

```typescript
// Sign-in action (used in login page)
const supabase = createSupabaseBrowserClient();
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${window.location.origin}/api/auth/callback` },
});
```

### 1.6 User Profile
- Database trigger (in migration SQL): on `auth.users` INSERT → create `profiles` row
- Profile includes: `full_name` (from Google), `phone` (null initially)

**Deliverables**: User can sign in with Google, see their name in nav, sign out. Supabase client works on both server and client.

---

## Phase 2: Product Catalog from Supabase

### 2.1 Database Schema (SQL Migration)
- Provide complete migration SQL file at `supabase/migrations/001_ecommerce_schema.sql`
- **Extend existing `products` table** (add nullable columns to avoid breaking ops):
  - Add: `slug TEXT UNIQUE`, `short_description TEXT`, `category_ids TEXT[]`, `images JSONB DEFAULT '[]'`, `updated_at TIMESTAMPTZ DEFAULT now()`
  - Existing columns stay untouched: `name`, `description`, `unit`, `sku`, `base_price`, `image_url`, `is_active`, `is_global`
- **New variant tables**: `product_options`, `product_option_values`, `product_variants`, `product_variant_option_values`
- **Separate e-commerce order tables**: `ecom_orders`, `ecom_order_items`
  - Existing `orders` table has `client_id NOT NULL` (B2B), different structure — cannot safely share
  - `ecom_orders` includes: user_id (nullable for guest), shipping info, Xendit payment fields, customer info
  - `ecom_order_items` includes: variant_id, denormalized product/variant snapshots, weight
- **New tables**: `profiles`, `addresses`, `cart_items`
- **Reuse existing**: `order_number_sequences` table (extend for ecom prefix if needed)
- **RLS policies** — only on ecom-specific tables (NOT on `products` to avoid any ops risk):
  - `profiles`, `addresses` — users manage their own
  - `cart_items` — users manage their own cart
  - `ecom_orders`, `ecom_order_items` — users view their own orders
  - `products`, `product_options`, `product_variants` — NO RLS (read server-side via service role key)
- Indexes for performance

### 2.1.1 Migration SQL File Contents

The migration at `supabase/migrations/001_ecommerce_schema.sql` must contain:

```sql
-- 1. Extend existing products table (DO NOT CREATE TABLE products)
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Create variant tables (see CLAUDE.md for full CREATE TABLE statements)
-- product_options, product_option_values, product_variants, product_variant_option_values

-- 3. Create ecom tables (NOT "orders" / "order_items" — those are B2B)
-- ecom_orders, ecom_order_items

-- 4. Create user tables
-- profiles, addresses, cart_items

-- 5. RLS — ONLY on: profiles, addresses, cart_items, ecom_orders, ecom_order_items
-- Do NOT enable RLS on products or variant tables

-- 6. Indexes (see CLAUDE.md for full list)

-- 7. Triggers: updated_at auto-update, profile auto-create on auth.users insert

-- 8. Backfill slugs for existing products
UPDATE products SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
```

### 2.2 Product Query Layer
- `lib/supabase/queries/products.ts`:
  - `getProducts()` — list all active products with min price
  - `getProductBySlug(slug)` — full product with options, values, and variants
  - `getCategories()` — list categories
- Use Supabase's nested query syntax to fetch product + options + variants in one call
- Type-safe with generated types

### 2.3 Refactor Catalog Page
- `app/(root)/katalog/page.tsx` — server component, fetch from Supabase
- Keep existing `ProductGrid` and `Categories` components
- Adapt product type mapping: Supabase row → existing `TProduct` shape (or create new type)
- Category filtering: query param based, server-side filtered

### 2.4 Refactor Product Detail Page
- `app/(root)/product/[slug]/page.tsx` — server component, fetch product by slug
- **Variant Selection UI** (new component):
  - Render each product_option as a selector group (e.g., radio buttons for Size, Grind)
  - When user selects option values → find matching variant → display price, stock, SKU
  - If no variant matches the combination → show "unavailable"
  - Handle single-option and multi-option products
- "Add to Cart" button (replaces current "Buy via WhatsApp" flow)

### 2.5 Remove Static Data Dependencies
- Remove `/data/products.json`, `/data/categories.json`
- Remove `/constant/product/product-list.ts` static loading
- Remove CDN proxy API route (`/api/catalog/[...slug]`)
- Remove `lib/catalog.ts` (static loader)

**Deliverables**: Product catalog loads from Supabase. Product detail shows variant options. "Add to Cart" button works.

---

## Phase 3: Multi-Item Cart

### 3.1 Cart Store
- `lib/stores/cart.ts` (nanostores):
  - `$cartItems` — array of `{ variantId, productSlug, productTitle, variantDescription, unitPrice, quantity, shipWeightGrams, image }`
  - Actions: `addToCart(item)`, `removeFromCart(variantId)`, `updateQuantity(variantId, qty)`, `clearCart()`
  - Guest: persist to `localStorage`
  - Logged-in: sync with Supabase `cart_items` table

### 3.2 Cart Sync Logic
- On login: merge localStorage cart into Supabase cart (add quantities for duplicates)
- On page load (logged-in): fetch cart from Supabase
- On cart change (logged-in): debounced sync to Supabase
- Cart API route `app/api/cart/route.ts`: GET (fetch), POST (upsert), DELETE (remove)

### 3.3 Cart Page
- `app/(root)/cart/page.tsx`:
  - List all cart items with image, title, variant description, unit price, quantity, subtotal
  - Quantity +/- controls
  - Remove item button
  - Cart subtotal
  - "Proceed to Checkout" button
  - Empty cart state with "Browse Products" link
- Cart icon in navigation with badge count

### 3.4 Add to Cart UX
- Product detail: "Add to Cart" button → adds selected variant + quantity to cart
- Show toast/notification on add
- Update cart badge count immediately (optimistic)

**Deliverables**: Multi-item cart works for both guests and logged-in users. Cart persists across sessions.

---

## Phase 4: Checkout & Payment

### 4.1 Checkout Page
- `app/(root)/checkout/page.tsx`:
  - **Cart Summary**: list items, subtotal (read-only, link back to cart to edit)
  - **Customer Info**: name, email (optional for guest), phone (pre-filled if logged-in)
  - **Shipping Address**:
    - For logged-in: select saved address or enter new
    - For guest: enter new address
    - Reuse existing Google Maps picker + postal code components
    - Option to save address (logged-in only)
  - **Shipping Method**: fetch Biteship rates → select courier/service
  - **Order Summary**: subtotal + shipping = total
  - **Pay Now** button

### 4.2 Multi-Item Biteship Integration
- Enhance `app/api/shipping/rates/route.ts`:
  - Accept array of items (already does, but improve)
  - Aggregate total weight from all cart items
  - Calculate combined dimensions (or use largest item's dimensions)
  - Validate total weight against courier limits
- Enhance `lib/hooks/useShippingCalculator.ts` for cart context

### 4.3 Xendit Invoice Creation
- `app/api/checkout/route.ts` (POST):
  1. Validate cart items (check stock, prices still match)
  2. Create `ecom_orders` row with status `pending_payment`
  3. Create `ecom_order_items` rows (denormalized snapshot)
  4. Call Xendit API to create invoice:
     - Amount = total (subtotal + shipping)
     - Customer info (name, email, phone)
     - Items list for display
     - Success/failure redirect URLs
     - Invoice duration (e.g., 24 hours)
  5. Update `ecom_orders` with `xendit_invoice_id`
  6. Return invoice URL to frontend

### 4.4 Xendit Popup Widget
- Load Xendit.js in checkout page
- On "Pay Now" → call checkout API → get invoice URL → open popup
- Handle callbacks:
  - `onSuccess` → redirect to `/checkout/success?order={id}`
  - `onPending` → show "waiting for payment" message
  - `onFailure` → show error, allow retry
  - `onClose` → show "payment cancelled" message, allow retry

### 4.5 Payment Success Page
- `app/(root)/checkout/success/page.tsx`:
  - Display order number, total, payment method
  - "View Order Details" link (if logged in)
  - "Continue Shopping" link
  - Clear cart on success

### 4.6 Install Xendit Dependencies
```bash
# Xendit Node.js SDK for server-side invoice creation
pnpm add xendit-node
```

**Deliverables**: Full checkout flow from cart → shipping → payment → success.

---

## Phase 5: Order Management

### 5.1 Xendit Webhook Handler
- `app/api/webhooks/xendit/route.ts`:
  - Verify webhook signature/token
  - Handle `invoice.paid` event → update `ecom_orders.payment_status = 'paid'`, `ecom_orders.status = 'processing'`, `ecom_orders.paid_at`
  - Handle `invoice.expired` event → update `ecom_orders.payment_status = 'expired'`, `ecom_orders.status = 'cancelled'`
  - Log webhook events for debugging
  - Return 200 OK quickly (process async if needed)

### 5.2 Order Status Updates
- After payment confirmed:
  - Optionally create Biteship order (not just draft) for actual shipping
  - Deduct stock from `product_variants.stock_quantity`
- Order status flow:
  ```
  pending_payment → paid → processing → shipped → delivered
                  → expired → cancelled
  ```

### 5.3 Purchase History Page
- `app/(root)/orders/page.tsx` (protected — redirect to login if not authenticated):
  - List user's orders, newest first
  - Show: order number, date, status badge, total, item count
  - Click → order detail page

### 5.4 Order Detail Page
- `app/(root)/orders/[id]/page.tsx` (protected):
  - Order info: number, date, status, payment method
  - Items list with product details
  - Shipping info: address, courier, tracking number (when available)
  - Totals breakdown: subtotal, shipping, total

**Deliverables**: Webhooks process payments. Users can view purchase history and order details.

---

## Phase 6: Polish & Hardening

### 6.1 Error Handling
- Error boundaries for key pages (catalog, checkout)
- API route error responses: consistent `{ error, code }` format
- Graceful handling of Supabase/Xendit/Biteship downtime
- Toast notifications for user-facing errors

### 6.2 Stock Validation
- Check stock availability when adding to cart
- Re-validate stock at checkout time (before payment)
- Handle race conditions: use Supabase RPC for atomic stock decrement

### 6.3 Loading States
- Skeleton loaders for product catalog
- Loading spinner for checkout submission
- Optimistic updates for cart operations

### 6.4 Security
- Rate limiting on checkout and webhook endpoints
- Validate Xendit webhook signatures
- Sanitize HTML in product descriptions
- CSRF protection via Supabase auth tokens
- Service role key only used server-side

### 6.5 Mobile Responsiveness
- Audit all new pages on mobile
- Cart page: stack layout on mobile
- Checkout: single-column on mobile
- Order history: card layout on mobile

### 6.6 Cleanup
- Remove WhatsApp order flow code (`message-builder.ts`, `store-phone-number.ts`, `purchase-dialog/`)
- ~~Remove Cloudflare deployment files~~ ✅ Done
- Update README

---

## Migration SQL File

A complete migration file will be created at `supabase/migrations/001_ecommerce_schema.sql` containing:

### Existing Table Modifications
- **`products`**: ALTER TABLE to add `slug`, `short_description`, `category_ids`, `images`, `updated_at` (all nullable/defaulted — safe for ops)

### New Tables
- `product_options`, `product_option_values`, `product_variants`, `product_variant_option_values` — variant system
- `ecom_orders` — consumer orders (replaces CLAUDE.md's `orders` to avoid B2B conflict)
- `ecom_order_items` — consumer order line items
- `profiles` — extends auth.users
- `addresses` — saved shipping addresses
- `cart_items` — logged-in user carts

### Other
- RLS policies
- Indexes
- Trigger for auto-creating profiles on user signup
- Trigger for `updated_at` timestamps
- Backfill: generate slugs from existing product names

This file is for reference / manual execution. The actual migration will be coordinated with the ops team.

### Existing Tables NOT Modified
- `orders` — B2B orders (client_id NOT NULL, different structure)
- `order_items` — B2B order line items (references products directly, no variants)
- `clients`, `client_products` — B2B client management
- `employees`, `attendance`, `schedules`, etc. — HR system
- `jubelio_*` — ERP integration
- `locations` — business locations
- `notification_logs` — ops notifications

---

## File Inventory: What to CREATE vs MODIFY vs DELETE

### Files to CREATE (new):
| File | Purpose |
|---|---|
| `middleware.ts` | Supabase auth session refresh |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client + admin client |
| `lib/supabase/types.ts` | Generated DB types placeholder |
| `lib/supabase/queries/products.ts` | Product query functions |
| `lib/stores/auth.ts` | Auth state (nanostores) |
| `lib/stores/cart.ts` | Multi-item cart store (nanostores) |
| `lib/hooks/useAuth.ts` | Auth hook |
| `lib/hooks/useCart.ts` | Cart operations hook |
| `lib/xendit/client.ts` | Xendit API wrapper |
| `lib/xendit/webhook.ts` | Webhook signature verification |
| `app/api/auth/callback/route.ts` | OAuth callback handler |
| `app/api/cart/route.ts` | Cart sync API |
| `app/api/checkout/route.ts` | Order creation + Xendit invoice |
| `app/api/webhooks/xendit/route.ts` | Payment webhook |
| `app/(root)/login/page.tsx` | Google sign-in page |
| `app/(root)/cart/page.tsx` | Multi-item cart page |
| `app/(root)/checkout/page.tsx` | Unified checkout page |
| `app/(root)/checkout/success/page.tsx` | Payment success page |
| `app/(root)/orders/page.tsx` | Purchase history list |
| `app/(root)/orders/[id]/page.tsx` | Order detail page |
| `supabase/migrations/001_ecommerce_schema.sql` | DB migration |

### Files to MODIFY (existing):
| File | What to Change |
|---|---|
| `app/layout.tsx` | Add Supabase provider + auth context |
| `app/(root)/katalog/page.tsx` | Fetch products from Supabase instead of static JSON |
| `app/(root)/product/[slug]/page.tsx` | Fetch from Supabase, add variant selector, "Add to Cart" |
| `app/(root)/product/[slug]/checkout/page.tsx` | Major refactor → redirect to unified checkout |
| `app/api/shipping/rates/route.ts` | Remove edge runtime, enhance for multi-item cart |
| `app/api/shipping/draft-order/route.ts` | Remove edge runtime |
| `next.config.ts` | Remove Cloudflare adapter, set `output: 'standalone'` |
| `package.json` | Add @supabase/supabase-js, @supabase/ssr, xendit-node |
| `types/product.ts` | Update types for Supabase schema |
| Navigation component | Add cart icon + login button |

### Files to DELETE (Phase 6 cleanup):
| File | Why |
|---|---|
| `data/products.json` | Replaced by Supabase |
| `data/categories.json` | Replaced by Supabase |
| `constant/product/product-list.ts` | Replaced by Supabase queries |
| `lib/catalog.ts` | Static loader no longer needed |
| `lib/message-builder.ts` | WhatsApp order flow removed |
| `constant/store-phone-number.ts` | WhatsApp no longer used |
| `components/purchase-dialog/` | Old purchase dialog |
| `app/api/catalog/[...slug]/route.ts` | CDN proxy no longer needed |
| ~~`wrangler.toml`~~ | ~~Cloudflare config~~ | ✅ Removed

---

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/callback` | - | OAuth callback |
| GET | `/api/products` | - | List products |
| GET | `/api/products/[slug]` | - | Product detail |
| GET | `/api/cart` | User | Get user cart |
| POST | `/api/cart` | User | Add/update cart item |
| DELETE | `/api/cart` | User | Remove cart item |
| POST | `/api/checkout` | Optional | Create order + invoice |
| POST | `/api/shipping/rates` | - | Get shipping rates |
| POST | `/api/webhooks/xendit` | Webhook | Payment notification |

---

## Open Questions / Dependencies

1. ~~**Supabase project access**: Need the Supabase URL + keys for the shared project~~ ✅ Confirmed — shared Supabase project with ops
2. **Xendit account**: Need API keys (test + production) and webhook URL configured
3. **Google OAuth**: Need Google Cloud Console project with OAuth credentials, configured in Supabase
4. ~~**Ops migration**: When will the ops team migrate the existing product table to the new schema?~~ ✅ Resolved — we extend existing `products` table with nullable columns, create separate `ecom_orders`/`ecom_order_items`
5. **Railway setup**: Need Railway project created and environment variables configured
6. **Product data seeding**: Who will seed the initial product data? Need to backfill `slug`, `images`, `category_ids` on existing product rows, and create variant records

## Existing Database (Confirmed)

The Supabase database contains these ops tables (DO NOT modify structure):
- `attendance`, `employees`, `schedules`, `locations` — HR/attendance system
- `orders` (B2B, `client_id NOT NULL`), `order_items`, `order_number_sequences` — B2B order management
- `products` (flat: name, unit, sku, base_price, is_global) — B2B product catalog (**extending with ecom columns**)
- `clients`, `client_products` — B2B client management
- `jubelio_*` — ERP integration
- `bonus_policy`, `config_audit_log` — ops config
- Various views: `attendance_*_view`, `attendance_*_secure`, `current_employee`
