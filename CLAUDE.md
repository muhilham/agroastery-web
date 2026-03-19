# Agroastery Web — E-Commerce Service

## Project Overview

Customer-facing e-commerce web app for Agroastery (Indonesian specialty coffee).
Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, deployed on **Railway**.

Shares a **Supabase (PostgreSQL)** database with the ops admin panel (separate repo).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Node.js runtime) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 |
| State | Nanostores |
| Forms | React Hook Form + Zod |
| Auth | Supabase Auth (Google OAuth only) |
| Database | Supabase (PostgreSQL) — shared with ops admin |
| Payment | Xendit (popup/embedded checkout widget) |
| Shipping | Biteship API |
| Maps | Google Maps JS API |
| Deployment | Railway |

## Architecture Decisions

### Authentication
- **Supabase Auth with Google OAuth** — Google sign-in only, no email/password
- **Guest checkout supported** — users can purchase without logging in (collect email/phone at checkout)
- **Login required for**: viewing purchase history, saved addresses
- Use `@supabase/ssr` for Next.js server-side auth (cookies-based)

### Database (Shared Supabase)
- This app shares the same Supabase project as the ops admin panel
- Products are read **live from Supabase** (no more static JSON/CDN)
- New ecom tables are added alongside existing ops tables
- **You MAY extend the existing `products` table** with new nullable columns (safe for ops)
- **Do NOT modify or drop existing columns** on any ops table
- **Do NOT modify** the B2B `orders`, `order_items`, `clients`, or HR tables
- Ops dashboard uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) — confirmed safe

### Product Variants — Flexible N-Level Model
Products use a Shopify-style option/variant model:
- `product_options` table: defines option axes (e.g., Size, Grind, Roast Level)
- `product_option_values` table: defines values per option (e.g., 150g, 1kg, Fine, Medium)
- `product_variants` table: each variant is a unique combination of option values with its own price, SKU, stock, and shipping weight
- `product_variant_option_values` junction table: links variants to their option value combination

### Cart
- **Multi-item cart** — users can add multiple products/variants and checkout at once
- Cart stored in Supabase for logged-in users, localStorage for guests
- Merge guest cart into user cart on login

### Payment — Xendit
- **Xendit popup/embedded checkout widget** (not redirect)
- Replace WhatsApp order flow entirely
- Flow: Create Xendit invoice via API → display popup widget → handle callback
- Webhook endpoint receives payment confirmation → update order status
- Support all Xendit payment methods: VA, e-wallets, QRIS, cards

### Shipping — Biteship
- Already integrated — improve with:
  - Multi-item weight aggregation for cart
  - Cache courier rates briefly (avoid repeated API calls)
  - Better error handling and fallbacks

### Order Flow
1. User browses products (from Supabase)
2. Adds items to cart (multi-item)
3. Proceeds to checkout → fills shipping info
4. Shipping rates calculated via Biteship
5. Xendit popup widget for payment
6. Webhook confirms payment → order status updated
7. Order visible in user's purchase history (if logged in)

## Database Schema

> IMPORTANT: The Supabase database is shared with the ops admin panel.
> We EXTEND the existing `products` table and CREATE new ecom-specific tables.
> We do NOT create a separate products table — we reuse the existing one.

### Existing `products` Table (DO NOT remove/rename these columns)

```sql
-- This table ALREADY EXISTS in Supabase. These columns are used by the ops admin.
products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- product name (ops uses this, ecom reads it too)
  description TEXT,                -- product description
  unit TEXT,                       -- e.g. "pcs", "kg"
  sku TEXT,                        -- product-level SKU
  base_price NUMERIC,              -- base price (ops uses NUMERIC, ecom variants use BIGINT)
  image_url TEXT,                  -- single image URL (ops uses this)
  is_active BOOLEAN DEFAULT true,  -- whether product is visible
  is_global BOOLEAN DEFAULT true,  -- ops-specific flag
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### ALTER TABLE: Add ecom columns to existing `products`

```sql
-- These columns are ADDED to the existing products table.
-- All are nullable or have defaults, so existing ops queries are unaffected.
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_ids TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';  -- [{url, alt, sort_order}]
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

### New Tables

