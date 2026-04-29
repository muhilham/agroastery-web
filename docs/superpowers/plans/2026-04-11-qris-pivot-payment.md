# QRIS Pivot Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Xendit with Pivot's QRIS payment method — customers scan a dynamic QR code on a dedicated payment page, Pivot sends a callback when paid, and polling detects it.

**Architecture:** `app/api/checkout` creates an order + Pivot payment session and stores the QR URL in the DB. The customer is redirected to `/checkout/payment/[orderId]`, which shows the QR and polls for status. Pivot calls `/api/webhooks/pivot` on payment, which updates the order; polling detects it and redirects to success.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (admin client), Vitest, Pivot Payment API (`POST /v2/payments`, `POST /v1/access-token`)

---

## File Map

| Action | File |
|--------|------|
| Create | `lib/pivot/client.ts` |
| Create | `app/api/webhooks/pivot/route.ts` |
| Create | `app/api/orders/[orderId]/status/route.ts` |
| Create | `app/api/checkout/refresh-qr/route.ts` |
| Create | `app/(root)/checkout/payment/[orderId]/page.tsx` |
| Create | `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx` |
| Create | `app/api/dev/simulate-payment/route.ts` |
| Create | `lib/pivot/client.test.ts` |
| Modify | `app/api/checkout/route.ts` |
| Modify | `app/(root)/checkout/page.tsx` |
| Delete | `lib/xendit/client.ts` |
| Delete | `lib/xendit/webhook.ts` |
| Delete | `app/api/webhooks/xendit/route.ts` |

---

## Task 1: Database Migration

**Files:**
- No file changes — run SQL against Supabase

- [ ] **Step 1: Run migration in Supabase SQL editor**

Open Supabase Dashboard → SQL Editor and run:

```sql
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_payment_session_id TEXT;
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_qr_url TEXT;
ALTER TABLE ecom_orders ADD COLUMN IF NOT EXISTS pivot_qr_expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_ecom_orders_pivot ON ecom_orders(pivot_payment_session_id);
```

- [ ] **Step 2: Verify columns exist**

Run in SQL editor:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ecom_orders'
  AND column_name IN ('pivot_payment_session_id', 'pivot_qr_url', 'pivot_qr_expires_at');
```

Expected: 3 rows returned.

---

## Task 2: Pivot API Client

**Files:**
- Create: `lib/pivot/client.ts`
- Create: `lib/pivot/client.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/pivot/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the pure helper functions exported from the client.
// Token caching and API calls are tested via mocked fetch.

