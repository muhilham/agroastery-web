# Self-Pickup Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers choose "Ambil Sendiri" (self pickup) at checkout instead of paying for delivery, to stop bounce from customers who find cheaper shipping elsewhere.

**Architecture:** Pickup is encoded entirely through existing `ecom_orders` columns (`shipping_courier = "pickup"`, `shipping_cost = 0`, `shipping_address.address_line` = pickup location text) — no DB migration. Every read path that assumes a delivery shape (order detail, tracking page, email, Telegram) branches on `shipping_courier === "pickup"`. Guard/label logic that's cheap to unit-test is extracted into small pure functions; page-level rendering is verified manually per this repo's existing test conventions (no component tests exist today for the checkout/order/track pages).

**Tech Stack:** Next.js 15 App Router, TypeScript, Zod, Vitest, react-hook-form.

---

### Task 1: Client form schema — `fulfillmentMethod` + conditional address validation

**Files:**
- Modify: `app/(root)/checkout/checkoutSchemas.ts`
- Test: `app/(root)/checkout/__tests__/checkoutSchemas.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `app/(root)/checkout/__tests__/checkoutSchemas.test.ts`:

```ts
describe("fulfillmentMethod", () => {
  it("defaults to delivery and still requires address/postalCode", () => {
    const { fullName, phone } = validBase;
    const result = loggedInFormSchema.safeParse({ fullName, phone });
    expect(result.success).toBe(false);
  });

  it("passes in pickup mode without address or postalCode", () => {
    const result = loggedInFormSchema.safeParse({
      fullName: "Budi Santoso",
      phone: "081234567890",
      fulfillmentMethod: "pickup",
    });
    expect(result.success).toBe(true);
  });

  it("fails in delivery mode without address", () => {
    const result = loggedInFormSchema.safeParse({
      fullName: "Budi Santoso",
      phone: "081234567890",
      fulfillmentMethod: "delivery",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const addressErrors = result.error.errors.filter((e) => e.path.includes("address"));
      expect(addressErrors.length).toBeGreaterThan(0);
    }
  });

  it("passes in delivery mode with valid address and postalCode", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase, fulfillmentMethod: "delivery" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown fulfillmentMethod value", () => {
    const result = loggedInFormSchema.safeParse({ ...validBase, fulfillmentMethod: "teleport" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/\(root\)/checkout/__tests__/checkoutSchemas.test.ts`
Expected: the 5 new tests FAIL (`fulfillmentMethod` doesn't exist yet on the schema, so pickup-mode payloads still get rejected for missing address, and the "defaults to delivery" test fails because address is currently unconditionally required so it fails for the wrong reason — that's fine, we're about to change the requirement to be conditional).

- [ ] **Step 3: Implement the schema change**

Replace the full contents of `app/(root)/checkout/checkoutSchemas.ts`:

```ts
import { z } from "zod";

const baseSchema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter").max(50),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address: z.string().max(300).optional(),
  postalCode: z.string().max(5).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
  fulfillmentMethod: z.enum(["delivery", "pickup"]).default("delivery"),
});

function refineFulfillment(data: z.infer<typeof baseSchema>, ctx: z.RefinementCtx) {
  if (data.fulfillmentMethod !== "delivery") return;
  if (!data.address || data.address.trim().length < 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Alamat terlalu singkat" });
  }
  if (!data.postalCode || data.postalCode.length < 5) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["postalCode"], message: "Kode pos tidak valid" });
  }
}

export const guestFormSchema = baseSchema
  .extend({ email: z.string().min(1, "Email wajib diisi").email("Email tidak valid") })
  .superRefine(refineFulfillment);

export const loggedInFormSchema = baseSchema
  .extend({ email: z.string().email().or(z.literal("")).nullable().optional() })
  .superRefine(refineFulfillment);

// TForm is derived from the permissive schema so it works for both guest and
// logged-in users (email?: string | null | undefined). The guest resolver enforces
// email is required at runtime via Zod — not via the TypeScript type.
export type TForm = z.infer<typeof loggedInFormSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/\(root\)/checkout/__tests__/checkoutSchemas.test.ts`
Expected: all tests PASS (the pre-existing ones plus the 5 new ones — `validBase` in the file has no `fulfillmentMethod` key, which defaults to `"delivery"`, so the original tests keep passing unchanged).

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/checkout/checkoutSchemas.ts" "app/(root)/checkout/__tests__/checkoutSchemas.test.ts"
git commit -m "feat(checkout): add fulfillmentMethod to client form schema"
```

---

### Task 2: Extract the shipping-cost guard into a testable function

**Why a new file:** `app/api/checkout/route.ts` has no test coverage today (mocking its full Supabase call chain — variants, products, option values, stock RPC, order insert with retry, item insert, session update — is a large, separate undertaking outside this feature's scope). Extracting the one guard we need to change into a pure function lets us test the actual behavior change without touching that.

**Files:**
- Create: `lib/checkout/validateShippingCost.ts`
- Test: `lib/checkout/validateShippingCost.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/checkout/validateShippingCost.test.ts
import { describe, it, expect } from "vitest";
import { isShippingCostInvalid } from "./validateShippingCost";

describe("isShippingCostInvalid", () => {
  it("flags zero cost with a courier and nonzero weight for delivery orders", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "delivery",
      shippingCost: 0,
      shippingCourier: "jne",
      totalShipWeight: 500,
    });
    expect(result).toBe(true);
  });

  it("allows a legitimate positive shipping cost for delivery orders", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "delivery",
      shippingCost: 15000,
      shippingCourier: "jne",
      totalShipWeight: 500,
    });
    expect(result).toBe(false);
  });

  it("never flags pickup orders even with zero cost, a courier value, and weight", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "pickup",
      shippingCost: 0,
      shippingCourier: "pickup",
      totalShipWeight: 500,
    });
    expect(result).toBe(false);
  });

  it("allows zero cost for delivery when there is no courier selected yet", () => {
    const result = isShippingCostInvalid({
      fulfillmentMethod: "delivery",
      shippingCost: 0,
      shippingCourier: undefined,
      totalShipWeight: 500,
    });
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/checkout/validateShippingCost.test.ts`
Expected: FAIL with `Cannot find module './validateShippingCost'`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/checkout/validateShippingCost.ts

/**
 * True when a delivery order's shipping cost looks wrong: zero cost despite
 * a chosen courier and nonzero package weight. Pickup orders are exempt —
 * zero cost with shippingCourier="pickup" is the correct, expected state.
 */
export function isShippingCostInvalid(params: {
  fulfillmentMethod: "delivery" | "pickup";
  shippingCost: number;
  shippingCourier?: string;
  totalShipWeight: number;
}): boolean {
  if (params.fulfillmentMethod === "pickup") return false;
  return params.shippingCost === 0 && Boolean(params.shippingCourier) && params.totalShipWeight > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/checkout/validateShippingCost.test.ts`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/checkout/validateShippingCost.ts lib/checkout/validateShippingCost.test.ts
git commit -m "feat(checkout): extract shipping-cost guard into testable function"
```

---

### Task 3: Server request schema + wire the guard + pickup fields in `ecom_orders` insert

**Files:**
- Modify: `app/api/checkout/route.ts:14-32` (schemas), `:184-190` (guard), `:259-266` (insert)
- Test: `app/api/checkout/checkoutSchema.test.ts`

- [ ] **Step 1: Write the failing test**

`CheckoutSchema` isn't exported yet, so this test also drives that change.

```ts
// app/api/checkout/checkoutSchema.test.ts
import { describe, it, expect } from "vitest";
import { CheckoutSchema } from "./route";

const baseItems = [{ variantId: "11111111-1111-1111-1111-111111111111", quantity: 1 }];

describe("CheckoutSchema", () => {
  it("defaults fulfillmentMethod to delivery when omitted", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      shippingAddress: { recipientName: "Budi", phone: "081234567890", addressLine: "Jl. Contoh No. 1" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fulfillmentMethod).toBe("delivery");
  });

  it("accepts a pickup payload with no postalCode/latitude/longitude", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      fulfillmentMethod: "pickup",
      shippingAddress: {
        recipientName: "Budi",
        phone: "081234567890",
        addressLine: "Jl. Roastery No. 1, Jakarta Selatan",
        hours: "Senin-Sabtu, 09:00-17:00 WIB",
      },
      shippingCourier: "pickup",
      shippingCost: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.shippingAddress.hours).toBe("Senin-Sabtu, 09:00-17:00 WIB");
  });

  it("rejects an unknown fulfillmentMethod value", () => {
    const result = CheckoutSchema.safeParse({
      items: baseItems,
      customerName: "Budi",
      customerPhone: "081234567890",
      fulfillmentMethod: "teleport",
      shippingAddress: { recipientName: "Budi", phone: "081234567890", addressLine: "Jl. Contoh No. 1" },
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/checkout/checkoutSchema.test.ts`
Expected: FAIL — `CheckoutSchema` is not exported from `route.ts`, and `hours` is not a recognized field.

- [ ] **Step 3: Implement — update schemas (route.ts:14-32)**

Replace lines 14-32 of `app/api/checkout/route.ts`:

```ts
const ShippingAddressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(1),
  addressLine: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hours: z.string().optional(),
});

export const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1).max(50),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(1),
  shippingAddress: ShippingAddressSchema,
  shippingCourier: z.string().optional(),
  shippingService: z.string().optional(),
  shippingCost: z.number().int().nonnegative().default(0),
  shippingEtd: z.string().optional(),
  fulfillmentMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
});
```

(Only two changes here: `hours` added to `ShippingAddressSchema`, `fulfillmentMethod` added to `CheckoutSchema`, and `const CheckoutSchema` → `export const CheckoutSchema`.)

- [ ] **Step 4: Implement — wire the guard (route.ts:184-190)**

Add the import at the top of the file (near the other `@/lib/...` imports):

```ts
import { isShippingCostInvalid } from "@/lib/checkout/validateShippingCost";
```

Replace lines 184-190:

```ts
    // Reject if shipping cost is 0 but items need shipping and a courier is specified.
    // Pickup orders are exempt — see isShippingCostInvalid.
    if (
      isShippingCostInvalid({
        fulfillmentMethod: data.fulfillmentMethod,
        shippingCost: data.shippingCost,
        shippingCourier: data.shippingCourier,
        totalShipWeight,
      })
    ) {
      return NextResponse.json(
        { error: "Ongkos kirim tidak valid", code: "INVALID_SHIPPING_COST" },
        { status: 400 }
      );
    }
```

- [ ] **Step 5: Implement — carry `hours` into the DB insert (route.ts:259-266)**

Replace lines 259-266 (the `shipping_address` object inside the `.insert({...})` call):

```ts
          shipping_address: {
            recipient_name: data.shippingAddress.recipientName,
            phone: data.shippingAddress.phone,
            address_line: data.shippingAddress.addressLine,
            postal_code: data.shippingAddress.postalCode ?? null,
            latitude: data.shippingAddress.latitude ?? null,
            longitude: data.shippingAddress.longitude ?? null,
            hours: data.shippingAddress.hours ?? null,
          },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run app/api/checkout/checkoutSchema.test.ts`
Expected: all 3 tests PASS.

- [ ] **Step 7: Run the full test suite to check for regressions**

Run: `npx vitest run`
Expected: all tests PASS (in particular, `checkoutSchemas.test.ts` from Task 1, and any other test importing `app/api/checkout/route.ts`, if one exists — confirm none newly fail).

- [ ] **Step 8: Commit**

```bash
git add app/api/checkout/route.ts app/api/checkout/checkoutSchema.test.ts
git commit -m "feat(checkout): accept pickup orders in checkout API request schema"
```

---

### Task 4: Checkout page — pickup toggle, submit-guard exemption, payload construction

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

No automated test for this task — this codebase has no component-level tests for the checkout page (only `qr-payment-client.test.tsx` for the payment sub-page and `TrackingTimeline.test.tsx` for an isolated child component exist). Verify manually per Task 9.

- [ ] **Step 1: Add `fulfillmentMethod` to form defaults and watch it**

In the `useForm<TForm>({ defaultValues: {...} })` call (around line 68), add the field:

```ts
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
      fulfillmentMethod: "delivery",
    },
    mode: "onChange",
  });
```

Immediately after the `useShippingCalculator()` destructure (around line 92), add:

```ts
  const fulfillmentMethod = useWatch({ control: form.control, name: "fulfillmentMethod" });
  const pickupAvailable = Boolean(
    process.env.NEXT_PUBLIC_PICKUP_ADDRESS && process.env.NEXT_PUBLIC_PICKUP_HOURS
  );

  const handleFulfillmentChange = useCallback(
    (method: "delivery" | "pickup") => {
      form.setValue("fulfillmentMethod", method, { shouldValidate: true });
      if (method === "pickup") {
        setSelectedShipping(null);
        resetShipping();
      }
    },
    [form, setSelectedShipping, resetShipping]
  );
```

- [ ] **Step 2: Exempt pickup from the submit guard (page.tsx:252)**

Replace:

```ts
    if (!selectedShipping) {
      console.log("[Checkout] No shipping selected");
      setSubmitError("Pilih opsi pengiriman terlebih dahulu");
      return;
    }
```

with:

```ts
    if (values.fulfillmentMethod === "delivery" && !selectedShipping) {
      console.log("[Checkout] No shipping selected");
      setSubmitError("Pilih opsi pengiriman terlebih dahulu");
      return;
    }
```

- [ ] **Step 3: Branch the request payload in `onSubmit` (page.tsx:273-291)**

Replace the `body: JSON.stringify({...})` block inside the `fetch("/api/checkout", ...)` call:

```ts
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          customerName: values.fullName,
          customerEmail: values.email || undefined,
          customerPhone: values.phone,
          fulfillmentMethod: values.fulfillmentMethod,
          shippingAddress:
            values.fulfillmentMethod === "pickup"
              ? {
                  recipientName: values.fullName,
                  phone: values.phone,
                  addressLine: process.env.NEXT_PUBLIC_PICKUP_ADDRESS ?? "",
                  hours: process.env.NEXT_PUBLIC_PICKUP_HOURS ?? undefined,
                }
              : {
                  recipientName: values.fullName,
                  phone: values.phone,
                  addressLine: values.address,
                  postalCode: values.postalCode || undefined,
                  latitude: values.lat ?? undefined,
                  longitude: values.lng ?? undefined,
                },
          shippingCourier: values.fulfillmentMethod === "pickup" ? "pickup" : (selectedShipping?.raw?.courier_code ?? undefined),
          shippingService: values.fulfillmentMethod === "pickup" ? undefined : (selectedShipping?.raw?.courier_service_code ?? undefined),
          shippingCost: values.fulfillmentMethod === "pickup" ? 0 : shippingCost,
          shippingEtd: values.fulfillmentMethod === "pickup" ? undefined : (selectedShipping?.eta ?? undefined),
          notes: values.notes || undefined,
          idempotencyKey: idempotencyKey.current,
        }),
```

- [ ] **Step 4: Add the pickup toggle UI before "Step 1: Alamat Pengiriman"**

Immediately before the `{/* Step 1: Alamat Pengiriman */}` block (inside `<form onSubmit={...}>`, right after the opening `<form>` tag), insert:

```tsx
            {pickupAvailable && (
              <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
                <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">
                  Metode Pengambilan
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange("delivery")}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      fulfillmentMethod === "delivery"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 text-secondary"
                    }`}
                  >
                    Kirim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange("pickup")}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      fulfillmentMethod === "pickup"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-white/10 text-secondary"
                    }`}
                  >
                    Ambil Sendiri
                  </button>
                </div>
                {fulfillmentMethod === "pickup" && (
                  <div className="rounded-xl bg-[#242424] border border-white/10 px-4 py-3 space-y-1">
                    <p className="text-[#CCC4A9] text-sm font-medium">
                      {process.env.NEXT_PUBLIC_PICKUP_ADDRESS}
                    </p>
                    <p className="text-[#CCC4A9]/60 text-xs">
                      {process.env.NEXT_PUBLIC_PICKUP_HOURS}
                    </p>
                  </div>
                )}
              </div>
            )}

```

