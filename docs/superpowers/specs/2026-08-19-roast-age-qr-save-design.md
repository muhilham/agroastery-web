# Roast Age QR Save — Design

**Date:** 2026-08-19
**Status:** Approved (design)
**Extends:** `docs/superpowers/specs/2026-08-18-roast-age-page-design.md`

## Summary

Add a "Save QR" button to the `/roast-age` page that opens a dialog showing a QR code encoding the current full URL (with all query params: `roast`, `coffee`, `days`). User can screenshot or download the QR as a PNG. Scanning the QR opens the same URL in a browser, restoring all details — no special redirect logic needed (standard QR behavior).

## Requirements

- "Save QR" button next to "Copy link", disabled until roast date set (same gate as Copy)
- Dialog (reuse existing `components/ui/dialog.tsx`) showing:
  - Title "QR Code" or "QR Code — {coffee name}" when coffee name set
  - Description text
  - QR rendering the absolute current URL via `react-qr-code` (already a dependency, used in konsultasi/checkout)
  - The encoded URL shown below QR as small monospace text
  - "Download PNG" button
- Download PNG: client-side SVG→canvas→PNG conversion, filename `roast-age.png`
- No new dependencies

## Approach

Client-side only. QR encodes `window.location.href` (absolute URL — scanner opens it directly with all params intact). Download converts the rendered SVG to PNG via canvas at 2x size (512px) for crisp output.

## Architecture

### Files

| File | Purpose |
|---|---|
| `components/roast-age/index.tsx` | Add "Save QR" button, dialog, download logic to existing component |
| `components/roast-age/index.test.tsx` | Append tests for button state, dialog content, download |

### Component additions

- "Save QR" button in the form row (alongside "Copy link"), `disabled={!roast}`, `aria-live` for consistency
- Dialog state: `const [qrOpen, setQrOpen] = useState(false)`
- QR: `<QRCode value={window.location.href} size={256} />` inside `DialogContent`
- Encoded URL text below QR: small, monospace, `break-all` so full URL visible/wraps
- Download button in `DialogFooter`: converts SVG→PNG (see below), triggers download

### Download PNG conversion

- Ref the QR's container, query the `<svg>` element
- `XMLSerializer().serializeToString(svg)` → string
- Create `<canvas>` at 512×512 (2x for crispness), get 2D context
- Draw via `ctx.drawImage` won't work for SVG string — use `Image` with `data:image/svg+xml;base64,...` src, then `drawImage(img, 0, 0, 512, 512)`
- `canvas.toDataURL("image/png")` → temporary `<a>` with `download="roast-age.png"`, `click()` to download
- Wrap in try/catch: on failure, leave dialog open, no crash

## UI / Styling

- Dialog uses existing dark theme (bg `#1A1A1A`, cream text via `text-primary`)
- QR centered, white background padding around it (QR needs light background for scanning reliability): `bg-white p-4 rounded-lg`
- Download button: `bg-foreground text-background` (matches Copy button)
- Encoded URL: `text-xs text-white/40 font-mono break-all`

## Error Handling & Edge Cases

- `window.location.href` used directly — correct in dev (localhost) and prod (real domain)
- Canvas/SVG conversion failure → caught, no crash, dialog stays usable
- Button disabled state matches Copy link gate
- Dialog closes via Radix's built-in close (X button, overlay click, Esc)

## Testing

Vitest + jsdom + RTL (run via `pnpm test`):

- Button disabled when no roast date, enabled when roast set
- Dialog opens on click → QR rendered (assert `react-qr-code` SVG present), encoded URL text shown
- Download button: stub `HTMLCanvasElement.prototype.toDataURL` (jsdom lacks real canvas), stub `HTMLAnchorElement.prototype.click`, assert click invoked with `download="roast-age.png"` attribute
- Coffee name in dialog title when set

## Out of Scope

- Server-side QR generation
- Custom QR styling/logos
- Analytics on QR save/download
- PDF/vector export
