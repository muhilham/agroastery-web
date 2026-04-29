# Guest Order Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End-to-end post-purchase experience for guests — required email at checkout, public tracking page with live Biteship timeline, order confirmation email via Resend, and auto-linking of guest orders on first Google login.

**Architecture:** Checkout captures guest email (required). After payment confirmed via Pivot webhook, `sendOrderEmail` fires and-forget via Resend. The tracking page at `/track/[orderId]` is a public server component; a `<TrackingTimeline>` client child fetches the existing `/api/orders/[orderId]/tracking` route for live Biteship events. The success page is refactored to a server component to show order number + tracking CTA. The auth callback links all guest orders by email on first login.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (admin client), Resend SDK, `@react-email/components`, React Hook Form + Zod, Vitest + Testing Library.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `app/(root)/checkout/checkoutSchemas.ts` | Zod schemas (guest vs logged-in) — testable in isolation |
| Create | `lib/resend/templates/OrderConfirmation.tsx` | React Email template component |
| Create | `lib/resend/sendOrderEmail.ts` | Fetch order + send via Resend |
| Create | `lib/resend/__tests__/sendOrderEmail.test.ts` | Unit tests for sendOrderEmail |
| Create | `app/(root)/track/[orderId]/page.tsx` | Public tracking page (server component) |
| Create | `app/(root)/track/[orderId]/TrackingTimeline.tsx` | Client component — live Biteship events |
| Create | `app/(root)/track/[orderId]/__tests__/TrackingTimeline.test.tsx` | Unit tests for TrackingTimeline |
| Modify | `app/(root)/checkout/page.tsx` | Import new schemas; show email field for guests only |
| Modify | `app/(root)/checkout/success/page.tsx` | Refactor to server component; add order chip + Track CTA |
| Modify | `app/api/webhooks/pivot/route.ts` | Fire `sendOrderEmail` after PAYMENT.PAID |
| Modify | `app/api/auth/callback/route.ts` | Link guest orders by email on login |

---

## Task 1: Install dependencies

**Files:** `package.json`

- [ ] **Step 1: Install resend and react-email**

```bash
pnpm add resend @react-email/components
```

Expected output: packages added, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify packages resolve**

```bash
node -e "require('resend'); require('@react-email/components'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add resend and @react-email/components"
```

---

## Task 2: Checkout schemas (extracted + conditional)

**Files:**
- Create: `app/(root)/checkout/checkoutSchemas.ts`
- Create: `app/(root)/checkout/__tests__/checkoutSchemas.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// app/(root)/checkout/__tests__/checkoutSchemas.test.ts
import { describe, it, expect } from "vitest";
import { guestFormSchema, loggedInFormSchema } from "../checkoutSchemas";

const validBase = {
  fullName: "Budi Santoso",
  phone: "081234567890",
  address: "Jl. Kemang Barat No. 7, Jakarta Selatan",
  postalCode: "12730",
};

describe("guestFormSchema", () => {
  it("fails when email is missing", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "" });
    expect(result.success).toBe(false);
  });

  it("fails when email is invalid", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("passes when email is a valid address", () => {
    const result = guestFormSchema.safeParse({ ...validBase, email: "budi@gmail.com" });
    expect(result.success).toBe(true);
  });
});

describe("loggedInFormSchema", () => {
  it("passes when email is omitted", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase });
    expect(result.success).toBe(true);
  });

  it("passes when email is empty string", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase, email: "" });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm vitest run app/\(root\)/checkout/__tests__/checkoutSchemas.test.ts
```

Expected: `Cannot find module '../checkoutSchemas'`

- [ ] **Step 3: Create the schemas file**

