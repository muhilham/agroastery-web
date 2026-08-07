# WhatsApp Link in Telegram Payment Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `wa.me` click-to-chat link to the Telegram payment notification so admins can send a pre-filled thank-you WhatsApp message to customers with one tap.

**Architecture:** Reuse existing WhatsApp helper (`lib/whatsapp.ts`) with Indonesian phone normalization. Extend `PaymentNotificationParams` to include items and shipping address phone. Pivot webhook fetches items and passes everything to the notification sender.

**Tech Stack:** Next.js, TypeScript, Vitest, Telegram Bot API, wa.me links

---

## File Map

| File | Responsibility |
|---|---|
| `lib/whatsapp.ts` | Phone normalization + WhatsApp message/link builder |
| `lib/whatsapp.test.ts` | Tests for phone normalization and link builder |
| `lib/telegram/notify.ts` | `sendPaymentNotification` — integrate wa.me link into Telegram text |
| `app/api/webhooks/pivot/route.ts` | Webhook — fetch items + shipping address, pass to notification |

---

### Task 1: Indonesian Phone Normalization Helper

**Files:**
- Modify: `lib/whatsapp.ts`
- Test: `lib/whatsapp.test.ts`

- [ ] **Step 1: Write failing test for `formatPhoneForWaMe`**

Add to `lib/whatsapp.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatPhoneForWaMe, buildWhatsAppLink } from "./whatsapp";

// Existing tests for buildWhatsAppLink remain...

describe("formatPhoneForWaMe", () => {
  it("converts 081... local format to 628...", () => {
    expect(formatPhoneForWaMe("08123456789")).toBe("628123456789");
  });

  it("converts +628... to 628...", () => {
    expect(formatPhoneForWaMe("+628123456789")).toBe("628123456789");
  });

  it("keeps 628... as-is", () => {
    expect(formatPhoneForWaMe("628123456789")).toBe("628123456789");
  });

  it("strips spaces and dashes before normalizing", () => {
    expect(formatPhoneForWaMe("+62 812-3456-789")).toBe("628123456789");
  });

  it("returns null for empty string", () => {
    expect(formatPhoneForWaMe("")).toBeNull();
  });

  it("returns null for non-numeric after cleanup", () => {
    expect(formatPhoneForWaMe("abc123")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/whatsapp.test.ts
```

Expected: FAIL — `formatPhoneForWaMe is not defined`

- [ ] **Step 3: Implement `formatPhoneForWaMe`**

Add to `lib/whatsapp.ts` (above existing `buildWhatsAppLink`):

```typescript
/**
 * Normalize Indonesian phone numbers to wa.me-compatible format (62... without +).
 * Mirrors the normalization logic in lib/pivot/client.ts formatPhoneForPivot.
 */
export function formatPhoneForWaMe(phone: string): string | null {
  let number = phone.trim().replace(/[\s-]/g, "");

  if (number.startsWith("+62")) number = number.slice(1); // keep 62...
  else if (number.startsWith("62") && number.length > 10) {
    /* already 62... — keep as-is after dash/space strip */
  } else if (number.startsWith("0")) {
    number = "62" + number.slice(1);
  }

  if (!/^\d+$/.test(number) || number.length < 10) return null;
  return number;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/whatsapp.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp.ts lib/whatsapp.test.ts
git commit -m "feat(whatsapp): add Indonesian phone normalization for wa.me"
```

---

### Task 2: Payment WhatsApp Link Builder

**Files:**
- Modify: `lib/whatsapp.ts`
- Test: `lib/whatsapp.test.ts`

- [ ] **Step 1: Write failing test for `buildPaymentWhatsAppLink`**

