# Third-Party Services Integration Documentation

This document outlines all third-party services integrated into the Agroastery e-commerce platform, including the APIs used and how they interact with the system.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Service Details](#service-details)
   - [Supabase](#1-supabase---backend-database--authentication)
   - [Pivot Payment](#2-pivot-payment---payment-gateway)
   - [Biteship](#3-biteship---shipping-logistics)
   - [Google Maps](#4-google-maps---address-autocomplete--geolocation)
   - [Resend](#5-resend---transactional-emails)
   - [Telegram](#6-telegram---order-notifications)
   - [Jubelio](#7-jubelio---erp--inventory-sync)
   - [Xendit (Deprecated)](#8-xendit---legacy-payment-gateway-not-actively-used)
4. [Data Flow](#data-flow)
5. [Environment Variables](#environment-variables)
6. [Security Considerations](#security-considerations)

---

## Overview

Agroastery is an Indonesian specialty coffee e-commerce platform built on Next.js with a server-side Node.js runtime. The platform integrates with multiple third-party services to handle:

| Category | Service | Purpose |
|----------|---------|---------|
| **Database & Auth** | Supabase | PostgreSQL database, authentication, real-time subscriptions |
| **Payment** | Pivot Payment | QRIS payment processing (primary) |
| **Shipping** | Biteship | Multi-courier shipping rates and order management |
| **Maps** | Google Maps | Address autocomplete, geocoding |
| **Email** | Resend | Transactional email delivery |
| **Notifications** | Telegram | Real-time order and payment alerts |
| **ERP/Inventory** | Jubelio | Product and inventory synchronization |

> **Note:** Xendit was previously used as a payment gateway but has been replaced by Pivot Payment. The `xendit-node` package remains in dependencies but is no longer used in the application code.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT (Browser)                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  Product List   │  │  Shopping Cart  │  │   Checkout UI   │  │   Order Tracking    │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘ │
│           │                    │                    │                       │            │
│           ▼                    ▼                    ▼                       ▼            │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Google Maps API (Client-side)                             │ │
│  │                    - Places Autocomplete for addresses                              │ │
│  │                    - Geocoding for lat/lng coordinates                              │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS SERVER (Node.js Runtime)                           │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              API Routes (App Router)                               │  │
│  │                                                                                    │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐  │  │
│  │  │ /api/checkout │ │ /api/shipping │ │ /api/webhooks │ │    /api/account/*     │  │  │
│  │  │     POST      │ │    /rates     │ │   (pivot,     │ │                       │  │  │
│  │  │               │ │    POST       │ │   biteship)   │ │                       │  │  │
│  │  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────────────────────┘  │  │
│  │          │                 │                 │                                     │  │
│  │          ▼                 ▼                 ▼                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        SERVICE LAYER (lib/*)                                 │  │  │
│  │  │                                                                              │  │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │  │  │
│  │  │  │   pivot/client   │  │ biteship/create  │  │    telegram/notify       │  │  │  │
│  │  │  │   .ts            │  │ Order.ts         │  │    .ts                   │  │  │  │
│  │  │  └────────┬─────────┘  └────────┬─────────┘  └───────────┬──────────────┘  │  │  │
│  │  │           │                     │                        │                 │  │  │
│  │  │  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌───────────▼──────────────┐  │  │  │
│  │  │  │ resend/sendOrder │  │ jubelio/client   │  │    supabase/server       │  │  │  │
│  │  │  │ Email.ts         │  │   .ts            │  │      .ts                 │  │  │  │
│  │  │  └────────┬─────────┘  └────────┬─────────┘  └───────────┬──────────────┘  │  │  │
│  │  │           │                     │                        │                 │  │  │
│  │  └───────────┼─────────────────────┼────────────────────────┼─────────────────┘  │  │
│  │              │                     │                        │                    │  │
│  └──────────────┼─────────────────────┼────────────────────────┼────────────────────┘  │
│                 │                     │                        │                       │
│                 ▼                     ▼                        ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          SUPABASE (PostgreSQL + Auth)                             │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
│  │  │   products   │  │  ecom_orders │  │    cart_     │  │      profiles        │ │  │
│  │  │   (no RLS)   │  │   (RLS on)   │  │   items      │  │      (RLS on)        │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ │  │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │  │
  │  │  │   product_   │  │  ecom_order_ │  │   addresses  │  │ ecom_notification_   │ │  │
  │  │  │   variants   │  │   items      │  │   (RLS on)   │  │   logs               │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   PIVOT PAYMENT     │     │      BITESHIP       │     │      RESEND         │
│   (Payment Gateway) │     │   (Shipping API)    │     │   (Email Service)   │
│                     │     │                     │     │                     │
│  • QRIS Payments    │     │  • Shipping Rates   │     │  • Order Confirm    │
│  • Webhook Callbacks│     │  • Order Creation   │     │  • Payment Receipts │
│  • Token-based Auth │     │  • Waybill Tracking │     │  • React Email      │
└──────────┬──────────┘     └──────────┬──────────┘     └─────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│     TELEGRAM        │     │      JUBELIO        │     │     GOOGLE MAPS     │
│   (Notifications)   │     │    (ERP System)     │     │   (Maps/Places)     │
│                     │     │                     │     │                     │
│  • Order Alerts     │     │  • Product Sync     │     │  • Address Search   │
│  • Payment Confirm  │     │  • Inventory Mgmt   │     │  • Geocoding        │
│  • Bot API          │     │  • Stock Levels     │     │  • Places Library   │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

---

## Service Details

### 1. Supabase - Backend Database & Authentication

**Purpose:** Primary database, authentication, and real-time subscriptions

**API Used:**
- **Supabase JavaScript Client** (`@supabase/supabase-js`)
- **Supabase SSR** (`@supabase/ssr`) for server-side rendering

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/supabase/server.ts` | Server-side client creation (auth + admin) |
| `lib/supabase/client.ts` | Browser client creation |
| `lib/supabase/queries/*.ts` | Database queries for products, profiles, addresses |

**Authentication Methods:**
- Google OAuth (primary)
- Guest checkout (no authentication required)

**Database Tables with RLS:**
- `profiles` - User profiles
- `cart_items` - Shopping cart items
- `addresses` - Shipping addresses
- `ecom_orders` - E-commerce orders
- `ecom_order_items` - Order line items

**Database Tables without RLS:**
- `products` - Product catalog
- `product_variants` - Product variants
- `product_options` - Product options (e.g., Grind type)

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

### 2. Pivot Payment - Payment Gateway

**Purpose:** Primary payment processor for QRIS payments

**API Used:**
- **Base URL:** `https://api.pivot-payment.com`
- **Authentication:** OAuth 2.0 Client Credentials flow
- **Endpoints:**
  - `POST /v1/access-token` - Obtain access token
  - `POST /v2/payments` - Create payment session
  - `POST /v2/payments/simulations` - Simulate payment (testing)

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/pivot/client.ts` | Client implementation with token caching |
| `app/api/webhooks/pivot/route.ts` | Webhook handler for payment events |
| `app/api/checkout/route.ts` | Creates payment sessions during checkout |

**Payment Flow:**
1. Checkout creates order in database with `pending_payment` status
2. `createQrisPaymentSession()` called with order details
3. Pivot returns QR code URL and EMVCO string
4. Customer scans QR code with banking app
5. Pivot sends webhook (`PAYMENT.PAID`) to `/api/webhooks/pivot`
6. Order status updated to `paid` and `processing`
7. Telegram notification sent, Biteship order created, email sent

**Environment Variables:**
```env
PIVOT_API_URL=https://api.pivot-payment.com
PIVOT_MERCHANT_ID=your-merchant-id
PIVOT_MERCHANT_SECRET=your-merchant-secret
PIVOT_CALLBACK_API_KEY=webhook-verification-key
```

**Webhook Events Handled:**
- `PAYMENT.PAID` - Payment successful
- `PAYMENT.EXPIRED` - Payment expired (stock restored)
- `PAYMENT.CANCELLED` - Payment cancelled (stock restored)
- `PAYMENT.TEST` - Test event (acknowledged)

---

### 3. Biteship - Shipping Logistics

**Purpose:** Multi-courier shipping rates and order fulfillment

**API Used:**
- **Base URL:** `https://api.biteship.com/v1`
- **Authentication:** Bearer token in Authorization header
- **Endpoints:**
  - `POST /rates/couriers` - Get shipping rates
  - `POST /orders` - Create shipping order
  - `POST /v1/draft_orders` - Create draft order

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/hooks/useShippingCalculator.ts` | React hook for shipping calculations |
| `lib/biteship/createOrder.ts` | Creates Biteship orders after payment |
| `app/api/shipping/rates/route.ts` | Proxies rate requests to Biteship |
| `app/api/shipping/draft-order/route.ts` | Creates draft orders |
| `app/api/webhooks/biteship/route.ts` | Webhook handler for order updates |

**Supported Couriers:**
- Anteraja
- JNE
- SiCepat
- (Configurable via `NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS`)

**Shipping Flow:**
1. Customer enters address at checkout
2. `calculateShipping()` fetches rates from Biteship API
3. Customer selects courier and service
4. After payment confirmed, `createBiteshipOrder()` creates order
5. Biteship assigns courier and generates waybill
6. Webhook updates order status and tracking number

**Order Status Mapping:**
```typescript
const BITESHIP_STATUS_MAP = {
  confirmed: 'processing',
  scheduled: 'processing',
  picking_up: 'processing',
  picked: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'refunded',
  // ... more mappings
};
```

**Environment Variables:**
```env
BITESHIP_API_KEY=sk_test_...
BITESHIP_WEBHOOK_SECRET=random-secret-for-verification
NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS=anteraja,jne,sicepat
```

---

### 4. Google Maps - Address Autocomplete & Geolocation

**Purpose:** Address autocomplete, geocoding, and coordinate lookup

**API Used:**
- **Google Maps JavaScript API**
- **Places Library** - Autocomplete suggestions
- **Marker Library** - Map markers

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/maps/loadGoogleMaps.ts` | Dynamic library loader with caching |
| `app/(root)/checkout/page.tsx` | Address input with autocomplete |

**Features:**
- Address autocomplete using Places library
- Geocoding to lat/lng coordinates
- Coordinate-based shipping rate calculations

**Environment Variables:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

---

### 5. Resend - Transactional Emails

**Purpose:** Send order confirmation and payment receipt emails

**API Used:**
- **Resend Node.js SDK** (`resend` package)
- **React Email Components** (`@react-email/components`)

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/resend/sendOrderEmail.ts` | Email sending logic with deduplication |
| `lib/resend/templates/OrderConfirmation.tsx` | React Email template |

**Email Triggers:**
1. Payment confirmed via Pivot webhook
2. Email sent only once (deduplication via `email_sent_at` field)
3. React Email template renders order details

**Email Content:**
- Order number and date
- Product items with variants
- Subtotal, shipping cost, total
- Shipping address
- Tracking URL

**Environment Variables:**
```env
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://agroastery.com
```

---

### 6. Telegram - Order Notifications

**Purpose:** Real-time notifications for new orders and payments

**API Used:**
- **Telegram Bot API** (`https://api.telegram.org/bot{token}`)
- **sendMessage** endpoint

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/telegram/notify.ts` | Notification sending with logging |

**Notification Types:**
1. **Order Created** (`sendOrderNotification`)
   - Triggered: When order is created at checkout
   - Contains: Order number, customer details, items, totals

2. **Payment Confirmed** (`sendPaymentNotification`)
   - Triggered: When Pivot webhook confirms payment
   - Contains: Order number, customer, amount, timestamp

**Features:**
- Markdown formatting for readable messages
- Notification logging to `ecom_notification_logs` table
- Graceful degradation if not configured

**Environment Variables:**
```env
TELEGRAM_BOT_TOKEN=123456789:AAxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890
```

---

### 7. Jubelio - ERP / Inventory Sync

**Purpose:** Product catalog and inventory synchronization

**API Used:**
- **Base URL:** `https://api2.jubelio.com`
- **Authentication:** Email/password login with token caching
- **Endpoints:**
  - `POST /login` - Authentication
  - `GET /inventory/items/` - List products
  - `GET /inventory/items/group/{id}` - Product details

**Key Integration Points:**

| File | Purpose |
|------|---------|
| `lib/jubelio/client.ts` | API client with token management |
| `lib/jubelio/sync.ts` | Synchronization logic |
| `app/api/admin/sync-jubelio/route.ts` | Admin endpoint to trigger sync |

**Sync Process:**
1. Authenticate with Jubelio credentials
2. Fetch all products with pagination
3. Fetch product details (weight, description)
4. Map to Supabase product schema
5. Update product and variant records

**Environment Variables:**
```env
JUBELIO_EMAIL=your-jubelio-email@example.com
JUBELIO_PASSWORD=your-jubelio-password
```

---

### 8. Xendit - Legacy Payment Gateway (Not Actively Used)

**Status:** ❌ **DEPRECATED / NOT ACTIVELY USED**

Xendit has been replaced by **Pivot Payment** as the primary payment gateway. The project no longer uses Xendit's API for payment processing.

**What remains:**
- `xendit-node` package in `package.json` (unused dependency)
- Database columns `xendit_invoice_id` and `xendit_payment_method` in `ecom_orders` table
- Environment variables (optional, can be removed)

**Migration notes:**
- The `xendit_payment_method` column is **reused** by Pivot to store the payment method (e.g., "QRIS")
- Historical orders may still have `xendit_invoice_id` populated for legacy orders
- No Xendit API calls exist in the current codebase
- No Xendit webhook handlers (`/api/webhooks/xendit` does not exist)

**To fully remove Xendit:**
1. Remove `xendit-node` from `package.json`
2. Optionally rename database columns to generic names (e.g., `payment_method`, `external_payment_id`)
3. Remove Xendit-related environment variables from `.env.example`

**Legacy Environment Variables (optional):**
```env
# These are no longer used in the application
XENDIT_SECRET_KEY=xnd_production_...
XENDIT_WEBHOOK_TOKEN=...
NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_production_...
XENDIT_MOCK=false
```

---

## Data Flow

### Complete Order Flow

```
┌─────────────┐
│   START     │
└──────┬──────┘
       ▼
┌─────────────┐     ┌─────────────────┐
│ Add to Cart │────▶│  Supabase:      │
│             │     │  cart_items     │
└──────┬──────┘     └─────────────────┘
       ▼
┌─────────────┐
│   Checkout  │
└──────┬──────┘
       │
       ├────────────────────────────────────────────────────────┐
       ▼                                                        ▼
┌─────────────────┐                                    ┌─────────────────┐
│  Google Maps    │                                    │  Supabase:      │
│  - Address      │                                    │  ecom_orders    │
│  - Geocoding    │                                    │  (pending)      │
└─────────────────┘                                    └────────┬────────┘
                                                                │
       ┌────────────────────────────────────────────────────────┘
       ▼
┌─────────────────┐
│  Pivot Payment  │◀── Creates QRIS session (15 min expiry)
│  Create Session │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Customer Pays  │── Scans QR code with banking app
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pivot Webhook  │── POST /api/webhooks/pivot
│  PAYMENT.PAID   │
└────────┬────────┘
         │
         ├─────────────────────────────────────────────────────┬─────────────────────┐
         ▼                                                     ▼                     ▼
┌─────────────────┐                                  ┌─────────────────┐   ┌─────────────────┐
│  Supabase       │                                  │  Telegram       │   │  Resend         │
│  Update Order   │                                  │  Notification   │   │  Order Email    │
│  (paid)         │                                  │  Payment Conf   │   │                 │
└────────┬────────┘                                  └─────────────────┘   └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Biteship       │── Create shipping order
│  Create Order   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Biteship       │── POST /api/webhooks/biteship
│  Webhooks       │   - order.status
│                 │   - order.waybill_id
└─────────────────┘
```

---

## Environment Variables

### Complete Environment Configuration

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_MCP_TOKEN=sbp_...

# ─── Pivot Payment (Primary) ─────────────────────────────────────────────────
PIVOT_API_URL=https://api.pivot-payment.com
PIVOT_MERCHANT_ID=your-merchant-id
PIVOT_MERCHANT_SECRET=your-merchant-secret
PIVOT_CALLBACK_API_KEY=webhook-verification-key

# ─── Biteship (Shipping) ─────────────────────────────────────────────────────
BITESHIP_API_KEY=sk_test_...
BITESHIP_WEBHOOK_SECRET=random-secret
NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS=anteraja,jne,sicepat

# ─── Google Maps ─────────────────────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ─── App Configuration ───────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://agroastery.com

# ─── Telegram Notifications ───────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=123456789:AAxxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=-1001234567890

# ─── Resend (Email) ──────────────────────────────────────────────────────────
RESEND_API_KEY=re_...

# ─── Origin / Store Info ─────────────────────────────────────────────────────
NEXT_PUBLIC_ORIGIN_POSTAL_CODE=12440
NEXT_PUBLIC_ORIGIN_NAME=Agroastery
NEXT_PUBLIC_ORIGIN_PHONE=08123456789
NEXT_PUBLIC_ORIGIN_EMAIL="AGROASTERY.ID@gmail.com"
NEXT_PUBLIC_ORIGIN_ADDRESS=Jl. Origin Address
NEXT_PUBLIC_ORIGIN_LAT="-6.263450138760574"
NEXT_PUBLIC_ORIGIN_LNG="106.81945752406575"
ORIGIN_CONTACT_NAME=Agroastery
ORIGIN_CONTACT_PHONE=08123456789
ORIGIN_ADDRESS=Jl. Origin Address
ORIGIN_POSTAL_CODE=12440
ORIGIN_LATITUDE="-6.263450138760574"
ORIGIN_LONGITUDE="106.81945752406575"

# ─── Packaging ───────────────────────────────────────────────────────────────
PACKAGING_EXTRA_GRAMS=0
PACKAGING_EXTRA_PERCENT=0

# ─── Admin ───────────────────────────────────────────────────────────────────
ADMIN_SECRET=change-me-to-a-random-secret

# ─── Jubelio (ERP) ───────────────────────────────────────────────────────────
JUBELIO_EMAIL=your-jubelio-email@example.com
JUBELIO_PASSWORD=your-jubelio-password

# ─── Legacy Xendit (Deprecated - Not Used) ───────────────────────────────────
# These variables are no longer used. Xendit has been replaced by Pivot Payment.
# Kept here only for reference for historical orders.
# XENDIT_SECRET_KEY=xnd_production_...
# XENDIT_WEBHOOK_TOKEN=...
# NEXT_PUBLIC_XENDIT_PUBLIC_KEY=xnd_public_production_...
# XENDIT_MOCK=false
```

---

## Security Considerations

### API Key Management

| Key Type | Storage | Exposure |
|----------|---------|----------|
| Server-side only | `SUPABASE_SERVICE_ROLE_KEY`, `BITESHIP_API_KEY`, `PIVOT_MERCHANT_SECRET` | Never expose to client |
| Public/Client-side | `NEXT_PUBLIC_*` variables | Visible in browser |
| Webhook secrets | `BITESHIP_WEBHOOK_SECRET`, `PIVOT_CALLBACK_API_KEY` | Server validation only |

### Webhook Security

All webhooks use signature verification:

```typescript
// Pivot webhook verification
function verifyPivotCallback(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") ?? "";
  const expected = process.env.PIVOT_CALLBACK_API_KEY ?? "";
  return timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected));
}

// Biteship webhook verification  
function verifySecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret') ?? '';
  const expected = process.env.BITESHIP_WEBHOOK_SECRET ?? '';
  return timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
}
```

### Data Protection

- **PCI Compliance:** Payment data never touches our servers (handled by Pivot)
- **RLS Policies:** Row-level security on user data (profiles, addresses, orders)
- **Token Caching:** Pivot and Jubelio tokens cached server-side with expiry
- **Idempotency:** Payment and email operations guarded against duplicate execution

---

## Troubleshooting

### Common Integration Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Payment not processing | Pivot credentials incorrect | Verify `PIVOT_MERCHANT_ID` and `PIVOT_MERCHANT_SECRET` |
| Shipping rates not loading | Biteship API key invalid | Check `BITESHIP_API_KEY` |
| Telegram not notifying | Bot token or chat ID wrong | Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` |
| Emails not sending | Resend API key missing | Add `RESEND_API_KEY` to environment |
| Address autocomplete failing | Google Maps key missing | Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Webhooks not received | URL not accessible | Ensure app is publicly accessible for webhooks |

---

*Last updated: April 2026*