```ts
// app/(root)/checkout/checkoutSchemas.ts
import { z } from "zod";

const baseSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().min(10, "Alamat terlalu singkat").max(300),
  postalCode: z.string().min(5, "Kode pos tidak valid").max(5),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
});

export const guestFormSchema = baseSchema.extend({
  email: z.string().email("Email tidak valid").min(1, "Email wajib diisi"),
});

export const loggedInFormSchema = baseSchema.extend({
  email: z.string().email().optional().or(z.literal("")),
});

// TForm is derived from the permissive schema so it works for both guest and
// logged-in users (email?: string | undefined). The guest resolver enforces
// email is required at runtime via Zod — not via the TypeScript type.
export type TForm = z.infer<typeof loggedInFormSchema>;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm vitest run app/\(root\)/checkout/__tests__/checkoutSchemas.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/\(root\)/checkout/checkoutSchemas.ts app/\(root\)/checkout/__tests__/checkoutSchemas.test.ts
git commit -m "feat: add conditional checkout form schemas for guest vs logged-in"
```

---

## Task 3: Checkout page — conditional email field

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

- [ ] **Step 1: Replace the inline schema and type with imports**

At the top of `app/(root)/checkout/page.tsx`, remove the existing `formSchema` const and `type TForm` declaration (lines 57–67), and add:

```ts
import { guestFormSchema, loggedInFormSchema, type TForm } from "./checkoutSchemas";
```

- [ ] **Step 2: Make the resolver conditional on auth state**

In `CheckoutPage`, `user` and `authLoading` are already available from `useAuth()`. After those are destructured, replace the static `useForm` resolver with a dynamic one:

```ts
// Replace the existing useForm call (currently uses the deleted formSchema)
const isGuest = !user && !authLoading;
const form = useForm<TForm>({
  resolver: zodResolver(isGuest ? guestFormSchema : loggedInFormSchema),
  defaultValues: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    lat: undefined,
    lng: undefined,
    notes: "",
  },
  mode: "onChange",
});
```

- [ ] **Step 3: Update the email FormField — show only for guests, with helper text**

Find the existing email `FormField` block (currently renders for all users). Replace it so it only renders when `isGuest` is true, and remove the `(Opsional)` label:

```tsx
{isGuest && (
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="budi@gmail.com" type="email" {...field} />
        </FormControl>
        <p className="text-xs text-secondary mt-1">
          We&apos;ll send your order confirmation here
        </p>
        <FormMessage />
      </FormItem>
    )}
  />
)}
```

- [ ] **Step 4: Verify the app builds without TypeScript errors**

```bash
pnpm build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing errors, none new).

- [ ] **Step 5: Commit**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): require email for guests, hide for logged-in users"
```

---

## Task 4: React Email template

**Files:**
- Create: `lib/resend/templates/OrderConfirmation.tsx`

No unit test for the template itself — it's a pure presentational component. Visual output was validated in brainstorming mockup.

- [ ] **Step 1: Create the template**

