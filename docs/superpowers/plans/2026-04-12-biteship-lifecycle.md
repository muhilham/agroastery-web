# Biteship End-to-End Shipping Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Biteship shipping lifecycle — create a Biteship order after payment, receive shipping status via webhook, and expose tracking to customers.

**Architecture:** Pivot payment webhook triggers fire-and-forget Biteship order creation (`POST /v1/orders`); a new Biteship webhook handler updates `ecom_orders.status` and `tracking_number`; a new tracking endpoint calls Biteship's public tracking API using the stored waybill + courier code.

**Tech Stack:** Next.js 16.2.3 App Router, TypeScript, Supabase admin client, Biteship REST API v1, Vitest + jsdom

**Branch:** `claude/review-pr-7AjrY` — do NOT create a new branch.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/biteship/createOrder.ts` | **Create** | Fetch order from DB, build Biteship payload, call POST /v1/orders, store result |
| `app/api/webhooks/biteship/route.ts` | **Create** | Handle order.status and order.waybill_id events, update ecom_orders |
| `app/api/orders/[id]/tracking/route.ts` | **Create** | Auth check, fetch tracking from Biteship public API, return normalized history |
| `app/api/webhooks/pivot/route.ts` | **Modify** | Add fire-and-forget createBiteshipOrder call after PAYMENT.PAID |
| `lib/stores/shipping.ts` | **Modify** | Delete dead fetchShippingRates function and TShippingRate type |
| `app/api/shipping/rates/route.ts` | **Modify** | Remove silent geo-retry block |
| `lib/types/shipping.ts` | **Modify** | Add ShippingCalcItem type; add optional items[] to ShippingCalcParams |
| `lib/hooks/useShippingCalculator.ts` | **Modify** | Use items[] directly when provided; fall back to single-item scalar fields |
| `.env.example` | **Modify** | Add BITESHIP_WEBHOOK_SECRET, ORIGIN_POSTAL_CODE |
| `__tests__/biteship-create-order.spec.ts` | **Create** | Unit tests for createBiteshipOrder |
| `__tests__/biteship-webhook.spec.ts` | **Create** | Unit tests for Biteship webhook route |
| `__tests__/biteship-tracking.spec.ts` | **Create** | Unit tests for tracking endpoint |

---

## Task 1: Remove dead code and silent geo-retry

**Files:**
- Modify: `lib/stores/shipping.ts`
- Modify: `app/api/shipping/rates/route.ts`

- [ ] **Step 1: Delete fetchShippingRates, TShippingRate, and the local ShippingItem type from `lib/stores/shipping.ts`**

Delete lines 4–84 (the `TShippingRate` type, the local `ShippingItem` type, and the `fetchShippingRates` function). Keep everything from the `$shipping` map declaration onward. The file after editing begins:

```typescript
import { map, atom } from "nanostores";

// The store for shipping-related state
export const $shipping = map<{
  rates: ...
```

These three exports are dead code — `fetchShippingRates` sends an invalid payload (missing `origin_postal_code` and `couriers`) and is never called anywhere in the codebase. `TShippingRate` is only used inside `fetchShippingRates`.

- [ ] **Step 2: Remove the silent geo-retry block from `app/api/shipping/rates/route.ts`**

Delete the entire block at lines 79–108:

```typescript
  if (!res.ok && includeOriginGeo) {
    // Retry once without origin geo in case Biteship rejects these fields
    const retryRes = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      },
      body: JSON.stringify({
        origin_postal_code: Number(body.origin_postal_code),
        couriers: body.couriers,
        items: body.items,
        ...(hasGeo
          ? {
              destination_latitude: body.destination_latitude,
              destination_longitude: body.destination_longitude,
            }
          : {
              destination_postal_code: Number(body.destination_postal_code!),
            }),
      }),
    });

    if (!retryRes.ok) {
      const text = await retryRes.text();
      return NextResponse.json({ error: "Biteship error", details: text }, { status: 502 });
    }
    const retryData = await retryRes.json();
    return NextResponse.json(retryData, { headers: { "Cache-Control": "no-store" } });
  }