```sql
-- IMPORTANT: In ecom code, use `products.name` (not `title`) as the product name.
-- The existing column is called `name`, not `title`.

-- Product option axes (e.g., "Size", "Grind")
product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- "Size", "Grind Type"
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Option values (e.g., "150g", "1kg", "Fine", "Medium")
product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL,          -- "150g", "Fine Grind"
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Concrete variants (each unique combination)
product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  price BIGINT NOT NULL,        -- in IDR (no decimals needed)
  compare_at_price BIGINT,      -- original price for discount display
  stock_quantity INT DEFAULT 0,
  ship_weight_grams INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Junction: variant ↔ option values
product_variant_option_values (
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
)

-- User profiles (extends Supabase auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  default_address_id UUID,      -- references addresses(id)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- Saved addresses
addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,                   -- "Home", "Office"
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Shopping cart (for logged-in users)
cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, variant_id)
)

-- E-commerce orders (SEPARATE from B2B `orders` table which has client_id NOT NULL)
-- IMPORTANT: Use `ecom_orders` NOT `orders` for consumer orders.
-- The existing `orders` table is for B2B and must not be modified.
ecom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- nullable for guest checkout
  order_number TEXT UNIQUE NOT NULL,    -- human-readable, e.g. AGR-20260319-XXXX
  status TEXT NOT NULL DEFAULT 'pending_payment',
    -- pending_payment, paid, processing, shipped, delivered, cancelled, refunded

  -- Customer info (denormalized for guest + historical record)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,

  -- Shipping info
  shipping_address JSONB NOT NULL,     -- full address snapshot
  shipping_courier TEXT,               -- e.g. "jne"
  shipping_service TEXT,               -- e.g. "REG"
  shipping_cost BIGINT NOT NULL DEFAULT 0,
  shipping_etd TEXT,                   -- "2-3 days"
  tracking_number TEXT,
  biteship_order_id TEXT,              -- Biteship draft/order ID

  -- Payment info
  xendit_invoice_id TEXT,
  xendit_payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
    -- unpaid, paid, expired, refunded
  paid_at TIMESTAMPTZ,

  -- Totals
  subtotal BIGINT NOT NULL,            -- sum of line items
  total BIGINT NOT NULL,               -- subtotal + shipping

  -- Metadata
  notes TEXT,                          -- customer notes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

-- E-commerce order line items (SEPARATE from B2B `order_items`)
ecom_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES ecom_orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,

  -- Denormalized snapshot (so order history survives product changes)
  product_name TEXT NOT NULL,          -- from products.name (NOT "title")
  variant_description TEXT NOT NULL,    -- "150g, Fine Grind"
  unit_price BIGINT NOT NULL,
  quantity INT NOT NULL,
  subtotal BIGINT NOT NULL,            -- unit_price * quantity
  ship_weight_grams INT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Row Level Security (RLS) Policies

> IMPORTANT: Do NOT enable RLS on `products`, `product_options`, `product_option_values`,
> `product_variants`, or `product_variant_option_values`. These are read server-side
> using the service role key. Enabling RLS could break the ops dashboard.
> Only enable RLS on ecom-specific user data tables.

```sql
-- NO RLS on products/variants — read server-side via service role key
-- NO RLS on product_options, product_option_values, product_variant_option_values

-- Profiles: users can read/update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cart: users can CRUD their own cart
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- E-commerce orders: users can view their own orders
ALTER TABLE ecom_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON ecom_orders FOR SELECT USING (auth.uid() = user_id);

-- E-commerce order items: users can view items of their own orders
ALTER TABLE ecom_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON ecom_order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM ecom_orders WHERE user_id = auth.uid())
  );

-- Addresses: users can CRUD their own addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
```

### Key Indexes

```sql
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_ecom_orders_user ON ecom_orders(user_id);
CREATE INDEX idx_ecom_orders_number ON ecom_orders(order_number);
CREATE INDEX idx_ecom_orders_xendit ON ecom_orders(xendit_invoice_id);
CREATE INDEX idx_ecom_order_items_order ON ecom_order_items(order_id);
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # server-side only, for order creation

# Xendit
XENDIT_SECRET_KEY=xnd_production_...  # server-side only
XENDIT_WEBHOOK_TOKEN=...              # verify webhook signatures
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_production_...  # for popup widget