- [ ] **Step 5: Hide the address step in pickup mode**

Don't touch the inside of the Step 1 block — only wrap it. Find this exact line (immediately after the `{/* Step 1: Alamat Pengiriman */}` comment):

```tsx
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Alamat Pengiriman</h2>
              </div>
```

and change just the opening line, adding the guard before it:

```tsx
            {fulfillmentMethod === "delivery" && (
            <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Alamat Pengiriman</h2>
              </div>
```

Then find the end of that same block — it closes with `</div>` immediately followed by the `<LocationDisplay ... />` self-closing tag and then the block's final closing `</div>`:

```tsx
              <LocationDisplay
                location={location}
                isLoading={isLoadingShipping}
                error={shippingError}
              />
            </div>

            {/* Step 2: Data Penerima */}
```

and add the matching `)}` right after that `</div>`, before the "Step 2" comment:

```tsx
              <LocationDisplay
                location={location}
                isLoading={isLoadingShipping}
                error={shippingError}
              />
            </div>
            )}

            {/* Step 2: Data Penerima */}
```

Everything between those two edits (the saved-address selector, address/postalCode fields, map picker, and map display for saved addresses) stays exactly as it is today — only the wrapping `{fulfillmentMethod === "delivery" && ( ... )}` is added around the whole card.

