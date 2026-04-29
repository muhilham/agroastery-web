# Agroastery Web — Agent Instructions

E-commerce app for Indonesian specialty coffee. Next.js 16.2.3+, Supabase backend, deployed on Railway.

## Quick Commands

```bash
# Dev (requires nvm with lts/*, uses Turbopack)
pnpm dev

# Test (uses custom runner for crypto polyfill)
pnpm test

# Build (standalone output for Railway)
pnpm build

# Lint
pnpm lint
```

## Tech Stack

- **Framework**: Next.js 16+ (App Router, Node.js runtime — NOT edge)
- **Package Manager**: pnpm
- **Node Version**: lts/* (managed via nvm)
- **Database**: Supabase (PostgreSQL), shared with ops admin panel
- **State**: Nanostores
- **Forms**: React Hook Form + Zod
- **Auth**: Supabase Auth (Google OAuth only, guest checkout supported)
- **Payment**: Pivot payment gateway (QRIS) - primary payment method
- **Email**: Resend for transactional email notifications
- **Shipping**: Biteship API
- **Testing**: Vitest + jsdom
- **Deployment**: Railway (standalone output)

## Database Rules

- Use `products.name` (NOT `title`) — the column is `name`
- E-commerce orders go to `ecom_orders` (NOT `orders` which is B2B)
- Use `createSupabaseAdminClient()` for server-side reads (products/variants don't have RLS)
- Only `profiles`, `cart_items`, `addresses`, `ecom_orders`, `ecom_order_items` have RLS enabled
- Money stored as BIGINT (IDR, no decimals)

## Critical Conventions

### Server Client Pattern
```typescript
// For authenticated user operations
import { createSupabaseServerClient } from "@/lib/supabase/server";

// For server-side reads (products, guest orders)
import { createSupabaseAdminClient } from "@/lib/supabase/server";
```

### API Route Pattern
- Use `export const dynamic = 'force-dynamic'` when appropriate
- NO `export const runtime = 'edge'` — this project uses Node.js runtime
- Return structured errors: `{ error: string, code?: string }`
- Validate with Zod schemas

### Product/Variant Data
Products use Shopify-style N-level variants:
- `product_options` → `product_option_values` → `product_variants`
- `product_variant_option_values` links variants to their option combinations
- Fetch with nested selects (see `lib/supabase/queries/products.ts`)

### Order Flow
1. Checkout validates stock server-side (decrements atomically via RPC or conditional UPDATE)
2. Creates `ecom_orders` record with `status: 'pending_payment'`
3. Creates Pivot payment session (QRIS)
4. On payment webhook, updates order status and creates Biteship draft order

## File Locations

```
app/
  (root)/          # Customer-facing pages
  api/             # API routes
lib/
  supabase/        # Client/server clients + queries
  stores/          # Nanostores (cart, auth, search, shipping)
  pivot/           # Payment gateway client
  biteship/        # Shipping API client
  telegram/        # Order notifications
```

## Environment Variables

Copy `.env.example` to `.env.local`. Required for local dev:
- Supabase credentials (URL, anon key, service role)
- Biteship API key
- Xendit keys (or set `XENDIT_MOCK=true` for testing without real payments)
- Google Maps API key
- Telegram bot token (optional, for order notifications)

## Testing

Vitest requires a crypto polyfill — always use `pnpm test` (not `vitest` directly) which runs `vitest-runner.js`.

## Deployment Notes

- Railway uses standalone output (configured in `next.config.ts` and `railway.toml`)
- Cloudflare deployment docs exist but Railway is primary
- Uses `trailingSlash: true` in Next.js config

## Dependencies to Know

- `@supabase/ssr` — Server-side auth with cookies
- `nanostores` — State management
- `xendit-node` — Payment API
- `zod` — Validation everywhere
- `resend` — Transactional email

## Style Guide

- Tailwind with custom screens: `sm` (mobile max), `md` (tablet), `lg`/`tablet`/`desktop`
- Custom color: `background` is dark (#1a1a1a), `foreground` is cream (#f5ebc9)
- Use `@/` path alias for imports
