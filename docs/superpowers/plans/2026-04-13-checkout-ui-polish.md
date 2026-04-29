# Checkout UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 9 targeted UI improvements to the `/checkout` flow — visual hierarchy, address card picker, QR countdown ring, bottom bar polish, success page animation, and more.

**Architecture:** Pure UI/visual edits to 3 existing files (`app/(root)/checkout/page.tsx`, `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`, `app/(root)/checkout/success/page.tsx`). No new API routes, no schema changes, no new dependencies.

**Tech Stack:** React, Tailwind CSS 3, `tailwindcss-animate`, Lucide icons, inline SVG for countdown ring.

---

## Files Modified

- `app/(root)/checkout/page.tsx` — Tasks 1–6
- `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx` — Tasks 7–8
- `app/(root)/checkout/success/page.tsx` — Task 9

---

## Task 1: Section step numbers + card wrappers

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**What:** Replace the three plain `<h2 className="text-primary font-medium">` section headers with numbered step indicators. Wrap each section's form fields in a dark card (`bg-[#1a1a1a] rounded-xl border border-white/10 p-4`) matching the cart summary card pattern already in the file.

- [ ] **Step 1: Replace the three section headers with numbered step headers**

In `app/(root)/checkout/page.tsx`, find and replace:

```tsx
// FIND (line ~361):
<h2 className="text-primary font-medium">Data Penerima</h2>

// REPLACE WITH:
<div className="flex items-center gap-3">
  <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
  <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Data Penerima</h2>
</div>
```

```tsx
// FIND (line ~405):
<h2 className="text-primary font-medium pt-2">Alamat Pengiriman</h2>

// REPLACE WITH:
<div className="flex items-center gap-3 pt-2">
  <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
  <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Alamat Pengiriman</h2>
</div>
```

```tsx
// FIND (line ~535):
<h2 className="text-primary font-medium">Opsi Pengiriman</h2>

// REPLACE WITH:
<div className="flex items-center gap-3">
  <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
  <h2 className="text-primary font-semibold tracking-widest uppercase text-xs">Opsi Pengiriman</h2>
</div>
```

- [ ] **Step 2: Wrap Data Penerima fields in a card**

The Data Penerima section contains: the step header + fullName + phone + email fields. Wrap them:

```tsx
// FIND the section starting at the step header for Data Penerima, ending before the Alamat Pengiriman step header
// Wrap the entire Data Penerima section (including the step header and its fields) in:
<div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
  {/* step header + fullName + phone + email fields */}
</div>
```

- [ ] **Step 3: Wrap Alamat Pengiriman fields in a card**

Wrap the Alamat section (from step header 2 down through `<LocationDisplay ... />`) in:

```tsx
<div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
  {/* step header 2 + address selector + form fields + map button + location display */}
</div>
```

- [ ] **Step 4: Wrap Opsi Pengiriman in a card**

Wrap the shipping section (the `{shippingRates.length > 0 && ...}` block) in:

```tsx
<div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-3">
  {/* step header 3 + RadioGroup */}
</div>
```