(The "Opsi Pengiriman" step already only renders `{shippingRates.length > 0 && !shippingError && (...)}` — since pickup mode never triggers a rate calculation, it stays hidden automatically. No change needed there.)

- [ ] **Step 6: Update the bottom bar shipping line (page.tsx:744)**

Replace:

```tsx
          <div className="flex justify-between text-sm text-secondary mb-2">
            <span>Pengiriman</span>
            <span className="text-primary">
              {selectedShipping ? numberToIdr({ nominal: shippingCost }) : "-"}
            </span>
          </div>
```

with:

```tsx
          <div className="flex justify-between text-sm text-secondary mb-2">
            <span>Pengiriman</span>
            <span className="text-primary">
              {fulfillmentMethod === "pickup"
                ? "Gratis (Ambil Sendiri)"
                : selectedShipping
                ? numberToIdr({ nominal: shippingCost })
                : "-"}
            </span>
          </div>
```

- [ ] **Step 7: Update the submit button's disabled logic (page.tsx:763, :774)**

Replace both occurrences of:

```ts
isSubmitting || isLoadingShipping || !selectedShipping || cartCount === 0
```

with:

```ts
isSubmitting || cartCount === 0 || (fulfillmentMethod === "delivery" && (isLoadingShipping || !selectedShipping))
```