```tsx
// lib/resend/templates/OrderConfirmation.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderItem {
  product_name: string;
  variant_description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ShippingAddress {
  recipient_name: string;
  phone: string;
  address_line: string;
  postal_code?: string | null;
}

export interface OrderConfirmationProps {
  orderNumber: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  shippingCourier?: string | null;
  shippingService?: string | null;
  shippingEtd?: string | null;
  total: number;
  shippingAddress: ShippingAddress;
  trackingUrl: string;
}

function formatIdr(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const str = rounded.toString();
  const parts: string[] = [];
  for (let i = str.length; i > 0; i -= 3) {
    parts.unshift(str.slice(Math.max(0, i - 3), i));
  }
  return `Rp ${parts.join(",")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrderConfirmation({
  orderNumber,
  orderId,
  createdAt,
  items,
  subtotal,
  shippingCost,
  shippingCourier,
  shippingService,
  shippingEtd,
  total,
  shippingAddress,
  trackingUrl,
}: OrderConfirmationProps) {
  const courierLabel =
    shippingCourier && shippingService
      ? `${shippingCourier.toUpperCase()} ${shippingService}`
      : shippingCourier?.toUpperCase() ?? "Courier";

  return (
    <Html>
      <Head />
      <Preview>Order {orderNumber} confirmed — Agroastery</Preview>
      <Body style={{ backgroundColor: "#f4f4f0", margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "520px", margin: "0 auto", borderRadius: "16px", overflow: "hidden" }}>

          {/* Dark hero */}
          <Section style={{ backgroundColor: "#141414", padding: "32px 32px 28px", textAlign: "center" }}>
            <Text style={{ color: "rgba(204,196,169,0.5)", fontSize: "11px", fontWeight: "800", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>
              Agroastery
            </Text>
            <Text style={{ color: "#CCC4A9", fontSize: "22px", fontWeight: "700", margin: "0 0 6px" }}>
              Order Confirmed!
            </Text>
            <Text style={{ color: "rgba(204,196,169,0.45)", fontSize: "13px", margin: 0 }}>
              Thank you for your order. Here&apos;s your order summary.
            </Text>
          </Section>

          {/* Light body */}
          <Section style={{ backgroundColor: "#fafaf8", padding: "24px 28px" }}>

            {/* Order number chip */}
            <Section style={{ backgroundColor: "#f0ede6", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px" }}>
              <table width="100%" style={{ borderCollapse: "collapse" }}>
                <tr>
                  <td>
                    <Text style={{ color: "#999", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>Order Number</Text>
                    <Text style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: "700", fontFamily: "monospace", letterSpacing: "0.05em", margin: "2px 0 0" }}>{orderNumber}</Text>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    <Text style={{ color: "#999", fontSize: "11px", margin: 0 }}>{formatDate(createdAt)}</Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Items */}
            <Text style={{ color: "#999", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Items Ordered
            </Text>
            {items.map((item, i) => (
              <table key={i} width="100%" style={{ borderCollapse: "collapse", borderBottom: i < items.length - 1 ? "1px solid #ede9e0" : "none", paddingBottom: "8px", marginBottom: "8px" }}>
                <tr>
                  <td>
                    <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: 0 }}>{item.product_name}</Text>
                    <Text style={{ color: "#999", fontSize: "11px", margin: "2px 0 0" }}>{item.variant_description} × {item.quantity}</Text>
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: 0 }}>{formatIdr(item.subtotal)}</Text>
                  </td>
                </tr>
              </table>
            ))}

            {/* Totals */}
            <Hr style={{ borderColor: "#ede9e0", margin: "12px 0 8px" }} />
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tr>
                <td><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>Subtotal</Text></td>
                <td style={{ textAlign: "right" }}><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>{formatIdr(subtotal)}</Text></td>
              </tr>
              <tr>
                <td><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>Shipping ({courierLabel})</Text></td>
                <td style={{ textAlign: "right" }}><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>{formatIdr(shippingCost)}</Text></td>
              </tr>
            </table>
            <Hr style={{ borderColor: "#1a1a1a", margin: "8px 0" }} />
            <table width="100%" style={{ borderCollapse: "collapse" }}>
              <tr>
                <td><Text style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: "700", margin: 0 }}>Total</Text></td>
                <td style={{ textAlign: "right" }}><Text style={{ color: "#1a1a1a", fontSize: "14px", fontWeight: "700", margin: 0 }}>{formatIdr(total)}</Text></td>
              </tr>
            </table>

            {/* Shipping address */}
            <Section style={{ backgroundColor: "#f0ede6", borderRadius: "8px", padding: "12px 14px", margin: "20px 0" }}>
              <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: "0 0 4px" }}>Shipping to</Text>
              <Text style={{ color: "#666", fontSize: "12px", lineHeight: "1.7", margin: 0 }}>
                {shippingAddress.recipient_name} · {shippingAddress.phone}
                <br />
                {shippingAddress.address_line}
                {shippingAddress.postal_code ? ` ${shippingAddress.postal_code}` : ""}
                {shippingEtd ? <><br />Estimated arrival: {shippingEtd}</> : null}
              </Text>
            </Section>

            {/* CTA */}
            <Button
              href={trackingUrl}
              style={{
                backgroundColor: "#1a1a1a",
                color: "#CCC4A9",
                borderRadius: "10px",
                padding: "14px 24px",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "block",
                textAlign: "center",
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "8px",
              }}
            >
              Track My Order →
            </Button>
            <Text style={{ color: "#aaa", fontSize: "11px", textAlign: "center", margin: "4px 0 0" }}>
              Or copy: {trackingUrl}
            </Text>

          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: "#f0ede6", padding: "16px 28px", textAlign: "center" }}>
            <Text style={{ color: "#aaa", fontSize: "11px", lineHeight: "1.6", margin: 0 }}>
              Questions? Reach us on Instagram <strong style={{ color: "#666" }}>@agroastery</strong>
              <br />
              Agroastery · Jakarta, Indonesia
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
pnpm tsc --noEmit 2>&1 | grep "OrderConfirmation"
```

Expected: no errors for this file.

- [ ] **Step 3: Commit**

```bash
git add lib/resend/templates/OrderConfirmation.tsx
git commit -m "feat: add OrderConfirmation React Email template"
```

---

## Task 5: `sendOrderEmail` function + tests

**Files:**
- Create: `lib/resend/sendOrderEmail.ts`
- Create: `lib/resend/__tests__/sendOrderEmail.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/resend/__tests__/sendOrderEmail.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEmailSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

const mockSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

const baseOrder = {
  id: "order-uuid",
  order_number: "AGR-20260415-X7K2M",
  customer_email: "budi@gmail.com",
  customer_name: "Budi Santoso",
  customer_phone: "081234567890",
  created_at: "2026-04-15T14:32:00Z",
  shipping_address: {
    recipient_name: "Budi Santoso",
    phone: "081234567890",
    address_line: "Jl. Kemang Barat No. 7",
    postal_code: "12730",
  },
  shipping_courier: "jne",
  shipping_service: "REG",
  shipping_etd: "2-3 hari",
  shipping_cost: 30000,
  subtotal: 215000,
  total: 245000,
  ecom_order_items: [
    {
      product_name: "Agroastery Single Origin",
      variant_description: "250g, Medium Roast",
      quantity: 1,
      unit_price: 85000,
      subtotal: 85000,
    },
  ],
};

describe("sendOrderEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://agroastery.com");
    mockEmailSend.mockResolvedValue({ data: { id: "email-id" }, error: null });
  });

  it("returns early without calling Resend when customer_email is null", async () => {
    mockSingle.mockResolvedValue({
      data: { ...baseOrder, customer_email: null },
      error: null,
    });
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await sendOrderEmail("order-uuid");
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("calls Resend with correct from address and subject", async () => {
    mockSingle.mockResolvedValue({ data: baseOrder, error: null });
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await sendOrderEmail("order-uuid");
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Agroastery <order@agroastery.com>",
        to: "budi@gmail.com",
        subject: "Order AGR-20260415-X7K2M confirmed — Agroastery",
      })
    );
  });

  it("does not throw when Resend.send rejects", async () => {
    mockSingle.mockResolvedValue({ data: baseOrder, error: null });
    mockEmailSend.mockRejectedValue(new Error("Resend unavailable"));
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await expect(sendOrderEmail("order-uuid")).resolves.toBeUndefined();
  });

  it("does not throw when order is not found in DB", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await expect(sendOrderEmail("bad-uuid")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm vitest run lib/resend/__tests__/sendOrderEmail.test.ts
```

Expected: `Cannot find module '../sendOrderEmail'`

- [ ] **Step 3: Implement `sendOrderEmail`**

```ts
// lib/resend/sendOrderEmail.ts
import { Resend } from "resend";
import * as React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { OrderConfirmation } from "./templates/OrderConfirmation";

export async function sendOrderEmail(orderId: string): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from("ecom_orders")
      .select("*, ecom_order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error(`[sendOrderEmail] Order not found: ${orderId}`, error);
      return;
    }

    if (!order.customer_email) {
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    const trackingUrl = `${appUrl}/track/${orderId}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: "Agroastery <order@agroastery.com>",
      to: order.customer_email as string,
      subject: `Order ${order.order_number} confirmed — Agroastery`,
      react: React.createElement(OrderConfirmation, {
        orderNumber: order.order_number as string,
        orderId: order.id as string,
        createdAt: order.created_at as string,
        customerName: order.customer_name as string,
        items: (order.ecom_order_items as Array<{
          product_name: string;
          variant_description: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        }>),
        subtotal: order.subtotal as number,
        shippingCost: order.shipping_cost as number,
        shippingCourier: order.shipping_courier as string | null,
        shippingService: order.shipping_service as string | null,
        shippingEtd: order.shipping_etd as string | null,
        total: order.total as number,
        shippingAddress: order.shipping_address as {
          recipient_name: string;
          phone: string;
          address_line: string;
          postal_code?: string | null;
        },
        trackingUrl,
      }),
    });

    if (sendError) {
      console.error(`[sendOrderEmail] Resend error for order ${orderId}:`, sendError);
    }
  } catch (err) {
    console.error(`[sendOrderEmail] Unexpected error for order ${orderId}:`, err);
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm vitest run lib/resend/__tests__/sendOrderEmail.test.ts
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/resend/sendOrderEmail.ts lib/resend/__tests__/sendOrderEmail.test.ts
git commit -m "feat: add sendOrderEmail via Resend with React Email template"
```

---

## Task 6: Trigger email from pivot webhook

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts`

- [ ] **Step 1: Add the import at the top of the file**

After the existing imports in `app/api/webhooks/pivot/route.ts`, add:

```ts
import { sendOrderEmail } from "@/lib/resend/sendOrderEmail";
```

- [ ] **Step 2: Fire email after PAYMENT.PAID — after the existing `sendPaymentNotification` call**

Find the block after `sendPaymentNotification({...})` (around line 83–105). Add the email call as the last fire-and-forget in the `if (updatedOrder)` block, right before the closing `}` of that block:

```ts
// After the existing sendPaymentNotification(...).catch(...) call:
sendOrderEmail(updatedOrder.id as string).catch((err: unknown) =>
  console.error(
    `[pivot-webhook] Order email failed for order ${updatedOrder.id}:`,
    err
  )
);
```

The full `if (updatedOrder)` block should look like:

```ts
if (updatedOrder) {
  sendPaymentNotification({
    orderId: updatedOrder.id as string,
    orderNumber: updatedOrder.order_number as string,
    customerName: updatedOrder.customer_name as string,
    customerPhone: updatedOrder.customer_phone as string,
    paymentMethod: "QRIS",
    total: updatedOrder.total as number,
    paidAt,
  }).catch((err: unknown) =>
    console.error(
      `[pivot-webhook] Payment notification failed for order ${updatedOrder.id}:`,
      err
    )
  );

  createBiteshipOrder(updatedOrder.id as string).catch((err: unknown) =>
    console.error(
      `[pivot-webhook] Biteship order creation failed for order ${updatedOrder.id}:`,
      err
    )
  );

  sendOrderEmail(updatedOrder.id as string).catch((err: unknown) =>
    console.error(
      `[pivot-webhook] Order email failed for order ${updatedOrder.id}:`,
      err
    )
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm tsc --noEmit 2>&1 | grep "pivot"
```

Expected: no type errors for pivot/route.ts.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "feat: trigger order confirmation email on PAYMENT.PAID webhook"
```

---

## Task 7: Tracking page — server component

**Files:**
- Create: `app/(root)/track/[orderId]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/(root)/track/[orderId]/page.tsx
import { notFound } from "next/navigation";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { numberToIdr } from "@/lib/numberToIdr";
import { TrackingTimeline } from "./TrackingTimeline";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  processing: "Sedang Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  shipped: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  delivered: "text-green-500 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  refunded: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

type PageProps = { params: Promise<{ orderId: string }> };

export default async function TrackingPage({ params }: PageProps) {
  const { orderId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: order } = await admin
    .from("ecom_orders")
    .select("*, ecom_order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const statusLabel = STATUS_LABELS[order.status as string] ?? order.status;
  const statusColor =
    STATUS_COLORS[order.status as string] ?? "text-white/60 bg-white/5 border-white/10";
  const shippingAddress = order.shipping_address as Record<string, string> | null;
  const items = (order.ecom_order_items as Array<{
    id: string;
    product_name: string;
    variant_description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>) ?? [];

  const orderDate = new Date(order.created_at as string).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 tablet:px-10 desktop:px-20 flex-1">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-primary tracking-wide truncate">
              {order.order_number as string}
            </h1>
            <p className="text-secondary text-sm mt-0.5">{orderDate}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 whitespace-nowrap ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Shipping + live Biteship timeline */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
            Info Pengiriman
          </h2>
          {shippingAddress && (
            <div className="space-y-1.5 mb-4">
              {order.shipping_courier && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Kurir</span>
                  <span className="text-primary font-medium">
                    {(order.shipping_courier as string).toUpperCase()}{" "}
                    {order.shipping_service as string}
                  </span>
                </div>
              )}
              {order.shipping_etd && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Estimasi tiba</span>
                  <span className="text-primary">{order.shipping_etd as string}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Tujuan</span>
                <span className="text-primary text-right max-w-[200px] leading-snug">
                  {shippingAddress.address_line}
                  {shippingAddress.postal_code ? ` ${shippingAddress.postal_code}` : ""}
                </span>
              </div>
            </div>
          )}
          <TrackingTimeline orderId={orderId} />
        </div>

        {/* Items */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
            Produk
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-sm font-medium line-clamp-1">
                    {item.product_name}
                  </p>
                  <p className="text-secondary text-xs">
                    {item.variant_description} × {item.quantity}
                  </p>
                </div>
                <span className="text-primary text-sm font-semibold shrink-0">
                  {numberToIdr({ nominal: item.subtotal })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 mt-3 border-t border-white/10">
            <span className="text-secondary text-sm">Total</span>
            <span className="text-primary text-sm font-bold">
              {numberToIdr({ nominal: order.total as number })}
            </span>
          </div>
        </div>

        {/* Account conversion — only shown for unlinked guest orders */}
        {!order.user_id && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-center">
            <p className="text-primary text-sm font-semibold mb-1">
              Simpan pesanan ke akun
            </p>
            <p className="text-secondary text-xs mb-4 leading-relaxed">
              Masuk untuk melihat semua riwayat pesanan kamu di satu tempat
            </p>
            <Link
              href={`/login?next=/track/${orderId}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-primary text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Lanjut dengan Google
            </Link>
            <p className="text-secondary/40 text-xs mt-3 underline cursor-pointer">
              Lewati
            </p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
pnpm tsc --noEmit 2>&1 | grep "track"
```

Expected: no errors for the tracking page file.

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/track/[orderId]/page.tsx"
git commit -m "feat: add public tracking page at /track/[orderId]"
```

---

## Task 8: TrackingTimeline client component + tests

**Files:**
- Create: `app/(root)/track/[orderId]/TrackingTimeline.tsx`
- Create: `app/(root)/track/[orderId]/__tests__/TrackingTimeline.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// app/(root)/track/[orderId]/__tests__/TrackingTimeline.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

// Import after setting up mocks since the component uses fetch
async function renderTimeline(orderId = "order-uuid") {
  const { TrackingTimeline } = await import("../TrackingTimeline");
  return render(<TrackingTimeline orderId={orderId} />);
}

describe("TrackingTimeline", () => {
  it("shows a loading skeleton while fetching", async () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));
    const { container } = await renderTimeline();
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows 'sedang disiapkan' message when dispatched is false", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ dispatched: false, status: "processing" }),
    } as Response);
    await renderTimeline();
    await waitFor(() =>
      expect(screen.getByText("Pesanan sedang disiapkan untuk dikirim")).toBeTruthy()
    );
  });

  it("shows resi and 'menunggu update' when dispatched with no history", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dispatched: true,
        status: "shipped",
        waybill_id: "JNE000123456",
        courier: "JNE",
        history: [],
      }),
    } as Response);
    await renderTimeline();
    await waitFor(() => {
      expect(screen.getByText("JNE000123456")).toBeTruthy();
      expect(screen.getByText("Menunggu update dari kurir")).toBeTruthy();
    });
  });

  it("renders timeline events when history is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dispatched: true,
        status: "shipped",
        waybill_id: "JNE000123456",
        courier: "JNE",
        history: [
          { note: "Paket dalam perjalanan", status: "in_transit", updated_at: "2026-04-16T09:14:00Z" },
          { note: "Paket diterima kurir", status: "picked_up", updated_at: "2026-04-15T17:30:00Z" },
        ],
      }),
    } as Response);
    await renderTimeline();
    await waitFor(() => {
      expect(screen.getByText("Paket dalam perjalanan")).toBeTruthy();
      expect(screen.getByText("Paket diterima kurir")).toBeTruthy();
    });
  });

  it("shows error message when fetch response is not ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
    } as Response);
    await renderTimeline();
    await waitFor(() =>
      expect(screen.getByText("Tidak dapat memuat info pengiriman")).toBeTruthy()
    );
  });

  it("shows error message when fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
    await renderTimeline();
    await waitFor(() =>
      expect(screen.getByText("Tidak dapat memuat info pengiriman")).toBeTruthy()
    );
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm vitest run "app/\(root\)/track/\[orderId\]/__tests__/TrackingTimeline.test.tsx"
```

Expected: `Cannot find module '../TrackingTimeline'`

- [ ] **Step 3: Implement `TrackingTimeline`**

```tsx
// app/(root)/track/[orderId]/TrackingTimeline.tsx
"use client";
import { useEffect, useState } from "react";

interface TrackingEvent {
  note: string;
  status: string;
  updated_at: string;
}

interface TrackingData {
  dispatched: boolean;
  status: string;
  waybill_id?: string;
  courier?: string;
  history?: TrackingEvent[];
}

type State =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "loaded"; data: TrackingData };

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingTimeline({ orderId }: { orderId: string }) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${orderId}/tracking`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not ok");
        const data = (await res.json()) as TrackingData;
        if (!cancelled) setState({ phase: "loaded", data });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "error" });
      });
    return () => { cancelled = true; };
  }, [orderId]);

  if (state.phase === "loading") {
    return (
      <div className="space-y-2 mt-2">
        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <p className="text-xs text-secondary mt-2">
        Tidak dapat memuat info pengiriman
      </p>
    );
  }

  const { data } = state;

  if (!data.dispatched) {
    return (
      <p className="text-sm text-secondary mt-2">
        Pesanan sedang disiapkan untuk dikirim
      </p>
    );
  }

  const history = data.history ?? [];

  return (
    <div className="mt-3">
      {/* Resi chip */}
      {data.waybill_id && (
        <div className="flex items-center justify-between bg-cyan-400/5 border border-cyan-400/15 rounded-lg px-3 py-2 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/60">
              No. Resi
            </p>
            <p className="text-sm font-bold text-cyan-400 font-mono">
              {data.waybill_id}
            </p>
          </div>
          {data.courier && (
            <span className="text-xs text-cyan-400/50 font-medium uppercase">
              {data.courier}
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
        Riwayat Pengiriman
      </p>
      {history.length === 0 ? (
        <p className="text-sm text-secondary">Menunggu update dari kurir</p>
      ) : (
        <div className="relative pl-5">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-white/[0.07]" />
          {history.map((event, i) => (
            <div key={i} className="relative mb-4 last:mb-0">
              <div
                className={`absolute left-[-14px] top-[5px] w-2 h-2 rounded-full border-[1.5px] ${
                  i === 0
                    ? "bg-cyan-400 border-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"
                    : "bg-transparent border-white/20"
                }`}
              />
              <p className={`text-sm leading-snug ${i === 0 ? "text-primary font-medium" : "text-secondary"}`}>
                {event.note}
              </p>
              <p className="text-[10px] text-secondary/50 mt-0.5">
                {formatEventTime(event.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm vitest run "app/\(root\)/track/\[orderId\]/__tests__/TrackingTimeline.test.tsx"
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/track/[orderId]/TrackingTimeline.tsx" "app/(root)/track/[orderId]/__tests__/TrackingTimeline.test.tsx"
git commit -m "feat: add TrackingTimeline client component with Biteship live events"
```

---

## Task 9: Success page refactor

**Files:**
- Modify: `app/(root)/checkout/success/page.tsx`

- [ ] **Step 1: Replace the entire file**

The current file is a client component wrapping `useSearchParams`. Replace it entirely with a server component that reads `searchParams` and fetches the order directly:

```tsx
// app/(root)/checkout/success/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";

type PageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order: orderId } = await searchParams;

  let orderNumber: string | null = null;
  let customerEmail: string | null = null;

  if (orderId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("ecom_orders")
      .select("order_number, customer_email")
      .eq("id", orderId)
      .single();
    orderNumber = (data?.order_number as string) ?? null;
    customerEmail = (data?.customer_email as string) ?? null;
  }

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">

          {/* Check icon */}
          <div className="animate-in zoom-in-50 fade-in duration-500 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <h1 className="text-2xl font-semibold text-primary mb-2 tracking-wide">
              Order Confirmed!
            </h1>
            <p className="text-secondary text-sm leading-relaxed">
              Thank you for ordering from Agroastery.
            </p>

            {/* Order number chip */}
            {orderNumber && (
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                  Order
                </span>
                <span className="text-sm font-bold text-primary font-mono tracking-wide">
                  {orderNumber}
                </span>
              </div>
            )}

            {/* Email note — guests only */}
            {customerEmail && (
              <p className="text-xs text-secondary/50 mt-3 leading-relaxed">
                Confirmation &amp; tracking link sent to{" "}
                <span className="text-secondary font-medium">{customerEmail}</span>
              </p>
            )}
          </div>

          {/* CTAs */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3 mt-8"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            {orderId && (
              <Link href={`/track/${orderId}`}>
                <Button className="w-full h-12 gap-2">
                  <MapPin className="w-4 h-4" />
                  Track My Order
                </Button>
              </Link>
            )}
            <Link href="/katalog">
              <Button className="w-full" variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-primary/20 mt-8">
            Your coffee is on its way
          </p>

        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and build**

```bash
pnpm tsc --noEmit 2>&1 | grep "success"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/checkout/success/page.tsx"
git commit -m "feat: refactor success page to server component with order chip and Track CTA"
```

---

## Task 10: Auth callback — link guest orders on login

**Files:**
- Modify: `app/api/auth/callback/route.ts`

- [ ] **Step 1: Replace the file with the updated version**

```ts
// app/api/auth/callback/route.ts
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Validate next is a safe relative path — prevent open redirect
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Link all guest orders that share this user's email — idempotent
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const admin = createSupabaseAdminClient();
          await admin
            .from("ecom_orders")
            .update({ user_id: user.id })
            .eq("customer_email", user.email)
            .is("user_id", null);
        }
      } catch (linkErr) {
        // Non-critical — log and continue. Orders will be linked on next login.
        console.error("[auth/callback] Failed to link guest orders:", linkErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | grep "callback"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/callback/route.ts
git commit -m "feat: link guest orders by email on Google sign-in"
```

---

## Task 11: Full test run + NEXT_PUBLIC_APP_URL check

- [ ] **Step 1: Run the full test suite**

```bash
pnpm vitest run
```

Expected: all tests pass, including the pre-existing `qr-payment-client.test.tsx`.

- [ ] **Step 2: Verify NEXT_PUBLIC_APP_URL is set in production env**

Check that `.env` (or Railway env vars) contains:
```
NEXT_PUBLIC_APP_URL=https://agroastery.com
RESEND_API_KEY=re_...
```

The tracking URL in emails will fall back to `https://agroastery.com` if `NEXT_PUBLIC_APP_URL` is unset, but it should be explicitly configured.

- [ ] **Step 3: Final build check**

```bash
pnpm build 2>&1 | tail -10
```

Expected: build succeeds with no new errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete guest order tracking — email, tracking page, success page, auth linking"
```