- [ ] **Step 5: Verify the form still renders, step numbers are visible, and the `space-y-4` on the `<form>` holds the cards apart cleanly. Commit.**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): add numbered step headers and section card wrappers"
```

---

## Task 2: Skeleton loading state

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**What:** Replace the lone `<LoaderCircle>` spinner in the hydration guard with a skeleton that mimics the real page layout.

- [ ] **Step 1: Replace the hydration loading return block**

Find the block (lines ~295–304):

```tsx
if (!hydrated) {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center">
        <LoaderCircle className="animate-spin w-8 h-8 text-primary" />
      </main>
    </div>
  );
}
```

Replace with:

```tsx
if (!hydrated) {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 px-4 tablet:px-10 desktop:px-20">
        <div className="h-6 w-24 bg-white/10 rounded-lg mb-6 mt-4 animate-pulse" />
        {/* Cart summary skeleton */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-6 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-lg bg-white/10 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
              </div>
              <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Form skeleton */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
              <div className="h-12 bg-white/10 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the skeleton renders on page load (temporarily set `hydrated` default to false in useCart to test, then revert). Commit.**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): replace spinner with layout-matching skeleton"
```

---

## Task 3: Address card picker

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**What:** Replace the native `<select>` element (lines ~408–426) with horizontally-scrollable address cards. The "new address" option becomes a dashed card at the end.

- [ ] **Step 1: Replace the `<select>` block with card-based picker**

Find and remove the entire block:

```tsx
{user && !isLoadingAddresses && addresses.length > 0 && (
  <div className="space-y-1">
    <label htmlFor="saved-address-select" className="text-sm font-medium text-white">Pilih Alamat</label>
    <select
      id="saved-address-select"
      value={selectedAddressId ?? ""}
      onChange={(e) => handleAddressSelect(e.target.value)}
      className="flex h-12 w-full rounded-xl bg-[#242424] border border-white/10 px-3 py-1 text-sm text-[#CCC4A9]/80 shadow-sm transition-colors focus:outline-none appearance-none"
    >
      {addresses.map((addr) => (
        <option key={addr.id} value={addr.id}>
          {addr.label ? `${addr.label} — ${addr.recipient_name}` : addr.recipient_name}
          {addr.is_default ? " (Utama)" : ""}
        </option>
      ))}
      <option value="new">+ Alamat baru</option>
    </select>
  </div>
)}
```

Replace with:

```tsx
{user && !isLoadingAddresses && addresses.length > 0 && (
  <div className="space-y-2">
    <label className="text-sm font-medium text-white">Pilih Alamat</label>
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
      {addresses.map((addr) => (
        <button
          key={addr.id}
          type="button"
          onClick={() => handleAddressSelect(addr.id)}
          className={`flex-shrink-0 w-44 rounded-xl border-2 p-3 text-left transition-colors ${
            selectedAddressId === addr.id
              ? "border-primary bg-primary/10"
              : "border-white/10 bg-[#242424] active:bg-[#2a2a2a]"
          }`}
        >
          {(addr.label || addr.is_default) && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70 mb-1 truncate">
              {addr.label ?? ""}
              {addr.is_default ? (addr.label ? " · Utama" : "Utama") : ""}
            </p>
          )}
          <p className="text-xs font-medium text-[#CCC4A9] line-clamp-1">{addr.recipient_name}</p>
          <p className="text-[11px] text-[#CCC4A9]/50 line-clamp-2 mt-0.5 leading-tight">{addr.address_line}</p>
        </button>
      ))}
      <button
        type="button"
        onClick={() => handleAddressSelect("new")}
        className={`flex-shrink-0 w-36 rounded-xl border-2 border-dashed p-3 flex flex-col items-center justify-center gap-1 transition-colors ${
          selectedAddressId === "new"
            ? "border-primary/50 bg-primary/5"
            : "border-white/15 bg-transparent active:bg-white/5"
        }`}
      >
        <span className="text-primary text-xl leading-none font-light">+</span>
        <span className="text-xs text-[#CCC4A9]/50">Alamat baru</span>
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verify address cards render, tapping one fills the form, "Alamat baru" card toggles to new-address form. Commit.**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): replace native select with card-based address picker"
```

---

## Task 4: Shipping card polish

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**What:** Add a left accent bar to selected shipping cards, style the carrier name as a pill badge, and make ETA more prominent.

- [ ] **Step 1: Update the shipping RadioGroup label markup**

Find the `<FormLabel>` inside the shipping `shippingRates.map()` block (lines ~551–565):

```tsx
<FormLabel
  htmlFor={key}
  className={`flex items-center justify-between gap-3 p-3 tablet:p-4 rounded-lg border-2 cursor-pointer transition-colors min-h-[3.5rem] ${
    selectedShipping?.code === rate.code
      ? "border-primary bg-primary/10"
      : "border-transparent bg-white/5 active:bg-white/10"
  }`}
>
  <div className="flex flex-col min-w-0">
    <span className="uppercase text-sm font-medium truncate">{rate.carrier} {rate.service}</span>
    <span className="text-xs text-secondary">Estimasi {rate.eta || "N/A"}</span>
  </div>
  <span className="text-sm font-semibold shrink-0">{numberToIdr({ nominal: rate.price })}</span>
</FormLabel>
```

Replace with:

```tsx
<FormLabel
  htmlFor={key}
  className={`flex items-center justify-between gap-3 p-3 tablet:p-4 rounded-lg border cursor-pointer transition-all min-h-[3.5rem] relative overflow-hidden ${
    selectedShipping?.code === rate.code
      ? "border-primary/40 bg-primary/10"
      : "border-white/10 bg-[#1e1e1e] active:bg-white/5"
  }`}
>
  {selectedShipping?.code === rate.code && (
    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
  )}
  <div className="flex flex-col min-w-0 gap-1">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 rounded px-1.5 py-0.5 text-[#CCC4A9]/70 shrink-0">
        {rate.carrier}
      </span>
      <span className="text-sm font-medium text-primary truncate">{rate.service}</span>
    </div>
    <span className="text-xs text-secondary">Tiba {rate.eta || "N/A"}</span>
  </div>
  <span className="text-sm font-semibold shrink-0 text-primary">{numberToIdr({ nominal: rate.price })}</span>
</FormLabel>
```

- [ ] **Step 2: Verify shipping cards display correctly when rates load, left accent appears on selection. Commit.**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): polish shipping option cards with accent bar and carrier badge"
```

---

## Task 5: Map toggle button polish

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**What:** Give the "Buka Peta" button a MapPin icon, hover state, and consistent dark styling.

- [ ] **Step 1: Add `MapPin` to lucide imports**

At the top of the file, find:

```tsx
import { LoaderCircle, ShoppingBag } from "lucide-react";
```

Replace with:

```tsx
import { LoaderCircle, MapPin, ShoppingBag } from "lucide-react";
```

- [ ] **Step 2: Replace the map toggle button**

Find:

```tsx
<button
  type="button"
  onClick={() => setShowMap(true)}
  className="w-full h-[60px] rounded-lg border border-white/10 bg-white/5 text-secondary text-sm hover:bg-white/10 active:bg-white/15 transition-colors"
>
  Buka Peta untuk Pilih Lokasi
</button>
```

Replace with:

```tsx
<button
  type="button"
  onClick={() => setShowMap(true)}
  className="w-full h-[60px] rounded-xl border border-white/10 bg-[#1e1e1e] hover:bg-[#242424] active:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2.5 group"
>
  <MapPin className="w-4 h-4 text-primary/50 group-hover:text-primary/80 transition-colors" />
  <span className="text-sm text-[#CCC4A9]/60 group-hover:text-[#CCC4A9]/80 transition-colors">
    Pilih Lokasi di Peta
  </span>
  <span className="text-[10px] text-[#CCC4A9]/25">(Opsional)</span>
</button>
```

- [ ] **Step 3: Verify the button renders with the pin icon and hover effect. Commit.**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): polish map toggle button with icon and hover state"
```

---

## Task 6: Bottom bar — backdrop-blur + gradient fade

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

**What:** Add a gradient fade above the fixed bottom bar and apply `backdrop-blur-md` so it feels layered rather than flat.

- [ ] **Step 1: Replace the fixed bottom div wrapper**

Find (lines ~600–601):

```tsx
<div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-border/50 px-4 pt-3 tablet:px-10 desktop:px-20 z-30"
  style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
```

Replace with a two-layer structure:

```tsx
<div className="fixed bottom-0 left-0 right-0 z-30">
  {/* Gradient fade from transparent to background */}
  <div className="h-8 bg-gradient-to-b from-transparent to-[#141414] pointer-events-none" />
  <div
    className="bg-[#141414]/90 backdrop-blur-md border-t border-white/10 px-4 pt-3 tablet:px-10 desktop:px-20"
    style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
  >
```

Close the two new divs at the end of the fixed bar (after the `</Button>` closing tag):

```tsx
  </div>
</div>
```

- [ ] **Step 2: Verify the bottom bar shows gradient fade above it and has blur effect on dark background. Commit.**

```bash
git add app/\(root\)/checkout/page.tsx
git commit -m "feat(checkout): add backdrop-blur and gradient fade to fixed bottom bar"
```

---

## Task 7: QR countdown ring + pulse indicator + payment steps

**Files:**
- Modify: `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`

**What:** Replace the plain `Berlaku MM:SS` text with an SVG ring countdown that changes color (green → yellow → red). Add 3-dot pulse indicator below the QR. Add a compact 3-step instruction row above the QR card.

- [ ] **Step 1: Add `CountdownRing` component and `totalSeconds` state**

At the top of `qr-payment-client.tsx`, after the existing `useCountdown` hook, add the `CountdownRing` component and update the hook to also track `totalSeconds`:

```tsx
function CountdownRing({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);
  const color =
    secondsLeft > 60 ? "#86efac" : secondsLeft > 20 ? "#fde047" : "#f87171";
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
        />
      </svg>
      <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
        {mm}:{ss}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Add `totalSeconds` state to `QrPaymentClient`**

Inside `QrPaymentClient`, after the existing `useState` declarations, add:

```tsx
const [totalSeconds, setTotalSeconds] = useState(() =>
  Math.max(1, Math.floor((new Date(initialQrExpiresAt).getTime() - Date.now()) / 1000))
);
```

- [ ] **Step 3: Update `handleRefresh` to reset `totalSeconds`**

Inside `handleRefresh`, after `setQrExpiresAt(data.qrExpiresAt)`, add:

```tsx
setTotalSeconds(
  Math.max(1, Math.floor((new Date(data.qrExpiresAt).getTime() - Date.now()) / 1000))
);
```

- [ ] **Step 4: Add the 3-step instruction row above the QR card**

Find the text `<h1 className="text-xl font-semibold text-primary mb-1">Scan QR untuk Membayar</h1>` block. After the `<p>` tag below it and before the `<div className="bg-white rounded-2xl ...">`, add:

```tsx
{/* Payment steps */}
<div className="grid grid-cols-3 gap-2 my-4">
  {[
    { n: "1", text: "Buka aplikasi bank atau e-wallet" },
    { n: "2", text: "Scan QR code ini" },
    { n: "3", text: "Konfirmasi pembayaran" },
  ].map((step) => (
    <div key={step.n} className="flex flex-col items-center gap-1.5 text-center">
      <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white/60 text-[10px] font-bold flex items-center justify-center">
        {step.n}
      </div>
      <p className="text-[10px] text-[#CCC4A9]/40 leading-tight">{step.text}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 5: Replace the text countdown with `CountdownRing` and add pulse dots**

Find inside the `bg-white rounded-2xl` card:

```tsx
{!isExpired && (
  <p className="text-sm text-secondary">
    Berlaku {formatCountdown(secondsLeft)}
  </p>
)}
```

Replace with:

```tsx
{!isExpired && (
  <CountdownRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
)}
```

Also find:

```tsx
<p className="text-xs text-secondary text-center">
  Gunakan aplikasi perbankan atau dompet digital yang mendukung QRIS
</p>
```

Replace with:

```tsx
<p className="text-xs text-secondary text-center">
  Mendukung QRIS — GoPay, OVO, Dana, dan semua bank
</p>
```

- [ ] **Step 6: Add pulsing dots to the "waiting" section below the card**

Find:

```tsx
<p className="text-xs text-secondary mb-3">
  Menunggu konfirmasi pembayaran...
</p>
```

Replace with:

```tsx
<div className="flex flex-col items-center gap-2 mb-3">
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
        style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1.2s" }}
      />
    ))}
  </div>
  <p className="text-xs text-secondary">Menunggu konfirmasi pembayaran...</p>