Add to `lib/whatsapp.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatPhoneForWaMe, buildWhatsAppLink, buildPaymentWhatsAppLink } from "./whatsapp";

describe("buildPaymentWhatsAppLink", () => {
  it("returns wa.me URL with pre-filled message", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-20260807-ABC123",
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      items: [
        { productName: "Kopi Arabica", quantity: 2 },
        { productName: "Kopi Robusta", quantity: 1 },
      ],
      total: 150000,
      appUrl: "https://agroastery.com",
    });

    expect(link).toBeTruthy();
    expect(link).toContain("https://wa.me/628123456789");
    expect(link).toContain(encodeURIComponent("Halo Budi, order AGR-20260807-ABC123 sudah dikonfirmasi."));
    expect(link).toContain(encodeURIComponent("• Kopi Arabica ×2"));
    expect(link).toContain(encodeURIComponent("Total: Rp 150.000"));
    expect(link).toContain(encodeURIComponent("https://agroastery.com/track/550e8400-e29b-41d4-a716-446655440000/"));
  });

  it("returns null for invalid phone", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "abc",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [],
      total: 100000,
    });
    expect(link).toBeNull();
  });

  it("skips items section when items empty", () => {
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [],
      total: 100000,
    });
    expect(link).toBeTruthy();
    expect(link).not.toContain("•");
  });

  it("uses NEXT_PUBLIC_APP_URL from env when appUrl not provided", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://test.agroastery.com";
    const link = buildPaymentWhatsAppLink({
      phone: "08123456789",
      customerName: "Budi",
      orderNumber: "AGR-001",
      orderId: "uuid",
      items: [{ productName: "Kopi", quantity: 1 }],
      total: 50000,
    });
    expect(link).toContain(encodeURIComponent("https://test.agroastery.com/track/uuid/"));
    delete process.env.NEXT_PUBLIC_APP_URL;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/whatsapp.test.ts
```

Expected: FAIL — `buildPaymentWhatsAppLink is not defined`

- [ ] **Step 3: Implement `buildPaymentWhatsAppLink`**

Add to `lib/whatsapp.ts` (below `formatPhoneForWaMe`):

```typescript
type PaymentWhatsAppItem = {
  productName: string;
  quantity: number;
};

type BuildPaymentWhatsAppLinkParams = {
  phone: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  items: PaymentWhatsAppItem[];
  total: number;
  appUrl?: string;
};

export function buildPaymentWhatsAppLink(params: BuildPaymentWhatsAppLinkParams): string | null {
  const cleanPhone = formatPhoneForWaMe(params.phone);
  if (!cleanPhone) return null;

  const appUrl = params.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";

  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(params.total);

  let message = `Halo ${params.customerName}, order ${params.orderNumber} sudah dikonfirmasi.`;

  if (params.items.length > 0) {
    const itemLines = params.items
      .map((i) => `• ${i.productName} ×${i.quantity}`)
      .join("\n");
    message += `\n\n${itemLines}`;
  }

  message += `\n\nTotal: ${formattedTotal}`;
  message += `\nTracking: ${appUrl}/track/${params.orderId}/`;
  message += `\n\nTerima kasih sudah order di Agroastery! 🙏`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/whatsapp.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp.ts lib/whatsapp.test.ts
git commit -m "feat(whatsapp): add payment WhatsApp link builder"
```

---

### Task 3: Integrate wa.me Link into Telegram Notification

**Files:**
- Modify: `lib/telegram/notify.ts`

- [ ] **Step 1: Update `PaymentNotificationParams` type**

In `lib/telegram/notify.ts`, update the type definition:

```typescript
type PaymentNotificationParams = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddressPhone?: string | null;
  paymentMethod?: string | null;
  total: number;
  paidAt: string;
  items?: { productName: string; quantity: number }[];
};
```

- [ ] **Step 2: Import `buildPaymentWhatsAppLink`**

At top of `lib/telegram/notify.ts`:

```typescript
import { buildPaymentWhatsAppLink } from "@/lib/whatsapp";
```

- [ ] **Step 3: Modify `sendPaymentNotification` to build and append wa.me link**

Inside `sendPaymentNotification`, after building `text` array and before `sendTelegramMessage(text)`, add:

```typescript
  // Build wa.me link for real payment confirmations only (skip alert/hack messages)
  const isAlert = params.paymentMethod?.startsWith("⚠️");
  if (!isAlert) {
    const targetPhone = params.customerPhone || params.shippingAddressPhone || "";
    const waLink = buildPaymentWhatsAppLink({
      phone: targetPhone,
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderId: params.orderId,
      items: params.items ?? [],
      total: params.total,
    });
    if (waLink) {
      text.push("", `WA: ${waLink}`);
    }
  }
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: No errors in `lib/telegram/notify.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/telegram/notify.ts
git commit -m "feat(telegram): integrate wa.me link into payment notifications"
```

---

### Task 4: Pivot Webhook — Pass Items and Shipping Phone

**Files:**
- Modify: `app/api/webhooks/pivot/route.ts`

- [ ] **Step 1: Update DB select to include shipping_address**

In `app/api/webhooks/pivot/route.ts`, line ~78, change the select:

```typescript
      .select("id, order_number, customer_name, customer_phone, total, shipping_address")
```

- [ ] **Step 2: Fetch order items after order update**

After the `updatedOrder` check (around line 86), add item fetch:

```typescript
    if (updatedOrder) {
      // Fetch order items for WhatsApp message
      const { data: orderItems } = await supabase
        .from("ecom_order_items")
        .select("product_name, quantity")
        .eq("order_id", updatedOrder.id);

      const shippingAddress = updatedOrder.shipping_address as Record<string, unknown> | null;
      const shippingAddressPhone = (shippingAddress?.phone as string) || null;
```

- [ ] **Step 3: Pass items and shipping phone to `sendPaymentNotification`**

Update the `sendPaymentNotification` call (around line 87):

```typescript
      sendPaymentNotification({
        orderId: updatedOrder.id as string,
        orderNumber: updatedOrder.order_number as string,
        customerName: updatedOrder.customer_name as string,
        customerPhone: updatedOrder.customer_phone as string,
        shippingAddressPhone,
        paymentMethod: "QRIS",
        total: updatedOrder.total as number,
        paidAt,
        items: (orderItems ?? []).map((i) => ({
          productName: i.product_name as string,
          quantity: i.quantity as number,
        })),
      }).catch((err: unknown) =>
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
pnpm tsc --noEmit
```

Expected: No errors in `app/api/webhooks/pivot/route.ts`

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/pivot/route.ts
git commit -m "feat(webhook): pass order items and shipping phone to payment notification"
```

---

### Task 5: Full Test Run

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass, no regressions.

- [ ] **Step 2: Lint check**

```bash
pnpm lint
```

Expected: No lint errors in modified files.

- [ ] **Step 3: Commit (if any auto-fixes applied)**

```bash
git add -A && git diff --cached --quiet || git commit -m "chore: lint fixes"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Plan Task |
|---|---|
| `formatPhoneForWaMe` with Indonesian normalization | Task 1 |
| `buildPaymentWhatsAppLink` with message template | Task 2 |
| wa.me link appended to Telegram text | Task 3 |
| Skip link for alert messages (`⚠️`) | Task 3, Step 3 |
| `customerPhone` primary, `shippingAddressPhone` fallback | Task 3, Step 3 |
| Pivot webhook passes items + shipping phone | Task 4 |
| Tracking URL always included (pickup + delivery) | Task 2, `buildPaymentWhatsAppLink` |
| Tests for phone normalization | Task 1 |
| Tests for link builder | Task 2 |

✅ No gaps.

### Placeholder Scan

- No "TBD", "TODO", "implement later"
- No vague error-handling directives
- All test code shown in full
- All implementation code shown in full
- Exact commands with expected output

✅ Clean.

### Type Consistency

- `PaymentNotificationParams.items` matches `BuildPaymentWhatsAppLinkParams.items` shape
- `shippingAddressPhone` is `string | null | undefined` consistently
- `formatPhoneForWaMe` return type `string | null` used correctly

✅ Consistent.

---

## Acceptance Criteria Verification

- [ ] `PAYMENT.PAID` webhook triggers Telegram message with `WA: https://wa.me/...` link
- [ ] Clicking link opens WhatsApp with pre-filled thank-you message including order number, items, total, tracking URL
- [ ] Pickup orders still show tracking link (page renders "Ambil Sendiri" correctly)
- [ ] Invalid/missing phone → Telegram sent without wa.me link
- [ ] Alert messages (`⚠️ BITESHIP...`) skip wa.me link
- [ ] All new code covered by tests (`lib/whatsapp.test.ts`)