```

The existing `if (!res.ok)` block below it already handles failures correctly.

- [ ] **Step 3: Run existing tests to confirm nothing is broken**

```bash
npx vitest run
```

Expected: all tests pass. If any test imports `fetchShippingRates` or `TShippingRate`, update it to remove the import.

- [ ] **Step 4: Commit**

```bash
git add lib/stores/shipping.ts app/api/shipping/rates/route.ts
git commit -m "refactor: remove dead fetchShippingRates and silent geo-retry"
```

---

## Task 2: Multi-item support in useShippingCalculator

**Files:**
- Modify: `lib/types/shipping.ts`
- Modify: `lib/hooks/useShippingCalculator.ts`
- Modify: `__tests__/shipping.payload.spec.ts`

- [ ] **Step 1: Write a failing test for multi-item payload**

Add this test to `__tests__/shipping.payload.spec.ts` (after the last existing `it(...)` block, before the closing `}`):

```typescript
  it('sends items array directly when items field is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, pricing: [] }),
    });

    const { result } = renderHook(() => useShippingCalculator());

    await act(async () => {
      await result.current.calculateShipping({
        originPostalCode: '12440',
        destinationPostalCode: '12240',
        // scalar fields are present but ignored when items[] is provided
        name: 'ignored',
        price: 0,
        quantity: 1,
        weightGrams: 0,
        items: [
          { name: 'Kopi A', description: 'Arabika', value: 100000, length: 20, width: 15, height: 10, weight: 220, quantity: 1 },
          { name: 'Kopi B', description: 'Robusta', value: 80000,  length: 20, width: 15, height: 10, weight: 330, quantity: 2 },
        ],
      });
    });

    const sentBody = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string
    );
    expect(sentBody.items).toHaveLength(2);
    expect(sentBody.items[0].name).toBe('Kopi A');
    expect(sentBody.items[1].name).toBe('Kopi B');
  });
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run __tests__/shipping.payload.spec.ts
```

Expected: FAIL with TypeScript error — `items` does not exist on type `ShippingCalcParams`.

- [ ] **Step 3: Add ShippingCalcItem type and items field to `lib/types/shipping.ts`**

Add the `ShippingCalcItem` type immediately before `ShippingCalcParams`:

```typescript
export type ShippingCalcItem = {
  name: string;
  description?: string;
  value: number;
  length: number;
  width: number;
  height: number;
  weight: number; // grams
  quantity: number;
};
```

Add `items?: ShippingCalcItem[];` as the last field of `ShippingCalcParams`:

```typescript
export type ShippingCalcParams = {
  originPostalCode: string | number;
  destinationPostalCode?: string | number;
  quantity: number;
  price: number; // IDR per unit
  name: string;
  description?: string;
  length?: number;
  width?: number;
  height?: number;
  weightGrams: number; // from variant.shipWeightGrams
  couriers?: string; // comma separated
  // Optional geolocation for destination; if provided, use these over postal code
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  // Optional: when provided, sent directly instead of building from scalar fields above
  items?: ShippingCalcItem[];
};
```

- [ ] **Step 4: Update getShippingRates in `lib/hooks/useShippingCalculator.ts`**

Replace the entire `getShippingRates` function body with:

```typescript
async function getShippingRates(p: ShippingCalcParams) {
  const origin = Number(p.originPostalCode);
  const hasGeo = Number.isFinite(p.destinationLatitude ?? NaN) && Number.isFinite(p.destinationLongitude ?? NaN);
  const destination = Number(p.destinationPostalCode);
  if (!Number.isFinite(origin)) throw new Error('originPostalCode must be a number-like value');
  if (!hasGeo && !Number.isFinite(destination)) throw new Error('destinationPostalCode must be a number-like value when coordinates are not provided');

  const couriers = p.couriers ?? process.env.NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS ?? "anteraja,jne,sicepat";

  // Use provided items array; fall back to building one item from scalar fields
  const items = p.items && p.items.length > 0
    ? p.items
    : (() => {
        if (!p.weightGrams || p.weightGrams <= 0) throw new Error('weightGrams must be > 0');
        if (!p.quantity || p.quantity <= 0) throw new Error('quantity must be > 0');
        const name = ensureNonEmpty(p.name, 'name');
        return [{
          name,
          description: p.description ?? name,
          value: Math.max(0, Math.trunc(p.price)),
          length: p.length ?? 20,
          width: p.width ?? 15,
          height: p.height ?? 10,
          weight: Math.trunc(p.weightGrams),
          quantity: Math.trunc(p.quantity),
        }];
      })();

  const body: Record<string, unknown> = { origin_postal_code: origin, couriers, items };
  if (hasGeo) {
    body.destination_latitude = p.destinationLatitude;
    body.destination_longitude = p.destinationLongitude;
  } else {
    body.destination_postal_code = destination;
  }

  const res = await fetch('/api/shipping/rates', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch shipping rates' }));
    throw new Error(errorData.error || 'Failed to fetch shipping rates');
  }

  const data = await res.json();
  const parsed = BiteshipRatesResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Failed to parse Biteship response', parsed.error.format(), data);
    throw new Error('Failed to parse shipping response');
  }

  return parsed.data.pricing.map((p) => ({
    carrier: p.courier_name,
    code: `${p.courier_code}-${p.courier_service_code}`,
    service: p.courier_service_name,
    eta: p.duration ?? (p.shipment_duration_range ? `${p.shipment_duration_range} ${p.shipment_duration_unit ?? ''}`.trim() : undefined),
    price: p.price,
    raw: p,
  }));
}
```

Also add `ShippingCalcItem` to the import from `'../types/shipping'`:

```typescript
import {
  ShippingCalcParams,
  ShippingCalcItem,
  BiteshipRatesResponseSchema,
  NormalizedRate,
  VerifiedLocation
} from '../types/shipping';
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run __tests__/shipping.payload.spec.ts
```

Expected: all tests PASS including the new multi-item test.

- [ ] **Step 6: Commit**

```bash
git add lib/types/shipping.ts lib/hooks/useShippingCalculator.ts __tests__/shipping.payload.spec.ts
git commit -m "feat: add multi-item support to useShippingCalculator"
```

---

## Task 3: createBiteshipOrder

**Files:**
- Create: `lib/biteship/createOrder.ts`
- Create: `__tests__/biteship-create-order.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/biteship-create-order.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