</div>
```

- [ ] **Step 7: Remove unused `formatCountdown` function** (it was only used for the text countdown — `CountdownRing` computes its own display inline). Delete lines:

```tsx
const formatCountdown = (s: number) => {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};
```

- [ ] **Step 8: Verify countdown ring animates correctly and pulse dots show. Commit.**

```bash
git add app/\(root\)/checkout/payment/\[orderId\]/qr-payment-client.tsx
git commit -m "feat(payment): add SVG countdown ring, payment steps, and pulse indicator"
```

---

## Task 8: QR refresh button — always visible, dimmed until threshold

**Files:**
- Modify: `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`

**What:** Show the refresh button at all times. Dim it (`opacity-30 cursor-not-allowed`) while `secondsLeft >= 30` so users know it's coming. Remove the conditional render.

- [ ] **Step 1: Replace the conditional refresh button block**

Find:

```tsx
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
```

Replace with:

```tsx
<Button
  onClick={handleRefresh}
  disabled={isRefreshing || secondsLeft >= 30}
  variant="outline"
  className={`w-full transition-opacity duration-300 ${
    secondsLeft >= 30 ? "opacity-30" : "opacity-100"
  }`}
>
  {isRefreshing ? (
    <Loader2 className="animate-spin w-4 h-4 mr-2" />
  ) : (
    <RefreshCw className="w-4 h-4 mr-2" />
  )}
  {isRefreshing ? "Memperbarui..." : "Perbarui QR"}
