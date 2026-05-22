# Download QRIS Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Download QR" button to the QRIS payment page that saves the rendered QR code as a PNG image.

**Architecture:** Canvas-based client-side download — serialize the `react-qr-code` SVG, draw it onto an HTML canvas with a white background, and trigger a PNG download via `canvas.toDataURL("image/png")`. Single file change, no server modifications.

**Tech Stack:** React, Next.js, TypeScript, Tailwind CSS, `lucide-react`, `react-qr-code`, Vitest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx` | Modify | Add download button and `handleDownload` callback |
| `app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx` | Modify | Add test for download button rendering and click safety |

---

## Task 1: Add download button to QR payment client

**Files:**
- Modify: `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`

- [ ] **Step 1: Import `Download` icon from `lucide-react`**

Add `Download` to the existing `lucide-react` import on line 10:

```tsx
import { RefreshCw, Loader2, Download } from "lucide-react";
```

- [ ] **Step 2: Add `qrRef` and `handleDownload` callback**

Add `qrRef` near the other refs/state in the component (after line 85):

```tsx
const qrRef = useRef<HTMLDivElement>(null);

const handleDownload = useCallback(() => {
  const svg = qrRef.current?.querySelector("svg");
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width * 2; // retina scale for crisp image
    canvas.height = img.height * 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const a = document.createElement("a");
    a.download = `qris-${orderNumber}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
}, [orderNumber]);
```

- [ ] **Step 3: Attach `ref` to QR code wrapper and add download button**

Wrap the `<QRCode>` element in a `div` with `ref={qrRef}` (replace lines 193-206):

```tsx
{qrString ? (
  <div ref={qrRef} className={`relative transition-opacity duration-300 ${isExpired ? "opacity-30" : "opacity-100"}`}>
    <QRCode value={qrString} size={224} />
    {isExpired && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
        <span className="text-sm font-medium text-gray-600">QR Kedaluwarsa</span>
      </div>
    )}
  </div>
) : (
  <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
    <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
  </div>
)}
```

Add the download button after the QR code wrapper and before the countdown ring (insert after line 210, before `{!isExpired && (`):

```tsx
<Button
  onClick={handleDownload}
  variant="outline"
  size="sm"
  className="mt-2"
>
  <Download className="w-4 h-4 mr-2" />
  Download QR
</Button>
```

- [ ] **Step 4: Verify the file compiles**

Run:
```bash
pnpm tsc --noEmit --skipLibCheck
```

Expected: No errors in `qr-payment-client.tsx`.

- [ ] **Step 5: Commit**

```bash
git add app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx
git commit -m "feat: add download QR button to payment page"
```

---

## Task 2: Add test for download button

**Files:**
- Modify: `app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx`

- [ ] **Step 1: Add test for download button rendering**

Add a new `describe` block at the end of the test file (after line 115):

```tsx
describe("QrPaymentClient — download button", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    mockFetch({ payment_status: "pending_payment" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the download QR button", () => {
    render(<QrPaymentClient {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /download qr/i })
    ).toBeDefined();
  });

  it("clicking download QR does not throw when SVG is absent", () => {
    render(<QrPaymentClient {...defaultProps} />);

    const button = screen.getByRole("button", { name: /download qr/i });
    expect(() => fireEvent.click(button)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
pnpm test app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx
```

Expected: All tests pass, including the new ones.

- [ ] **Step 3: Commit**

```bash
git add app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx
git commit -m "test: add tests for download QR button"
```

---

## Spec Coverage Checklist

| Spec Requirement | Plan Task | Step |
|------------------|-----------|------|
| Add "Download QR" button below QR code | Task 1 | Step 3 |
| Canvas-based PNG download | Task 1 | Step 2 |
| White background on downloaded image | Task 1 | Step 2 |
| Filename: `qris-{orderNumber}.png` | Task 1 | Step 2 |
| Button style: outline, sm, icon + text | Task 1 | Step 3 |
| Works after QR refresh | N/A | Implicit — uses current SVG in DOM |
| Tests for button rendering | Task 2 | Step 1 |

---

## Self-Review

- **Placeholder scan:** No TBD, TODO, or vague steps. All code is provided inline.
- **Type consistency:** `qrRef` is `useRef<HTMLDivElement>(null)`, matching the wrapper `<div>`. `handleDownload` dependency array uses `orderNumber` (string), consistent with Props interface.
- **No breaking changes:** Existing countdown, refresh, polling, and simulate button behavior is untouched.