// Helper: returns a mock Supabase client where each .from(table) call
// can be configured via the returned setup functions.
function makeSupabaseMock() {
  const fromImpl = vi.fn();
  vi.mock('@/lib/supabase/server', () => ({
    createSupabaseAdminClient: () => ({ from: fromImpl }),
  }));
  return fromImpl;
}

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Returns a resolved Supabase-style chain (thenable + chainable)
function resolvedChain(data: unknown, error: unknown = null) {
  const result = Object.assign(Promise.resolve({ data, error }), {
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue({ data, error }),
  });
  result.eq.mockReturnValue(result);
  result.select.mockReturnValue(result);
  return result;
}

describe('createBiteshipOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BITESHIP_API_KEY = 'test-key';
    process.env.ORIGIN_CONTACT_NAME = 'Agroastery';
    process.env.ORIGIN_CONTACT_PHONE = '08123456789';
    process.env.ORIGIN_ADDRESS = 'Jl. Test Origin';
    process.env.ORIGIN_POSTAL_CODE = '12440';
    process.env.ORIGIN_LATITUDE = '-6.2634';
    process.env.ORIGIN_LONGITUDE = '106.8194';
  });

  it('skips Biteship call when shipping_courier is null', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    // from('ecom_orders') → select → eq → single returns order with null courier
    const orderChain = resolvedChain({
      id: 'order-1',
      order_number: 'AGR-20260412-ABC',
      customer_name: 'Budi',
      customer_phone: '08111',
      customer_email: null,
      shipping_address: { recipient_name: 'Budi', phone: '08111', address_line: 'Jl. Test' },
      shipping_courier: null,
      shipping_service: null,
      notes: null,
    });
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(orderChain) });

    await createBiteshipOrder('order-1');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls POST /v1/orders with correct payload and stores biteship_order_id', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders' && callIndex === 0) {
        callIndex++;
        const chain = resolvedChain({
          id: 'order-1',
          order_number: 'AGR-20260412-ABC',
          customer_name: 'Budi',
          customer_phone: '08111',
          customer_email: 'budi@test.com',
          shipping_address: {
            recipient_name: 'Budi Santoso',
            phone: '08111',
            address_line: 'Jl. Merdeka 1',
            postal_code: '12240',
            latitude: null,
            longitude: null,
          },
          shipping_courier: 'jne',
          shipping_service: 'reg',
          notes: 'handle with care',
        });
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'ecom_order_items') {
        const chain = resolvedChain([
          { product_name: 'Kopi Arabika 150g', unit_price: 120000, quantity: 2, ship_weight_grams: 220 },
          { product_name: 'Kopi Robusta 250g', unit_price: 95000,  quantity: 1, ship_weight_grams: 330 },
        ]);
        return { select: vi.fn().mockReturnValue(chain) };
      }
      // ecom_orders update call
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        id: 'bs-order-xyz',
        courier: { waybill_id: 'JNE-123456' },
      }),
    });

    await createBiteshipOrder('order-1');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.biteship.com/v1/orders');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer test-key');

    const payload = JSON.parse(options.body as string);
    expect(payload.courier_company).toBe('jne');
    expect(payload.courier_type).toBe('reg');
    expect(payload.reference_id).toBe('AGR-20260412-ABC');
    expect(payload.delivery_type).toBe('now');
    expect(payload.order_note).toBe('handle with care');
    expect(payload.origin_postal_code).toBe(12440);
    expect(payload.destination_postal_code).toBe(12240);
    expect(payload.destination_contact_name).toBe('Budi Santoso');
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].category).toBe('food_and_drink');
    expect(payload.items[0].weight).toBe(220);
    expect(payload.items[1].weight).toBe(330);
  });

  it('handles reference_id-already-used (code 40002060) idempotently', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders' && callIndex === 0) {
        callIndex++;
        const chain = resolvedChain({
          id: 'order-1',
          order_number: 'AGR-20260412-ABC',
          customer_name: 'Budi', customer_phone: '08111', customer_email: null,
          shipping_address: { recipient_name: 'Budi', phone: '08111', address_line: 'Jl. X', postal_code: '12240', latitude: null, longitude: null },
          shipping_courier: 'jne', shipping_service: 'reg', notes: null,
        });
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'ecom_order_items') {
        const chain = resolvedChain([
          { product_name: 'Kopi', unit_price: 100000, quantity: 1, ship_weight_grams: 200 },
        ]);
        return { select: vi.fn().mockReturnValue(chain) };
      }
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        code: 40002060,
        details: { order_id: 'bs-existing-id', waybill_id: 'JNE-EXISTING' },
      }),
    });

    // Must not throw — this is idempotent recovery
    await expect(createBiteshipOrder('order-1')).resolves.toBeUndefined();
  });

  it('throws when Biteship returns a non-idempotent error', async () => {
    const { createBiteshipOrder } = await import('@/lib/biteship/createOrder');

    let callIndex = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'ecom_orders' && callIndex === 0) {
        callIndex++;
        const chain = resolvedChain({
          id: 'order-1', order_number: 'AGR-20260412-ABC',
          customer_name: 'Budi', customer_phone: '08111', customer_email: null,
          shipping_address: { recipient_name: 'Budi', phone: '08111', address_line: 'Jl. X', postal_code: '12240', latitude: null, longitude: null },
          shipping_courier: 'jne', shipping_service: 'reg', notes: null,
        });
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'ecom_order_items') {
        const chain = resolvedChain([{ product_name: 'Kopi', unit_price: 100000, quantity: 1, ship_weight_grams: 200 }]);
        return { select: vi.fn().mockReturnValue(chain) };
      }
      return { update: vi.fn().mockReturnValue(resolvedChain(null)) };
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, code: 40011001, error: 'Bad request' }),
    });

    await expect(createBiteshipOrder('order-1')).rejects.toThrow('[createBiteshipOrder]');
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npx vitest run __tests__/biteship-create-order.spec.ts
```

Expected: FAIL — `Cannot find module '@/lib/biteship/createOrder'`.

- [ ] **Step 3: Create `lib/biteship/createOrder.ts`**

```typescript
import { createSupabaseAdminClient } from '@/lib/supabase/server';