(One occurrence is inside the debug `console.log`/`isDisabled` block at line 763, the other is the button's `disabled={...}` prop at line 774 — update both identically.)

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 9: Commit**

```bash
git add "app/(root)/checkout/page.tsx"
git commit -m "feat(checkout): add self-pickup toggle to checkout page"
```

---

### Task 5: Order detail page — status labels + pickup shipping card

**Files:**
- Modify: `app/(root)/orders/[id]/page.tsx`

No automated test — this is a server component with no existing test coverage in this repo; verify manually per Task 9.

- [ ] **Step 1: Add the two new status entries**

In `STATUS_LABELS` (around line 9):

```ts
const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  ready_for_pickup: "Siap Diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};
```

In `STATUS_COLORS` (around line 19):

```ts
const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10",
  paid: "text-green-400 bg-green-400/10",
  processing: "text-blue-400 bg-blue-400/10",
  shipped: "text-cyan-400 bg-cyan-400/10",
  delivered: "text-green-500 bg-green-500/10",
  ready_for_pickup: "text-purple-400 bg-purple-400/10",
  completed: "text-green-500 bg-green-500/10",
  cancelled: "text-red-400 bg-red-400/10",
  refunded: "text-orange-400 bg-orange-400/10",
};
```

- [ ] **Step 2: Hide the generic "Alamat Pengiriman" card for pickup orders**

Replace:

```tsx
        {/* Shipping address */}
        {shippingAddress && (
```

with:

```tsx
        {/* Shipping address */}
        {shippingAddress && order.shipping_courier !== "pickup" && (
```

(Leave the rest of that block — the closing `)}` and its contents — unchanged.)

- [ ] **Step 3: Branch the "Info Pengiriman" card**

Replace the whole block:

```tsx
        {/* Shipping details */}
        {(order.shipping_courier ||
          order.tracking_number ||
          order.biteship_order_id) && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-primary font-medium mb-2">Info Pengiriman</h2>
            {order.shipping_courier && (
              <p className="text-secondary text-sm">
                Kurir: <span className="text-primary">{order.shipping_courier as string} {order.shipping_service as string}</span>
              </p>
            )}
            {order.shipping_etd && (
              <p className="text-secondary text-sm">
                Estimasi: <span className="text-primary">{order.shipping_etd as string}</span>
              </p>
            )}
            {order.tracking_number && (
              <p className="text-secondary text-sm">
                No. Resi: <span className="text-primary font-mono break-all">{order.tracking_number as string}</span>
              </p>
            )}
            {order.tracking_number && (
              <div className="pt-3 mt-3 border-t border-white/10">
                <Link
                  href={`/track/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Lacak Pesanan
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
```

with:

```tsx
        {/* Shipping details */}
        {order.shipping_courier === "pickup" ? (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-primary font-medium mb-2">Ambil Sendiri</h2>
            <p className="text-secondary text-sm">{shippingAddress?.address_line}</p>
            {shippingAddress?.hours && (
              <p className="text-secondary text-sm">{shippingAddress.hours}</p>
            )}
          </div>
        ) : (
          (order.shipping_courier || order.tracking_number || order.biteship_order_id) && (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
              <h2 className="text-primary font-medium mb-2">Info Pengiriman</h2>
              {order.shipping_courier && (
                <p className="text-secondary text-sm">
                  Kurir: <span className="text-primary">{order.shipping_courier as string} {order.shipping_service as string}</span>
                </p>
              )}
              {order.shipping_etd && (
                <p className="text-secondary text-sm">
                  Estimasi: <span className="text-primary">{order.shipping_etd as string}</span>
                </p>
              )}
              {order.tracking_number && (
                <p className="text-secondary text-sm">
                  No. Resi: <span className="text-primary font-mono break-all">{order.tracking_number as string}</span>
                </p>
              )}
              {order.tracking_number && (
                <div className="pt-3 mt-3 border-t border-white/10">
                  <Link
                    href={`/track/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Lacak Pesanan
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )
        )}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/orders/[id]/page.tsx"
git commit -m "feat(orders): show pickup location on order detail page"
```

---

### Task 6: Tracking page — status labels + pickup card, skip courier row and timeline

**Files:**
- Modify: `app/(root)/track/[orderId]/page.tsx`

No automated test — same rationale as Task 5; verify manually per Task 9.

- [ ] **Step 1: Add the same two status entries**

Same additions as Task 5 Step 1, applied to this file's own `STATUS_LABELS` (around line 9) and `STATUS_COLORS` (around line 19):

```ts
const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  paid: "Pembayaran Diterima",
  processing: "Sedang Diproses",
  shipped: "Dikirim",
  delivered: "Diterima",
  ready_for_pickup: "Siap Diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  paid: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  shipped: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  delivered: "text-green-500 bg-green-500/10 border-green-500/20",
  ready_for_pickup: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  completed: "text-green-500 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  refunded: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};
```

- [ ] **Step 2: Branch the "Info Pengiriman" card to skip courier row and `TrackingTimeline` for pickup**

Replace the block:

```tsx
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
```

with:

```tsx
        {/* Shipping + live Biteship timeline */}
        {order.shipping_courier === "pickup" ? (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
              Ambil Sendiri
            </h2>
            <p className="text-primary text-sm">{shippingAddress?.address_line}</p>
            {shippingAddress?.hours && (
              <p className="text-secondary text-sm mt-1">{shippingAddress.hours}</p>
            )}
          </div>
        ) : (
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
        )}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/track/[orderId]/page.tsx"
git commit -m "feat(track): show pickup location instead of courier tracking"
```

---

### Task 7: Order confirmation email — pickup-aware labels

**Files:**
- Create: `lib/resend/templates/shippingLabel.ts`
- Test: `lib/resend/templates/shippingLabel.test.ts`
- Modify: `lib/resend/templates/OrderConfirmation.tsx`

Extracting the label logic (rather than testing the React email template directly) matches the pattern from Task 2 — pure functions are cheap to test, and this repo has no snapshot/render testing set up for `@react-email/components` templates.

- [ ] **Step 1: Write the failing test**

```ts
// lib/resend/templates/shippingLabel.test.ts
import { describe, it, expect } from "vitest";
import { getShippingLabel, getShippingHeading, getTrackingCtaLabel } from "./shippingLabel";

describe("getShippingLabel", () => {
  it("returns 'Ambil Sendiri' for pickup orders regardless of service", () => {
    expect(getShippingLabel("pickup", undefined)).toBe("Ambil Sendiri");
  });

  it("returns 'COURIER SERVICE' when both are present", () => {
    expect(getShippingLabel("jne", "REG")).toBe("JNE REG");
  });

  it("falls back to just the courier name when service is missing", () => {
    expect(getShippingLabel("jne", undefined)).toBe("JNE");
  });

  it("falls back to 'Courier' when nothing is set", () => {
    expect(getShippingLabel(undefined, undefined)).toBe("Courier");
  });
});

describe("getShippingHeading", () => {
  it("returns 'Pickup at' for pickup orders", () => {
    expect(getShippingHeading("pickup")).toBe("Pickup at");
  });

  it("returns 'Shipping to' for delivery orders", () => {
    expect(getShippingHeading("jne")).toBe("Shipping to");
  });
});

describe("getTrackingCtaLabel", () => {
  it("returns the pickup CTA label for pickup orders", () => {
    expect(getTrackingCtaLabel("pickup")).toBe("Lihat Info Pengambilan →");
  });

  it("returns the default CTA label for delivery orders", () => {
    expect(getTrackingCtaLabel("jne")).toBe("Track My Order →");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/resend/templates/shippingLabel.test.ts`
Expected: FAIL with `Cannot find module './shippingLabel'`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/resend/templates/shippingLabel.ts

export function getShippingLabel(
  shippingCourier?: string | null,
  shippingService?: string | null
): string {
  if (shippingCourier === "pickup") return "Ambil Sendiri";
  if (shippingCourier && shippingService) return `${shippingCourier.toUpperCase()} ${shippingService}`;
  if (shippingCourier) return shippingCourier.toUpperCase();
  return "Courier";
}

export function getShippingHeading(shippingCourier?: string | null): string {
  return shippingCourier === "pickup" ? "Pickup at" : "Shipping to";
}

export function getTrackingCtaLabel(shippingCourier?: string | null): string {
  return shippingCourier === "pickup" ? "Lihat Info Pengambilan →" : "Track My Order →";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/resend/templates/shippingLabel.test.ts`
Expected: all 8 tests PASS.

- [ ] **Step 5: Wire the helpers into `OrderConfirmation.tsx`**

Add the import near the top of `lib/resend/templates/OrderConfirmation.tsx` (after the `react` import):

```ts
import { getShippingLabel, getShippingHeading, getTrackingCtaLabel } from "./shippingLabel";
```

Replace the `courierLabel` computation:

```ts
  const courierLabel =
    shippingCourier && shippingService
      ? `${shippingCourier.toUpperCase()} ${shippingService}`
      : shippingCourier?.toUpperCase() ?? "Courier";
```

with:

```ts
  const courierLabel = getShippingLabel(shippingCourier, shippingService);
  const isPickup = shippingCourier === "pickup";
```

Replace the shipping-cost row label:

```tsx
                <td><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>Shipping ({courierLabel})</Text></td>
```

with:

```tsx
                <td><Text style={{ color: "#666", fontSize: "12px", margin: "2px 0" }}>{isPickup ? "Pickup" : `Shipping (${courierLabel})`}</Text></td>
```

Replace the "Shipping to" heading:

```tsx
              <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: "0 0 4px" }}>Shipping to</Text>
```

with:

```tsx
              <Text style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: "600", margin: "0 0 4px" }}>{getShippingHeading(shippingCourier)}</Text>
```

Replace the CTA button text:

```tsx
              Track My Order →
```

with:

```tsx
              {getTrackingCtaLabel(shippingCourier)}
```

- [ ] **Step 6: Run the full test suite to check for regressions**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/resend/templates/shippingLabel.ts lib/resend/templates/shippingLabel.test.ts lib/resend/templates/OrderConfirmation.tsx
git commit -m "feat(email): show pickup-specific copy in order confirmation"
```

---

### Task 8: Telegram order notification — pickup-aware courier label

**Files:**
- Modify: `lib/telegram/notify.ts`

No new test file — `notify.ts` has zero existing unit test coverage in this repo (it's only exercised indirectly via mocks in webhook tests), and this is a one-line label change. Covered by manual verification in Task 9.

- [ ] **Step 1: Update the courier label in `sendOrderNotification`**

Replace:

```ts
  const courier =
    params.shippingCourier && params.shippingService
      ? `${params.shippingCourier.toUpperCase()} ${params.shippingService}`
      : params.shippingCourier?.toUpperCase() ?? "—";
```

with:

```ts
  const courier =
    params.shippingCourier === "pickup"
      ? "Ambil Sendiri"
      : params.shippingCourier && params.shippingService
      ? `${params.shippingCourier.toUpperCase()} ${params.shippingService}`
      : params.shippingCourier?.toUpperCase() ?? "—";
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/telegram/notify.ts
git commit -m "feat(telegram): show 'Ambil Sendiri' instead of courier name for pickup orders"
```

---

### Task 9: Checkout success page — pickup-aware copy

**Files:**
- Modify: `app/(root)/checkout/success/page.tsx`

- [ ] **Step 1: Fetch `shipping_courier` alongside the existing fields**

Replace:

```ts
    const { data } = await admin
      .from("ecom_orders")
      .select("order_number, customer_email")
      .eq("id", orderId)
      .single();
    orderNumber = (data?.order_number as string) ?? null;
    customerEmail = (data?.customer_email as string) ?? null;
```

with:

```ts
    const { data } = await admin
      .from("ecom_orders")
      .select("order_number, customer_email, shipping_courier")
      .eq("id", orderId)
      .single();
    orderNumber = (data?.order_number as string) ?? null;
    customerEmail = (data?.customer_email as string) ?? null;
    isPickup = data?.shipping_courier === "pickup";
```

Add the `isPickup` variable declaration next to the other two, above the `if (orderId) {` block:

```ts
  let orderNumber: string | null = null;
  let customerEmail: string | null = null;
  let isPickup = false;
```

- [ ] **Step 2: Branch the CTA button label**

Replace:

```tsx
            {orderId && (
              <Link href={`/track/${orderId}`}>
                <Button className="w-full h-12 gap-2">
                  <MapPin className="w-4 h-4" />
                  Track My Order
                </Button>
              </Link>
            )}
```

with:

```tsx
            {orderId && (
              <Link href={`/track/${orderId}`}>
                <Button className="w-full h-12 gap-2">
                  <MapPin className="w-4 h-4" />
                  {isPickup ? "Lihat Info Pengambilan" : "Track My Order"}
                </Button>
              </Link>
            )}
```

- [ ] **Step 3: Branch the bottom tagline**

Replace:

```tsx
          <p className="text-[10px] uppercase tracking-widest text-primary/20 mt-8">
            Your coffee is on its way
          </p>
```

with:

```tsx
          <p className="text-[10px] uppercase tracking-widest text-primary/20 mt-8">
            {isPickup ? "Pesanan siap diambil setelah diproses" : "Your coffee is on its way"}
          </p>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(root)/checkout/success/page.tsx"
git commit -m "feat(checkout): pickup-aware copy on success page"
```

---

### Task 10: Environment variables

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the pickup config block**

Add after the `# ─── Origin / Store info ───...` section:

```
# ─── Self Pickup ──────────────────────────────────────────────────────────────
# Both must be set to show the self-pickup checkout option; leave blank to hide it.
NEXT_PUBLIC_PICKUP_ADDRESS="Jl. Roastery No. 1, Jakarta Selatan"
NEXT_PUBLIC_PICKUP_HOURS="Senin-Sabtu, 09:00-17:00 WIB"
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(env): document self-pickup env vars"
```

---

### Task 11: Full test suite + manual end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `npx vitest run`
Expected: all tests PASS, including all new tests from Tasks 1, 2, 3, and 7.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Set local pickup env vars**

Add to `.env.local`:

```
NEXT_PUBLIC_PICKUP_ADDRESS="Jl. Roastery No. 1, Jakarta Selatan"
NEXT_PUBLIC_PICKUP_HOURS="Senin-Sabtu, 09:00-17:00 WIB"
```

- [ ] **Step 4: Start the dev server and manually walk the pickup flow**

Run: `npm run dev`

In a browser:
1. Add an item to cart, go to `/checkout`.
2. Confirm the "Metode Pengambilan" toggle appears with "Kirim"/"Ambil Sendiri" options.
3. Select "Ambil Sendiri" — confirm the address/postal-code/map step disappears, the pickup location card shows the env-configured address and hours, the bottom bar shows "Gratis (Ambil Sendiri)" for shipping, and the submit button is enabled without picking a shipping rate.
4. Fill in name/phone (+ email if guest) and submit. Confirm it reaches the QR payment page without the `INVALID_SHIPPING_COST` error.
5. Complete payment (or manually flip `payment_status`/`status` in Supabase to simulate the Pivot webhook if testing the QR flow end-to-end isn't practical locally).
6. Visit `/checkout/success?order=<id>` — confirm the CTA reads "Lihat Info Pengambilan" and the tagline reads "Pesanan siap diambil setelah diproses".
7. Visit `/track/<id>` — confirm it shows the pickup location/hours card, no "Kurir: PICKUP" row, and no tracking timeline.
8. Log in and visit `/orders/<id>` — confirm it shows the "Ambil Sendiri" card (not "Info Pengiriman"/"Alamat Pengiriman"), and that the status badge renders correctly if you manually set `status` to `ready_for_pickup` or `completed` in Supabase.
9. Check the configured Telegram chat — confirm the new-order alert shows "Kurir: Ambil Sendiri" instead of "Kurir: PICKUP".
10. Check the customer's inbox (or Resend logs) — confirm the confirmation email shows "Pickup" instead of "Shipping (...)", "Pickup at" instead of "Shipping to", and "Lihat Info Pengambilan →" as the CTA.
11. Repeat steps 1-2 with "Kirim" selected instead, to confirm the existing delivery flow still works unchanged (shipping rates load, address/map step shows, submit still requires a selected rate).

- [ ] **Step 5: Report results**

Note any deviations from the expected behavior above before considering this plan complete.

---

## Out of scope (external dependencies, not part of this plan)

- Ops admin panel (separate repo) needs a small update to recognize/offer the `ready_for_pickup` and `completed` status values in its own status dropdown/logic. Flag to the ops-panel maintainer once this plan ships.
- `app/api/webhooks/pivot/route.ts` needs **no change**. Its fire-and-forget `createBiteshipDraft(orderId)` call already early-returns without throwing when `shipping_service` is null (see `lib/biteship/createDraft.ts`), which pickup orders always have — so the webhook's `.catch()` never fires and no false "BITESHIP GAGAL" Telegram alert is sent for pickup orders. Verified by reading both files during spec review; do not add a guard here, it would be redundant.