</Button>
```

- [ ] **Step 2: Verify the button is always rendered, dimmed when secondsLeft >= 30, fully visible when < 30. Commit.**

```bash
git add app/\(root\)/checkout/payment/\[orderId\]/qr-payment-client.tsx
git commit -m "feat(payment): always show refresh button, dim until 30s threshold"
```

---

## Task 9: Success page — staggered animation + brand moment

**Files:**
- Modify: `app/(root)/checkout/success/page.tsx`

**What:** Replace the plain icon + heading + buttons layout with staggered `animate-in` reveals, a branded circle icon treatment, and a warm coffee-brand confirmation line.

- [ ] **Step 1: Rewrite `SuccessContent`**

Replace the entire `SuccessContent` function body with:

```tsx
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const status = searchParams.get("status");
  const isPending = status === "pending";

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">

          {/* Icon — staggered zoom-in */}
          <div className="animate-in zoom-in-50 fade-in duration-500 mb-6">
            {isPending ? (
              <div className="w-20 h-20 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto">
                <svg
                  className="w-9 h-9 text-yellow-400"
                  style={{ animation: "spin 3s linear infinite" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <svg
                  className="w-9 h-9 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>

          {/* Heading — slide up after icon */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <h1 className="text-2xl font-semibold text-primary mb-3 tracking-wide">
              {isPending ? "Menunggu Pembayaran" : "Pesanan Diterima!"}
            </h1>
            <p className="text-secondary text-sm leading-relaxed mb-2">
              {isPending
                ? "Pembayaran kamu sedang diproses. Kami akan mengirim konfirmasi setelah pembayaran diterima."
                : "Terima kasih sudah memesan dari Agroastery."}
            </p>
            {!isPending && (
              <p className="text-primary/50 text-xs tracking-widest uppercase mt-3">
                Kopi dalam perjalanan ke tanganmu
              </p>
            )}
          </div>

          {/* Buttons — slide up last */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3 mt-8"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            {orderId && (
              <Link href={`/orders/${orderId}`}>
                <Button className="w-full" variant="outline">
                  Lihat Detail Pesanan
                </Button>
              </Link>
            )}
            <Link href="/katalog">
              <Button className="w-full">Lanjut Belanja</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Remove unused `CheckCircle` and `Clock` lucide imports**

Find:

```tsx
import { CheckCircle, Clock } from "lucide-react";
```

Delete this line (the icons are replaced with inline SVGs).

- [ ] **Step 3: Verify success page shows staggered animation — icon appears first, then heading, then buttons. Verify pending state shows clock icon. Commit.**

```bash
git add app/\(root\)/checkout/success/page.tsx
git commit -m "feat(checkout): staggered success page animation with brand copy"
```

---

## Self-Review Checklist

- [x] All 9 audit items covered across Tasks 1–9
- [x] No `TBD` or `TODO` placeholders in any task
- [x] `totalSeconds` state is defined before `CountdownRing` is referenced (Task 7)
- [x] `MapPin` import added before use (Task 5)
- [x] `formatCountdown` deletion noted after its replacement (Task 7)
- [x] Unused `CheckCircle`/`Clock` imports removed (Task 9)
- [x] All closing divs accounted for in Task 6 bottom bar restructure
- [x] `no-scrollbar` class already defined in `globals.css` — safe to use in Task 3