# Biteship (existing)
BITESHIP_API_KEY=...

# Google Maps (existing)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Origin/Store info (existing)
NEXT_PUBLIC_ORIGIN_POSTAL_CODE=12440
NEXT_PUBLIC_ORIGIN_NAME=Agroastery
# ... etc

# App
NEXT_PUBLIC_APP_URL=https://agroastery.com  # for Xendit callback URLs
```

## File Structure (New/Modified)

```
app/
├── api/
│   ├── auth/
│   │   └── callback/route.ts        # Supabase OAuth callback
│   ├── cart/
│   │   └── route.ts                 # Cart sync API (GET, POST, DELETE)
│   ├── checkout/
│   │   └── route.ts                 # Create order + Xendit invoice
│   ├── webhooks/
│   │   └── xendit/route.ts          # Xendit payment webhook
│   ├── shipping/
│   │   └── rates/route.ts           # (existing, enhance for multi-item)
│   └── products/
│       └── route.ts                 # Product listing from Supabase
├── (root)/
│   ├── login/page.tsx               # Google sign-in page
│   ├── auth/callback/page.tsx       # OAuth redirect handler
│   ├── katalog/page.tsx             # (existing, refactor for Supabase)
│   ├── product/[slug]/
│   │   ├── page.tsx                 # (existing, refactor)
│   │   └── checkout/page.tsx        # (existing, major refactor)
│   ├── cart/page.tsx                # NEW: multi-item cart page
│   ├── orders/
│   │   ├── page.tsx                 # Purchase history list
│   │   └── [id]/page.tsx            # Order detail page
│   └── checkout/
│       ├── page.tsx                 # NEW: unified checkout (from cart)
│       └── success/page.tsx         # Payment success page
├── layout.tsx                       # Add Supabase provider + auth context
lib/
├── supabase/
│   ├── client.ts                    # Browser Supabase client
│   ├── server.ts                    # Server Supabase client (cookies)
│   ├── middleware.ts                # Auth middleware helper
│   └── types.ts                     # Generated database types
├── xendit/
│   ├── client.ts                    # Xendit API wrapper
│   └── webhook.ts                   # Webhook signature verification
├── stores/
│   ├── cart.ts                      # NEW: multi-item cart store
│   ├── auth.ts                      # NEW: auth state store
│   └── ...existing stores
├── hooks/
│   ├── useAuth.ts                   # Auth hook
│   ├── useCart.ts                   # Cart operations hook
│   └── ...existing hooks
middleware.ts                        # NEW: Supabase auth session refresh
```

## Implementation Phases

### Phase 1: Foundation
- Switch from edge to Node.js runtime (for Railway)
- Set up Supabase client (`@supabase/ssr`)
- Set up auth middleware for session refresh
- Google OAuth sign-in flow
- User profile creation (on first login)
- Environment variables setup

### Phase 2: Product Catalog from Supabase
- Create Supabase query layer for products with N-level variants
- Refactor catalog page to fetch from Supabase
- Refactor product detail page for variant selection UI
- Handle variant combination selection → price/stock/SKU resolution
- Keep existing UI components, change data source

### Phase 3: Multi-Item Cart
- Cart store (nanostores) with localStorage for guests
- Cart page UI (list items, quantity adjust, remove, subtotal)
- Cart sync API for logged-in users (Supabase cart_items)
- Merge guest cart → user cart on login
- Cart icon with item count in navigation

### Phase 4: Checkout & Payment
- Unified checkout page (from cart)
- Shipping address form (reuse existing + save address for logged-in)
- Multi-item Biteship rate calculation
- Xendit invoice creation API
- Xendit popup widget integration
- Payment success/failure handling

### Phase 5: Order Management
- Xendit webhook handler (payment confirmation)
- Order creation flow (checkout → order record)
- Order status updates
- Purchase history page (for logged-in users)
- Order detail page with status tracking

### Phase 6: Polish & Hardening
- Error boundaries and loading states
- Stock validation at checkout
- Rate limiting on API routes
- SEO and meta tags
- Mobile responsiveness audit

## Coding Conventions

- **Runtime**: Node.js (not edge) — required for Supabase SSR cookies
- **API routes**: Use Next.js Route Handlers (`app/api/`)
- **Server components**: Default to server components; use `"use client"` only when needed
- **Data fetching**: Server components fetch directly via Supabase server client
- **State**: Nanostores for client-side state (cart, auth, UI)
- **Validation**: Zod schemas for all API inputs and form data
- **Errors**: Return structured `{ error: string, code?: string }` from API routes
- **Money**: Store as BIGINT (IDR has no decimals), display with `numberToIdr` util
- **Types**: Generate Supabase types with `supabase gen types typescript`
- **Testing**: Vitest for unit tests
- **Imports**: Use `@/` path alias

## Key Integration Notes

### Supabase Auth + Google OAuth
- Configure Google OAuth provider in Supabase dashboard
- Redirect URL: `{APP_URL}/api/auth/callback`
- Use PKCE flow (default for `@supabase/ssr`)
- Create profile row via database trigger on `auth.users` insert

### Xendit Popup Widget
- Load Xendit.js script in checkout page
- Create invoice via server API → get invoice URL
- Open popup with `Xendit.popup.open(invoiceUrl)`
- Handle `onSuccess`, `onPending`, `onFailure`, `onClose` callbacks
- Webhook at `/api/webhooks/xendit` verifies signature and updates order

### Biteship Multi-Item
- Aggregate weights from all cart items
- Use largest item dimensions (or calculate combined volume)
- Single Biteship API call for the whole cart

### Shared Database with Ops
- This app reads products but does NOT create/edit them (ops admin does that)
- E-commerce orders go to `ecom_orders` table (NOT the B2B `orders` table)
- RLS only on ecom user data tables (profiles, cart_items, addresses, ecom_orders, ecom_order_items)
- NO RLS on products or variant tables (to avoid breaking ops dashboard)
- Service role key used server-side for order creation (bypasses RLS for guest orders)
- Ops dashboard uses service role key — confirmed safe with our RLS approach

### Existing Ops Tables (DO NOT MODIFY)
These tables exist in the shared Supabase database. Do NOT alter, drop, or add RLS to them:
- `orders` — B2B orders (`client_id UUID NOT NULL REFERENCES clients(id)`)
- `order_items` — B2B order line items (`order_id`, `product_id`, `quantity`, `price`)
- `order_number_sequences` — auto-increment for order numbers
- `clients`, `client_products` — B2B client management
- `employees`, `attendance`, `schedules`, `locations` — HR system
- `jubelio_*` — ERP integration tables
- `bonus_policy`, `config_audit_log`, `notification_logs` — ops config

### Column Name Mapping (JSON → Supabase)
The existing codebase uses static JSON with different field names than the database:
| Static JSON (`products.json`) | Supabase `products` table | Notes |
|---|---|---|
| `title` | `name` | **USE `name` in all Supabase queries** |
| `description` | `description` | Same |
| `shortDescription` | `short_description` | New column (added by migration) |
| `images[].image` | `images` (JSONB) | New column: `[{url, alt, sort_order}]` |
| `category_ids` | `category_ids` (TEXT[]) | New column |
| `variants[].price` | `product_variants.price` | Moved to variant table |
| `variants[].sku` | `product_variants.sku` | Moved to variant table |
| `variants[].weight` | via `product_option_values.value` | Now an option value |
| `variants[].shipWeightGrams` | `product_variants.ship_weight_grams` | Moved to variant table |
| `grindSize` | via `product_options` + `product_option_values` | Now an option axis |

## Code Patterns (Reference for Implementation)

### Supabase Server Client (lib/supabase/server.ts)
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// For server-side operations that bypass RLS (e.g., guest order creation)
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
```

### Supabase Browser Client (lib/supabase/client.ts)
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Fetching Products with Variants (lib/supabase/queries/products.ts)
```typescript
// Use admin client (service role) — no RLS on products
export async function getProductBySlug(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_options (
        id, name, display_order,
        product_option_values (id, value, display_order)
      ),
      product_variants (
        id, sku, price, compare_at_price, stock_quantity, ship_weight_grams, is_active,
        product_variant_option_values (option_value_id)
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return { data, error };
}
```

### API Route Pattern (app/api/example/route.ts)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({ /* ... */ });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    // ... business logic
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
```