type BiteshipOrderResponse = {
  success: boolean;
  id?: string;
  courier?: { waybill_id?: string | null };
  code?: number;
  details?: { order_id?: string; waybill_id?: string };
};

export async function createBiteshipOrder(orderId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('ecom_orders')
    .select(
      'id, order_number, customer_name, customer_phone, customer_email, shipping_address, shipping_courier, shipping_service, notes'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`[createBiteshipOrder] Order not found: ${orderId}`);
  }

  // Skip if no courier was selected (e.g. digital-only or free-shipping orders)
  if (!order.shipping_courier || !order.shipping_service) {
    console.warn(`[createBiteshipOrder] Order ${orderId} has no courier — skipping Biteship order creation`);
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from('ecom_order_items')
    .select('product_name, unit_price, quantity, ship_weight_grams')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) {
    throw new Error(`[createBiteshipOrder] No order items found for order: ${orderId}`);
  }

  const addr = order.shipping_address as {
    recipient_name: string;
    phone: string;
    address_line: string;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  const originLat = process.env.ORIGIN_LATITUDE ? Number(process.env.ORIGIN_LATITUDE) : null;
  const originLng = process.env.ORIGIN_LONGITUDE ? Number(process.env.ORIGIN_LONGITUDE) : null;
  const originPostal =
    process.env.ORIGIN_POSTAL_CODE ?? process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE;

  const payload: Record<string, unknown> = {
    origin_contact_name: process.env.ORIGIN_CONTACT_NAME,
    origin_contact_phone: process.env.ORIGIN_CONTACT_PHONE,
    origin_address: process.env.ORIGIN_ADDRESS,
    ...(originPostal ? { origin_postal_code: Number(originPostal) } : {}),
    ...(originLat != null &&
    originLng != null &&
    Number.isFinite(originLat) &&
    Number.isFinite(originLng)
      ? { origin_coordinate: { latitude: originLat, longitude: originLng } }
      : {}),

    destination_contact_name: addr.recipient_name,
    destination_contact_phone: addr.phone,
    destination_address: addr.address_line,
    ...(addr.postal_code ? { destination_postal_code: Number(addr.postal_code) } : {}),
    ...(addr.latitude != null && addr.longitude != null
      ? { destination_coordinate: { latitude: addr.latitude, longitude: addr.longitude } }
      : {}),

    courier_company: order.shipping_courier,
    courier_type: order.shipping_service,
    delivery_type: 'now',
    ...(order.notes ? { order_note: order.notes } : {}),
    reference_id: order.order_number,

    items: items.map((item) => ({
      name: item.product_name,
      value: item.unit_price,
      quantity: item.quantity,
      weight: item.ship_weight_grams,
      category: 'food_and_drink', // Agroastery sells coffee
      height: 10,
      length: 20,
      width: 15,
    })),
  };

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error('[createBiteshipOrder] Missing BITESHIP_API_KEY env var');

  const res = await fetch('https://api.biteship.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as BiteshipOrderResponse;

  // Idempotency: if order_number was already used as reference_id (webhook retry),
  // Biteship returns code 40002060 with the existing order's details.
  if (!res.ok && data.code === 40002060 && data.details?.order_id) {
    await supabase
      .from('ecom_orders')
      .update({
        biteship_order_id: data.details.order_id,
        ...(data.details.waybill_id ? { tracking_number: data.details.waybill_id } : {}),
      })
      .eq('id', orderId);
    return;
  }

  if (!res.ok || !data.success || !data.id) {
    throw new Error(
      `[createBiteshipOrder] Biteship API error for order ${orderId}: ${JSON.stringify(data)}`
    );
  }

  await supabase
    .from('ecom_orders')
    .update({
      biteship_order_id: data.id,
      ...(data.courier?.waybill_id ? { tracking_number: data.courier.waybill_id } : {}),
    })
    .eq('id', orderId);
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run __tests__/biteship-create-order.spec.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/biteship/createOrder.ts __tests__/biteship-create-order.spec.ts
git commit -m "feat: add createBiteshipOrder — creates Biteship order after payment"
```

---

## Task 4: Wire createBiteshipOrder into Pivot webhook

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts`

- [ ] **Step 1: Add import at the top of `app/api/webhooks/pivot/route.ts`**

After the existing imports, add:

```typescript
import { createBiteshipOrder } from '@/lib/biteship/createOrder';
```

- [ ] **Step 2: Add fire-and-forget call inside the PAYMENT.PAID branch**

Find this block (around line 81):

```typescript
    if (updatedOrder) {
      sendPaymentNotification({
        orderId: updatedOrder.id as string,
        orderNumber: updatedOrder.order_number as string,
        customerName: updatedOrder.customer_name as string,
        customerPhone: updatedOrder.customer_phone as string,
        paymentMethod: "QRIS",
        total: updatedOrder.total as number,
        paidAt,
      });
    }
```

Replace it with:

```typescript
    if (updatedOrder) {
      sendPaymentNotification({
        orderId: updatedOrder.id as string,
        orderNumber: updatedOrder.order_number as string,
        customerName: updatedOrder.customer_name as string,
        customerPhone: updatedOrder.customer_phone as string,
        paymentMethod: "QRIS",
        total: updatedOrder.total as number,
        paidAt,
      });

      // Fire-and-forget: create Biteship order after payment confirmed.
      // Never awaited — Pivot expects a fast 200. Failure is logged for manual ops recovery.
      createBiteshipOrder(updatedOrder.id as string).catch((err: unknown) =>
        console.error(
          `[pivot-webhook] Biteship order creation failed for order ${updatedOrder.id}:`,
          err
        )
      );
    }
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "feat: trigger Biteship order creation after Pivot PAYMENT.PAID"
```

---

## Task 5: Biteship webhook handler

**Files:**
- Create: `app/api/webhooks/biteship/route.ts`
- Create: `__tests__/biteship-webhook.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/biteship-webhook.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
}));

// Returns a Supabase chain that is both awaitable and supports .eq/.select/.single
function makeChain(resolvedValue = { data: null, error: null }) {
  const single = vi.fn().mockResolvedValue(resolvedValue);
  const selectChain = { single };
  const select = vi.fn().mockReturnValue(selectChain);
  const eqResult = Object.assign(Promise.resolve(resolvedValue), { select, single });
  const eq = vi.fn().mockReturnValue(eqResult);
  mockUpdate.mockReturnValue({ eq });
  mockFrom.mockReturnValue({ update: mockUpdate });
  return { mockUpdate, eq };
}

function makeRequest(body: unknown, secret = 'test-secret') {
  return new NextRequest(`http://localhost/api/webhooks/biteship?secret=${secret}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/webhooks/biteship', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BITESHIP_WEBHOOK_SECRET = 'test-secret';
    makeChain();
  });

  it('returns 401 for wrong secret', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status' }, 'wrong'));
    expect(res.status).toBe(401);
  });

  it('maps "picked" status to "shipped" and calls update', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', order_id: 'bs-123', status: 'picked' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'shipped' });
  });

  it('maps "delivered" status to "delivered"', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', order_id: 'bs-123', status: 'delivered' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'delivered' });
  });

  it('maps "confirmed" status to "processing"', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', order_id: 'bs-123', status: 'confirmed' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'processing' });
  });

  it('updates tracking_number on order.waybill_id event', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.waybill_id', order_id: 'bs-123', courier_waybill_id: 'JNE-9999' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ tracking_number: 'JNE-9999' });
  });

  it('returns 200 for order.price event without calling update', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.price', order_id: 'bs-123', price: 50000 }));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 200 for missing order_id (test webhook ping)', async () => {
    const { POST } = await import('@/app/api/webhooks/biteship/route');
    const res = await POST(makeRequest({ event: 'order.status', status: 'confirmed' }));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npx vitest run __tests__/biteship-webhook.spec.ts
```

Expected: FAIL — `Cannot find module '@/app/api/webhooks/biteship/route'`.

- [ ] **Step 3: Create `app/api/webhooks/biteship/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Maps Biteship order status to ecom_orders.status
const BITESHIP_STATUS_MAP: Record<string, string> = {
  confirmed: 'processing',
  scheduled: 'processing',
  allocated: 'processing',
  picking_up: 'processing',
  on_hold: 'processing',
  picked: 'shipped',
  dropping_off: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  rejected: 'cancelled',
  courier_not_found: 'cancelled',
  disposed: 'cancelled',
  returned: 'refunded',
  return_in_transit: 'refunded',
};

function verifySecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret') ?? '';
  const expected = process.env.BITESHIP_WEBHOOK_SECRET ?? '';
  if (!secret || !expected) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event as string;
  const biteshipOrderId = body.order_id as string | undefined;

  if (!biteshipOrderId) {
    // Likely a test ping from Biteship dashboard — log and acknowledge
    console.log(`[biteship-webhook] Event "${event}" with no order_id — ignoring`);
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseAdminClient();

  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;
    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
    if (ecomStatus) {
      const { data } = await supabase
        .from('ecom_orders')
        .update({ status: ecomStatus })
        .eq('biteship_order_id', biteshipOrderId)
        .select('id')
        .single();
      if (!data) {
        console.warn(`[biteship-webhook] No order found for biteship_order_id: ${biteshipOrderId}`);
      }
    } else {
      console.log(`[biteship-webhook] Unrecognised Biteship status "${rawStatus}" — no DB update`);
    }
  } else if (event === 'order.waybill_id') {
    const waybillId = body.courier_waybill_id as string | undefined;
    if (waybillId) {
      await supabase
        .from('ecom_orders')
        .update({ tracking_number: waybillId })
        .eq('biteship_order_id', biteshipOrderId);
    }
  } else {
    // order.price or any future event — log only, no action required
    console.log(`[biteship-webhook] Unhandled event "${event}" for Biteship order ${biteshipOrderId}`);
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run __tests__/biteship-webhook.spec.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/biteship/route.ts __tests__/biteship-webhook.spec.ts
git commit -m "feat: add Biteship webhook handler for order status and waybill updates"
```

---

## Task 6: Tracking endpoint

**Files:**
- Create: `app/api/orders/[id]/tracking/route.ts`
- Create: `__tests__/biteship-tracking.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/biteship-tracking.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: mockFrom }),
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/orders/${id}/tracking`);
}

function mockOrder(overrides: Record<string, unknown> = {}) {
  const defaults = {
    id: 'order-1',
    user_id: null,
    status: 'processing',
    biteship_order_id: null,
    tracking_number: null,
    shipping_courier: 'jne',
  };
  const data = { ...defaults, ...overrides };
  const single = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
}

describe('GET /api/orders/[id]/tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BITESHIP_API_KEY = 'test-key';
  });

  it('returns 404 when order does not exist', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('bad-id'), { params: Promise.resolve({ id: 'bad-id' }) });
    expect(res.status).toBe(404);
  });

  it('returns dispatched:false when biteship_order_id is null', async () => {
    mockOrder({ biteship_order_id: null, tracking_number: null });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dispatched).toBe(false);
    expect(body.status).toBe('processing');
    expect(body.tracking).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns dispatched:false when tracking_number is null (waybill not yet assigned)', async () => {
    mockOrder({ biteship_order_id: 'bs-order-1', tracking_number: null });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(body.dispatched).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls Biteship public tracking API and returns normalized history', async () => {
    mockOrder({ biteship_order_id: 'bs-order-1', tracking_number: 'JNE-9999', status: 'shipped' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'dropping_off',
        waybill_id: 'JNE-9999',
        courier: { company: 'jne' },
        link: 'https://tracking.jne.co.id/JNE-9999',
        history: [
          { status: 'confirmed', note: 'Order confirmed', updated_at: '2026-04-12T10:00:00+07:00' },
          { status: 'picked',    note: 'Package picked up', updated_at: '2026-04-12T14:00:00+07:00' },
        ],
      }),
    });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dispatched).toBe(true);
    expect(body.waybill_id).toBe('JNE-9999');
    expect(body.courier).toBe('jne');
    expect(body.link).toBe('https://tracking.jne.co.id/JNE-9999');
    expect(body.history).toHaveLength(2);
    expect(body.history[0]).toEqual({
      status: 'confirmed',
      note: 'Order confirmed',
      updated_at: '2026-04-12T10:00:00+07:00',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.biteship.com/v1/trackings/JNE-9999/couriers/jne',
      { headers: { Authorization: 'Bearer test-key' } }
    );
  });

  it('returns dispatched:true with empty history when Biteship tracking not yet available', async () => {
    mockOrder({ biteship_order_id: 'bs-order-1', tracking_number: 'JNE-9999', status: 'processing' });

    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Not found' }) });

    const { GET } = await import('@/app/api/orders/[id]/tracking/route');
    const res = await GET(makeRequest('order-1'), { params: Promise.resolve({ id: 'order-1' }) });
    const body = await res.json();

    expect(body.dispatched).toBe(true);
    expect(body.waybill_id).toBe('JNE-9999');
    expect(body.history).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npx vitest run __tests__/biteship-tracking.spec.ts
```

Expected: FAIL — `Cannot find module '@/app/api/orders/[id]/tracking/route'`.

- [ ] **Step 3: Create `app/api/orders/[id]/tracking/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: order, error } = await admin
    .from('ecom_orders')
    .select('id, user_id, status, biteship_order_id, tracking_number, shipping_courier')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // If logged in, verify the order belongs to the current user.
  // Guests are allowed — the order UUID is cryptographically unguessable.
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && order.user_id && user.id !== order.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // Not logged in — guest access allowed
  }

  if (!order.biteship_order_id || !order.tracking_number) {
    return NextResponse.json({
      dispatched: false,
      status: order.status,
      tracking: null,
    });
  }

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const trackingRes = await fetch(
    `https://api.biteship.com/v1/trackings/${order.tracking_number}/couriers/${order.shipping_courier}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!trackingRes.ok) {
    // Waybill exists but courier hasn't published tracking events yet
    return NextResponse.json({
      dispatched: true,
      status: order.status,
      waybill_id: order.tracking_number,
      courier: order.shipping_courier,
      link: null,
      history: [],
    });
  }

  const tracking = (await trackingRes.json()) as {
    status: string;
    waybill_id: string;
    courier: { company: string };
    link: string | null;
    history: Array<{ note: string; status: string; updated_at: string }>;
  };

  return NextResponse.json({
    dispatched: true,
    status: order.status,
    waybill_id: tracking.waybill_id,
    courier: tracking.courier?.company ?? order.shipping_courier,
    link: tracking.link ?? null,
    history: (tracking.history ?? []).map((h) => ({
      status: h.status,
      note: h.note,
      updated_at: h.updated_at,
    })),
  });
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run __tests__/biteship-tracking.spec.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/orders/[id]/tracking/route.ts __tests__/biteship-tracking.spec.ts
git commit -m "feat: add GET /api/orders/[id]/tracking — live tracking from Biteship"
```

---

## Task 7: Environment variable documentation

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update the Biteship section in `.env.example`**

Replace the current Biteship block:

```
# ─── Biteship ────────────────────────────────────────────────────────────────
BITESHIP_API_KEY=sk_test_replace_me
NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS=anteraja,jne,sicepat
```

with:

```
# ─── Biteship ────────────────────────────────────────────────────────────────
BITESHIP_API_KEY=sk_test_replace_me
# Shared secret appended to webhook URL: /api/webhooks/biteship?secret=...
# Register the full URL in Biteship Dashboard → Integrations → Pengaturan → Tambah Webhook
BITESHIP_WEBHOOK_SECRET=replace-me-with-a-random-secret
NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS=anteraja,jne,sicepat
```

- [ ] **Step 2: Add ORIGIN_POSTAL_CODE to the server-side origin block**

Find:

```
# Server-side variants (used by some Biteship endpoints)
ORIGIN_CONTACT_NAME=Agroastery
ORIGIN_CONTACT_PHONE=08123456789
ORIGIN_ADDRESS=Jl. Origin Address
ORIGIN_LATITUDE="-6.263450138760574"
ORIGIN_LONGITUDE="106.81945752406575"
```

Replace with:

```
# Server-side variants (used by Biteship order creation)
ORIGIN_CONTACT_NAME=Agroastery
ORIGIN_CONTACT_PHONE=08123456789
ORIGIN_ADDRESS=Jl. Origin Address
ORIGIN_POSTAL_CODE=12440
ORIGIN_LATITUDE="-6.263450138760574"
ORIGIN_LONGITUDE="106.81945752406575"
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add BITESHIP_WEBHOOK_SECRET and ORIGIN_POSTAL_CODE to .env.example"
```

---

## Self-Review Checklist

| Spec requirement | Task(s) |
|---|---|
| createBiteshipOrder fetches order + items from DB | Task 3 |
| Payload: all origin fields from env vars | Task 3 |
| Payload: all destination fields from shipping_address JSONB | Task 3 |
| Payload: courier_company + courier_type from order columns | Task 3 |
| Payload: items with food_and_drink category | Task 3 |
| Payload: reference_id = order_number | Task 3 |
| Guard: skip if no courier | Task 3 (skip test) |
| Idempotency: handle code 40002060 | Task 3 (idempotency test) |
| Store biteship_order_id + tracking_number | Task 3 |
| Pivot webhook: fire-and-forget after PAYMENT.PAID | Task 4 |
| Biteship webhook: query-param secret auth | Task 5 |
| Biteship webhook: order.status → all status mappings | Task 5 |
| Biteship webhook: order.waybill_id → tracking_number | Task 5 |
| Biteship webhook: order.price → log only | Task 5 |
| Biteship webhook: missing order → 200, no crash | Task 5 |
| Tracking endpoint: 404 for unknown order | Task 6 |
| Tracking endpoint: dispatched:false when no biteship_order_id | Task 6 |
| Tracking endpoint: dispatched:false when no tracking_number | Task 6 |
| Tracking endpoint: calls public tracking API with waybill+courier | Task 6 |
| Tracking endpoint: graceful when tracking not yet published | Task 6 |
| Tracking endpoint: auth — logged-in user ownership check | Task 6 (mock setup) |
| Remove dead fetchShippingRates | Task 1 |
| Remove silent geo-retry | Task 1 |
| Multi-item useShippingCalculator | Task 2 |
| BITESHIP_WEBHOOK_SECRET env var documented | Task 7 |
| ORIGIN_POSTAL_CODE env var documented | Task 7 |