describe("formatPhoneForPivot", () => {
  // Import after vi.mock so we can set up mocks first
  let formatPhoneForPivot: (phone: string) => { countryCode: string; number: string };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./client");
    formatPhoneForPivot = mod.formatPhoneForPivot;
  });

  it("strips leading 0 from Indonesian mobile number", () => {
    expect(formatPhoneForPivot("08123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });

  it("strips +62 prefix", () => {
    expect(formatPhoneForPivot("+628123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });

  it("strips 62 prefix", () => {
    expect(formatPhoneForPivot("628123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });

  it("passes through bare number unchanged", () => {
    expect(formatPhoneForPivot("8123456789")).toEqual({
      countryCode: "+62",
      number: "8123456789",
    });
  });
});

describe("buildRequestId", () => {
  let buildRequestId: (orderId: string, suffix?: string) => string;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("./client");
    buildRequestId = mod.buildRequestId;
  });

  it("produces an alphanumeric string of 16–36 chars", () => {
    const id = buildRequestId("550e8400-e29b-41d4-a716-446655440000");
    expect(id).toMatch(/^[a-z0-9A-Z]+$/);
    expect(id.length).toBeGreaterThanOrEqual(16);
    expect(id.length).toBeLessThanOrEqual(36);
  });

  it("produces a different id when a suffix is given", () => {
    const base = buildRequestId("550e8400-e29b-41d4-a716-446655440000");
    const withSuffix = buildRequestId("550e8400-e29b-41d4-a716-446655440000", "refresh");
    expect(withSuffix).not.toBe(base);
    expect(withSuffix).toMatch(/^[a-z0-9A-Z]+$/);
    expect(withSuffix.length).toBeLessThanOrEqual(36);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm vitest run lib/pivot/client.test.ts
```

Expected: FAIL — "Cannot find module './client'"

- [ ] **Step 3: Create `lib/pivot/client.ts`**

```typescript
/** Pivot Payment API client with module-level token caching. */

const PIVOT_API_URL = process.env.PIVOT_API_URL ?? "https://api.pivot-payment.com";
const PIVOT_MERCHANT_ID = process.env.PIVOT_MERCHANT_ID ?? "";
const PIVOT_MERCHANT_SECRET = process.env.PIVOT_MERCHANT_SECRET ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";

// ─── Token cache ─────────────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getPivotToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - now > 60_000) {
    return tokenCache.token;
  }
  const res = await fetch(`${PIVOT_API_URL}/v1/access-token`, {
    method: "POST",
    headers: {
      "X-MERCHANT-ID": PIVOT_MERCHANT_ID,
      "X-MERCHANT-SECRET": PIVOT_MERCHANT_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grantType: "client_credentials" }),
  });
  if (!res.ok) {
    throw new Error(`Pivot token fetch failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.code !== "00") {
    throw new Error(`Pivot token error: ${json.message}`);
  }
  const expiresInMs = parseInt(json.data.expiresIn, 10) * 1000; // 900s → ms
  tokenCache = { token: json.data.accessToken, expiresAt: now + expiresInMs };
  return tokenCache.token;
}

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

/** Strip country prefix so Pivot's phoneNumber.number field gets bare digits. */
export function formatPhoneForPivot(phone: string): { countryCode: string; number: string } {
  let number = phone.trim();
  if (number.startsWith("+62")) number = number.slice(3);
  else if (number.startsWith("62") && number.length > 10) number = number.slice(2);
  else if (number.startsWith("0")) number = number.slice(1);
  return { countryCode: "+62", number };
}

/**
 * Build a Pivot-compatible X-REQUEST-ID: alphanumeric, 16–36 chars.
 * An optional suffix (e.g. a timestamp string) makes refresh calls unique.
 */
export function buildRequestId(orderId: string, suffix = ""): string {
  const base = orderId.replace(/-/g, ""); // 32 alphanumeric chars from UUID
  return (base + suffix).replace(/[^a-zA-Z0-9]/g, "").slice(0, 36);
}

// ─── API calls ────────────────────────────────────────────────────────────────

export interface CreateQrisSessionParams {
  orderId: string;
  orderNumber: string;
  total: number; // IDR, integer
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
}

export interface QrisSessionResult {
  paymentSessionId: string;
  qrUrl: string;
  qrExpiresAt: string; // ISO 8601
}

export async function createQrisPaymentSession(
  params: CreateQrisSessionParams,
  requestIdSuffix = ""
): Promise<QrisSessionResult> {
  const token = await getPivotToken();
  const { orderId, orderNumber, total, customerName, customerEmail, customerPhone } = params;
  const phone = formatPhoneForPivot(customerPhone);

  const expiryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min from now

  const body = {
    clientReferenceId: orderId.replace(/-/g, "").slice(0, 36),
    amount: { value: total, currency: "IDR" },
    paymentType: "SINGLE",
    paymentMethod: { type: "QR" },
    paymentMethodOptions: { qr: { expiryAt } },
    mode: "API",
    redirectUrl: {
      successReturnUrl: `${APP_URL}/checkout/success?order=${orderId}`,
      failureReturnUrl: `${APP_URL}/checkout?error=payment_failed`,
      expirationReturnUrl: `${APP_URL}/checkout/payment/${orderId}`,
    },
    customer: {
      givenName: customerName,
      ...(customerEmail ? { email: customerEmail } : {}),
      phoneNumber: phone,
    },
    autoConfirm: true,
    statementDescriptor: `Agroastery ${orderNumber}`,
  };

  const res = await fetch(`${PIVOT_API_URL}/v2/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-REQUEST-ID": buildRequestId(orderId, requestIdSuffix),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pivot create session failed ${res.status}: ${err}`);
  }
  const json = await res.json();
  if (json.code !== "00") {
    throw new Error(`Pivot session error: ${json.message}`);
  }

  const data = json.data;
  const qr = data.chargeDetails?.[0]?.qr;
  if (!qr?.qrUrl) {
    throw new Error("Pivot response missing QR URL");
  }

  return {
    paymentSessionId: data.id,
    qrUrl: qr.qrUrl,
    qrExpiresAt: qr.expiryAt,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm vitest run lib/pivot/client.test.ts
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/pivot/client.ts lib/pivot/client.test.ts
git commit -m "feat: add Pivot QRIS API client with token caching"
```

---

## Task 3: Pivot Webhook Handler

**Files:**
- Create: `app/api/webhooks/pivot/route.ts`

- [ ] **Step 1: Create the webhook route**

Create `app/api/webhooks/pivot/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPaymentNotification } from "@/lib/telegram/notify";

function verifyPivotCallback(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") ?? "";
  const expected = process.env.PIVOT_CALLBACK_API_KEY ?? "";
  if (!apiKey || !expected) return false;
  try {
    return timingSafeEqual(Buffer.from(apiKey), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyPivotCallback(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string;
  const data = body.data as Record<string, unknown>;
  const paymentSessionId = data?.id as string | undefined;

  if (!paymentSessionId) {
    return NextResponse.json({ error: "Missing payment session id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (event === "PAYMENT.PAID") {
    const chargeDetails = data.chargeDetails as Array<Record<string, unknown>> | undefined;
    const paidAt = (chargeDetails?.[0]?.paidAt as string) ?? new Date().toISOString();

    // Idempotency: skip if already paid
    const { data: existing } = await supabase
      .from("ecom_orders")
      .select("id, payment_status")
      .eq("pivot_payment_session_id", paymentSessionId)
      .single();

    if (!existing) {
      console.warn(`Pivot webhook: no order found for session ${paymentSessionId}`);
      return NextResponse.json({ received: true });
    }

    if (existing.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    const { data: updatedOrder, error } = await supabase
      .from("ecom_orders")
      .update({
        payment_status: "paid",
        status: "processing",
        paid_at: paidAt,
        xendit_payment_method: "QRIS", // reuse existing column for payment method label
      })
      .eq("pivot_payment_session_id", paymentSessionId)
      .select("id, order_number, customer_name, customer_phone, total")
      .single();

    if (error) {
      console.error("Pivot webhook: DB update error on PAID:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

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
  } else if (event === "PAYMENT.EXPIRED" || event === "PAYMENT.CANCELLED") {
    // Idempotently cancel the order (use neq to act as a lock)
    const { data: cancelledOrder, error: cancelError } = await supabase
      .from("ecom_orders")
      .update({ payment_status: "expired", status: "cancelled" })
      .eq("pivot_payment_session_id", paymentSessionId)
      .not("payment_status", "in", '("expired","paid")')
      .select("id")
      .single();

    if (cancelError?.code === "PGRST116") {
      // Already in terminal state — skip
      return NextResponse.json({ received: true });
    }
    if (cancelError) {
      console.error("Pivot webhook: DB error on EXPIRED/CANCELLED:", cancelError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // Restore stock
    if (cancelledOrder) {
      const { data: orderItems } = await supabase
        .from("ecom_order_items")
        .select("variant_id, quantity")
        .eq("order_id", cancelledOrder.id);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.variant_id) {
            await supabase.rpc("ecom_restore_stock", {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
            });
          }
        }
      }
    }
  } else {
    console.log(`Pivot webhook: unhandled event "${event}" for session ${paymentSessionId}`);
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify it builds without TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: no errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "feat: add Pivot payment callback webhook handler"
```

---

## Task 4: Order Status Polling Endpoint

**Files:**
- Create: `app/api/orders/[orderId]/status/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ecom_orders")
    .select("payment_status, status")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({
    payment_status: data.payment_status,
    status: data.status,
  });
}
```

- [ ] **Step 2: Verify it builds**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/[orderId]/status/route.ts
git commit -m "feat: add order status polling endpoint"
```

---

## Task 5: Refresh QR Endpoint

**Files:**
- Create: `app/api/checkout/refresh-qr/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrisPaymentSession } from "@/lib/pivot/client";

const RefreshSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RefreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { orderId } = parsed.data;
    const supabase = createSupabaseAdminClient();

    const { data: order, error } = await supabase
      .from("ecom_orders")
      .select(
        "id, order_number, total, payment_status, customer_name, customer_email, customer_phone"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment_status !== "pending_payment") {
      return NextResponse.json(
        { error: "Order is not awaiting payment" },
        { status: 400 }
      );
    }

    // Suffix with current timestamp to guarantee a unique X-REQUEST-ID
    const suffix = Date.now().toString(36);
    const session = await createQrisPaymentSession(
      {
        orderId: order.id as string,
        orderNumber: order.order_number as string,
        total: order.total as number,
        customerName: order.customer_name as string,
        customerEmail: order.customer_email as string | null,
        customerPhone: order.customer_phone as string,
      },
      suffix
    );

    await supabase
      .from("ecom_orders")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", orderId);

    return NextResponse.json({
      qrUrl: session.qrUrl,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (error) {
    console.error("Refresh QR error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify it builds**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/checkout/refresh-qr/route.ts
git commit -m "feat: add refresh QR endpoint for expired QRIS codes"
```

---

## Task 6: Update Checkout API Route

Replace Xendit invoice creation with Pivot QRIS session creation.

**Files:**
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Replace Xendit import with Pivot**

In `app/api/checkout/route.ts`, find and remove:

```typescript
import { createXenditInvoice } from "@/lib/xendit/client";
```

Add at the top with the other imports:

```typescript
import { createQrisPaymentSession } from "@/lib/pivot/client";
```

- [ ] **Step 2: Replace Xendit invoice creation block**

Find the block starting with `// Create Xendit invoice` through the end of the try/catch that catches xenditError (approximately lines 287–317 in the original file). Replace the entire block with:

```typescript
    // Create Pivot QRIS payment session
    let pivotSession: { paymentSessionId: string; qrUrl: string; qrExpiresAt: string };
    try {
      pivotSession = await createQrisPaymentSession({
        orderId: order.id as string,
        orderNumber,
        total,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone,
      });
    } catch (pivotError) {
      console.error("Pivot session creation error:", pivotError);
      await admin.from("ecom_order_items").delete().eq("order_id", order.id as string);
      await admin.from("ecom_orders").delete().eq("id", order.id as string);
      await restoreStock(admin, data.items);
      return NextResponse.json(
        { error: "Gagal membuat sesi pembayaran", code: "PAYMENT_ERROR" },
        { status: 500 }
      );
    }

    // Store Pivot session data on order
    await admin
      .from("ecom_orders")
      .update({
        pivot_payment_session_id: pivotSession.paymentSessionId,
        pivot_qr_url: pivotSession.qrUrl,
        pivot_qr_expires_at: pivotSession.qrExpiresAt,
      })
      .eq("id", order.id as string);
```

- [ ] **Step 3: Replace the final return statement**

Find:
```typescript
    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      invoiceUrl: xenditInvoice.invoice_url,
      invoiceId: xenditInvoice.id,
      total,
    });
```

Replace with:
```typescript
    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      total,
    });
```

- [ ] **Step 4: Also remove the `// Update order with Xendit invoice ID` block**

Find and delete:
```typescript
    // Update order with Xendit invoice ID
    await admin
      .from("ecom_orders")
      .update({ xendit_invoice_id: xenditInvoice.id })
      .eq("id", order.id as string);
```

(This block is now replaced by the `pivot_payment_session_id` update above.)

- [ ] **Step 5: Verify it builds**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "feat: replace Xendit invoice with Pivot QRIS session in checkout"
```

---

## Task 7: QR Payment Page

**Files:**
- Create: `app/(root)/checkout/payment/[orderId]/page.tsx`
- Create: `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`

- [ ] **Step 1: Create the server component (page.tsx)**

Create `app/(root)/checkout/payment/[orderId]/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import QrPaymentClient from "./qr-payment-client";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: order } = await supabase
    .from("ecom_orders")
    .select("id, order_number, total, payment_status, pivot_qr_url, pivot_qr_expires_at")
    .eq("id", orderId)
    .single();

  if (!order) redirect("/checkout");

  const orderAny = order as typeof order & {
    pivot_qr_url: string | null;
    pivot_qr_expires_at: string | null;
  };

  // Already paid → success page
  if (orderAny.payment_status === "paid") {
    redirect(`/checkout/success?order=${orderId}`);
  }

  // Cancelled — back to checkout
  if (orderAny.payment_status === "expired" || orderAny.status === "cancelled") {
    redirect("/checkout?error=order_cancelled");
  }

  return (
    <QrPaymentClient
      orderId={orderId}
      orderNumber={orderAny.order_number as string}
      total={orderAny.total as number}
      qrUrl={orderAny.pivot_qr_url ?? ""}
      qrExpiresAt={orderAny.pivot_qr_expires_at ?? ""}
    />
  );
}
```

- [ ] **Step 2: Create the client component (qr-payment-client.tsx)**

Create `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`:

```typescript
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";
import { useCart } from "@/lib/hooks/useCart";
import { RefreshCw, Loader2 } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
  total: number;
  qrUrl: string;
  qrExpiresAt: string; // ISO 8601
}

function useCountdown(expiresAtIso: string) {
  const getSecondsLeft = () =>
    Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000));

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);

  useEffect(() => {
    const id = setInterval(() => {
      const s = getSecondsLeft();
      setSecondsLeft(s);
      if (s === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAtIso]);

  return secondsLeft;
}

export default function QrPaymentClient({
  orderId,
  orderNumber,
  total,
  qrUrl: initialQrUrl,
  qrExpiresAt: initialQrExpiresAt,
}: Props) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [qrUrl, setQrUrl] = useState(initialQrUrl);
  const [qrExpiresAt, setQrExpiresAt] = useState(initialQrExpiresAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const secondsLeft = useCountdown(qrExpiresAt);
  const isExpired = secondsLeft === 0;

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Poll order status every 3 seconds
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const { payment_status } = await res.json();
        if (payment_status === "paid") {
          clearInterval(pollingRef.current!);
          clearCart();
          router.push(`/checkout/success?order=${orderId}`);
        } else if (payment_status === "expired" || payment_status === "cancelled") {
          clearInterval(pollingRef.current!);
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, clearCart, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/checkout/refresh-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefreshError(data.error ?? "Gagal memperbarui QR");
        return;
      }
      setQrUrl(data.qrUrl);
      setQrExpiresAt(data.qrExpiresAt);
    } catch {
      setRefreshError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsRefreshing(false);
    }
  }, [orderId]);

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-primary mb-1">Scan QR untuk Membayar</h1>
            <p className="text-secondary text-sm">
              Pesanan #{orderNumber} &middot; {numberToIdr(total)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            {qrUrl ? (
              <div className="relative w-56 h-56">
                <Image
                  src={qrUrl}
                  alt="QRIS payment code"
                  fill
                  className={`object-contain ${isExpired ? "opacity-30" : ""}`}
                  unoptimized // external URL from Pivot
                />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">QR Kedaluwarsa</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
              </div>
            )}

            {!isExpired && (
              <p className="text-sm text-secondary">
                Berlaku {formatCountdown(secondsLeft)}
              </p>
            )}

            {(isExpired || secondsLeft < 30) && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="w-full"
              >
                {isRefreshing ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isRefreshing ? "Memperbarui..." : "Perbarui QR"}
              </Button>
            )}

            {refreshError && (
              <p className="text-destructive text-sm text-center">{refreshError}</p>
            )}

            <p className="text-xs text-secondary text-center">
              Gunakan aplikasi perbankan atau dompet digital yang mendukung QRIS
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-secondary mb-3">
              Menunggu konfirmasi pembayaran...
            </p>
            <Link href="/checkout" className="text-sm text-secondary underline-offset-4 hover:underline">
              Batalkan dan kembali ke checkout
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify it builds**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/checkout/payment/[orderId]/page.tsx" "app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx"
git commit -m "feat: add QR payment page with countdown and auto-refresh"
```

---

## Task 8: Update Checkout Page Frontend

Remove the Xendit script tag and update `onSubmit` to redirect to the payment page instead of opening the Xendit popup.

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

- [ ] **Step 1: Remove the Xendit global type declaration and Script import**

Remove the `Script` import from `next/script` at the top of the file (it is only used for the Xendit JS tag).

Then find and delete the entire block:


```typescript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Xendit?: any;
  }
}
```

- [ ] **Step 2: Remove the Xendit Script tag**

Search for `<Script` in `app/(root)/checkout/page.tsx`. Remove any `<Script>` element that loads the Xendit JS SDK (it references `js.xendit.co` or similar). Also remove the `Script` import from `next/script` if it's only used for Xendit.

- [ ] **Step 3: Replace the Xendit popup block in `onSubmit`**

Find (approximately lines 279–305 of the original):

```typescript
      // Open Xendit popup
      const { invoiceUrl, orderId } = data;

      if (window.Xendit) {
        window.Xendit.popup.open(invoiceUrl, {
          onSuccess: () => {
            clearCart();
            router.push(`/checkout/success?order=${orderId}`);
          },
          onPending: () => {
            clearCart();
            router.push(`/checkout/success?order=${orderId}&status=pending`);
          },
          onFailure: () => {
            setSubmitError("Pembayaran gagal. Silakan coba lagi.");
            setIsSubmitting(false);
          },
          onClose: () => {
            setSubmitError("Pembayaran dibatalkan.");
            setIsSubmitting(false);
          },
        });
      } else {
        // Fallback: redirect to invoice URL directly (user must complete payment there)
        clearCart();
        window.location.href = invoiceUrl;
      }
```

Replace with:

```typescript
      // Redirect to QR payment page
      const { orderId } = data;
      router.push(`/checkout/payment/${orderId}`);
```

- [ ] **Step 4: Verify it builds**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/checkout/page.tsx"
git commit -m "feat: redirect to QR payment page after checkout (remove Xendit popup)"
```

---

## Task 9: Dev Simulate Payment Route

A dev-only endpoint that marks an order as paid without Pivot calling back. Guarded by `NODE_ENV !== 'production'`.

**Files:**
- Create: `app/api/dev/simulate-payment/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const SimulateSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = SimulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { orderId } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("ecom_orders")
    .update({
      payment_status: "paid",
      status: "processing",
      paid_at: new Date().toISOString(),
      xendit_payment_method: "QRIS_DEV_SIMULATE",
    })
    .eq("id", orderId)
    .eq("payment_status", "pending_payment");

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ simulated: true });
}
```

- [ ] **Step 2: Verify it builds**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/dev/simulate-payment/route.ts
git commit -m "feat: add dev-only simulate payment endpoint for local testing"
```

---

## Task 10: Delete Xendit Files

- [ ] **Step 1: Delete Xendit library files**

```bash
rm lib/xendit/client.ts lib/xendit/webhook.ts
rmdir lib/xendit
```

- [ ] **Step 2: Delete Xendit webhook route**

```bash
rm app/api/webhooks/xendit/route.ts
rmdir app/api/webhooks/xendit
```

- [ ] **Step 3: Verify nothing imports Xendit anymore**

```bash
grep -r "xendit" --include="*.ts" --include="*.tsx" . \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  -l
```

Expected: no files listed (grep finds nothing).

- [ ] **Step 4: Verify TypeScript still compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete Xendit integration (replaced by Pivot QRIS)"
```

---

## Task 11: End-to-End Manual Test

- [ ] **Step 1: Add env vars to `.env.local`**

```env
PIVOT_MERCHANT_ID=your_sandbox_merchant_id
PIVOT_MERCHANT_SECRET=your_sandbox_merchant_secret
PIVOT_CALLBACK_API_KEY=your_sandbox_callback_api_key
PIVOT_API_URL=https://api-stg.pivot-payment.com
```

- [ ] **Step 2: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 3: Complete a checkout flow**

1. Add a product to cart → go to `/checkout`
2. Fill in customer details and shipping → submit
3. Verify redirect lands on `/checkout/payment/[orderId]`
4. Verify QR code image loads and countdown timer is running

- [ ] **Step 4: Simulate payment via dev endpoint**

In a new terminal, with the order ID from the URL:

```bash
curl -X POST http://localhost:3000/api/dev/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<your-order-id-here>"}'
```

Expected response: `{"simulated":true}`

- [ ] **Step 5: Verify polling redirects to success**

Within 3 seconds the payment page should automatically redirect to `/checkout/success?order=[orderId]`.

- [ ] **Step 6: Test QR refresh**

Start a new order. While on the payment page, open browser console and run:

```javascript
// Manually expire the QR to test refresh
// (or just wait for the countdown to reach <30s)
document.querySelector('[data-refresh]')?.click()
```

Or wait for 14.5 minutes in sandbox, then click "Perbarui QR". Verify a new QR image loads and the countdown resets.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: verify Pivot QRIS integration end-to-end"
```

---

## Notes

- **`PAYMENT.EXPIRED` / `PAYMENT.CANCELLED` event names:** Verify exact event names against the Pivot sandbox dashboard's Callback History after triggering an expired QR. Adjust the event strings in `app/api/webhooks/pivot/route.ts` if they differ.
- **Supabase types:** The new columns (`pivot_payment_session_id`, `pivot_qr_url`, `pivot_qr_expires_at`) are not in the auto-generated types. Regenerate with `supabase gen types typescript --project-id <id> > lib/supabase/types.ts` after the migration.
- **Pivot Dashboard:** Before going live, register `https://agroastery.com/api/webhooks/pivot` as the Payment callback URL in **Dashboard → Setting → Developer Settings → Callbacks**. The Callback API Key shown there is your `PIVOT_CALLBACK_API_KEY`.
