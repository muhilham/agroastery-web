# Download QRIS Button — Design Spec

**Date:** 2026-05-22  
**Topic:** Add a download button to the QRIS payment page so users can save the QR code as a PNG image.  
**Status:** Approved for implementation

---

## Overview

On the checkout payment page (`/checkout/payment/[orderId]`), users are presented with a QRIS QR code to scan for payment. Some users may want to download the QR code image to share with someone else (e.g., ask a family member to pay) or to save for later reference. This feature adds a compact **"Download QR"** button below the QR code that saves the rendered QR code as a PNG file.

---

## Goals

- Allow users to download the QRIS QR code as a PNG image
- Keep the UI clean — download is a secondary action, not competing with the primary "scan to pay" flow
- Work entirely client-side (no server round-trip needed)
- Maintain existing behavior for QR rendering, countdown, refresh, and polling

---

## Non-Goals

- No server-side QR image generation
- No PDF or SVG download option
- No watermark, branding overlay, or additional info baked into the image
- No batch/multi-order download

---

## User Flow

1. User lands on `/checkout/payment/[orderId]` and sees the QRIS QR code
2. User clicks the **"Download QR"** button below the QR code
3. Browser triggers a download of `qris-{orderNumber}.png`
4. User can share or save the image as needed

---

## UI / Frontend Design

### Placement

The download button sits between the QR code and the countdown/refresh section, inside the white card container.

```
┌─────────────────────────────┐
│        QR Code (224px)      │
│                             │
├─────────────────────────────┤
│   [↓ Download QR]           │  ← new button, compact
├─────────────────────────────┤
│   [Countdown Ring]          │
│   [Perbarui QR]             │
└─────────────────────────────┘
```

### Button Style

- **Variant:** `outline`
- **Size:** `sm` (compact, not full-width)
- **Content:** `Download` icon from `lucide-react` + text `"Download QR"`
- **Alignment:** centered within the card
- **Disabled state:** same as other buttons — no special disabled state needed since the QR is always present when shown

### File Naming

The downloaded file should be named: `qris-{orderNumber}.png`  
Example: `qris-AGR-20260522-001.png`

---

## Technical Design

### Approach: Canvas-based PNG Download (Approach A)

Since the QR code is rendered with `react-qr-code` as an SVG, we convert it to a canvas element, draw it to a canvas with a white background (so the transparent QR isn't invisible on dark backgrounds), and trigger a download via `canvas.toDataURL("image/png")`.

#### Implementation Steps

1. **Add a ref** to the `<QRCode>` component wrapper so we can access the underlying SVG DOM node.
2. **Create a download handler** function:
   - Find the SVG element via the ref
   - Serialize the SVG to a string
   - Create an `<img>` element, set its `src` to `data:image/svg+xml;base64,...`
   - Draw the image onto a `<canvas>` with a white background fill
   - Trigger download via an `<a>` tag with `download` attribute
3. **Add the button** to the JSX below the QR code, inside the white card.

#### Code Sketch

```tsx
// In qr-payment-client.tsx
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
    canvas.width = img.width * 2; // retina scale
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

```tsx
{/* JSX addition */}
<div ref={qrRef} className={`relative ...`}>
  <QRCode value={qrString} size={224} />
  ...
</div>

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

---

## Error Handling

- If the SVG element is not found (rare), the handler silently returns — no-op.
- Canvas context failure is silently handled — no-op.
- No user-facing error message needed; failure to download is a browser-level issue the user can retry.

---

## Accessibility

- The button uses a proper `<Button>` component with accessible focus states.
- The download icon + text provides a clear affordance.
- `aria-label` can be added if using icon-only (not the case here).

---

## Testing Plan

- **Manual test:** Click download button, verify PNG file is downloaded with correct filename.
- **Visual regression:** Ensure button doesn't break layout on mobile (`max-w-sm` container).
- **Edge case:** Verify download still works after refreshing the QR (new `qrString`).

---

## Files to Modify

- `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx` — add download button and handler

---

## Open Questions

None. Design approved by user.
