# Roast Age QR Save — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Save QR" button to `/roast-age` that opens a dialog with a QR encoding the current full URL and a download-as-PNG button.

**Architecture:** Client-side only. Reuse existing `components/ui/dialog.tsx` (Radix) and `react-qr-code` (already a dep, used in konsultasi/checkout). QR encodes `window.location.href` — scanning opens the URL with all params intact. PNG download via SVG→Image→canvas→toDataURL.

**Tech Stack:** Next.js 16 App Router, React 19, `react-qr-code`, `@radix-ui/react-dialog`, Vitest + RTL via `pnpm test`.

**Spec:** `docs/superpowers/specs/2026-08-19-roast-age-qr-save-design.md`

**Branch:** `feature/roast-age-qr-save` (worktree `.worktrees/roast-age-qr`)

---

### Task 1: QR save button, dialog, download (TDD)

**Files:**
- Modify: `components/roast-age/index.tsx`
- Test: `components/roast-age/index.test.tsx` (append)

- [ ] **Step 1: Write the failing tests**

Append to `components/roast-age/index.test.tsx`. Add imports at top (merge with existing vitest imports):

```tsx
import { fireEvent, screen, waitFor } from "@testing-library/react";
```

(if `waitFor` not already imported). Append tests inside the existing `describe("RoastAge", ...)` — NOTE: the component was renamed to `RoastAge` in the rename commit; verify the describe block name and the export name by reading the file first. If the export is still `RestingPeriod`, use that; the rename commit f877fc2 renamed the route/folder but check whether the component function name was changed. The plan assumes `RoastAge` — adjust to actual.

Append tests:

```tsx
describe("RoastAge QR save", () => {
  beforeEach(() => {
    mockParams.value = { roast: "2026-08-04" };
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-18T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("Save QR button is disabled when no roast date", () => {
    mockParams.value = {};
    render(<RoastAge />);
    expect(screen.getByRole("button", { name: /save qr/i })).toBeDisabled();
  });

  it("Save QR button is enabled when roast date set", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RoastAge />);
    expect(screen.getByRole("button", { name: /save qr/i })).toBeEnabled();
  });

  it("opens dialog with QR and encoded URL on Save QR click", async () => {
    mockParams.value = { roast: "2026-08-04", coffee: "Toraja" };
    render(<RoastAge />);
    fireEvent.click(screen.getByRole("button", { name: /save qr/i }));
    expect(await screen.findByText(/QR Code — Toraja/i)).toBeInTheDocument();
    // QR renders as an SVG
    expect(document.querySelector("svg")).toBeInTheDocument();
    // encoded URL shown as text
    expect(screen.getByText(/roast=2026-08-04/)).toBeInTheDocument();
  });

  it("dialog title is 'QR Code' when no coffee name", async () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RoastAge />);
    fireEvent.click(screen.getByRole("button", { name: /save qr/i }));
    expect(await screen.findByText(/^QR Code$/i)).toBeInTheDocument();
  });

  it("downloads PNG on Download button click", async () => {
    mockParams.value = { roast: "2026-08-04" };
    const toDataURL = vi.fn().mockReturnValue("data:image/png;base64,FAKE");
    const anchorClick = vi.fn();
    // jsdom lacks real canvas — stub
    vi.stubGlobal("HTMLCanvasElement", {
      ...HTMLCanvasElement,
      prototype: Object.create(HTMLCanvasElement.prototype, {
        toDataURL: { value: toDataURL },
      }),
    });
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const c = origCreate("canvas");
        c.getContext = vi.fn().mockReturnValue({}) as any;
        return c;
      }
      if (tag === "a") {
        const a = origCreate("a");
        a.click = anchorClick;
        return a;
      }
      return origCreate(tag);
    });
    // Image loader: stub to call onload synchronously
    const origImage = global.Image;
    vi.stubGlobal("Image", class {
      onload: (() => void) | null = null;
      set src(_: string) {
        Promise.resolve().then(() => this.onload && this.onload());
      }
      get src() { return ""; }
    });

    render(<RoastAge />);
    fireEvent.click(screen.getByRole("button", { name: /save qr/i }));
    const dlBtn = await screen.findByRole("button", { name: /download png/i });
    fireEvent.click(dlBtn);
    await waitFor(() => expect(anchorClick).toHaveBeenCalled());

    vi.stubGlobal("Image", origImage);
  });
});
```

Note: jsdom canvas/`Image` are limited — the test stubs `HTMLCanvasElement.prototype.toDataURL`, `document.createElement` (to wire `a.click`), and `Image` (synchronous onload). If the synchronous `Image` stub proves flaky (proto setter issues), simplify: assert only that `toDataURL` was called and `anchorClick` fired, without asserting pixel correctness.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — no "Save QR" button, no dialog, no download.

- [ ] **Step 3: Write the implementation**

In `components/roast-age/index.tsx`:

3a. Add imports:

```tsx
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
```

3b. Add state + ref near the other `useState` declarations:

```tsx
const [qrOpen, setQrOpen] = useState(false);
const qrContainerRef = useRef<HTMLDivElement | null>(null);
```

(If `useRef` not imported, add to the react import.)

3c. Add download handler after `handleCopy`:

```tsx
async function handleDownloadPng() {
  try {
    const svg = qrContainerRef.current?.querySelector("svg");
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "roast-age.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
  } catch {
    // no-op — dialog stays open
  }
}
```

3d. Add "Save QR" button next to "Copy link" in the form section. Current markup has the Copy button inside the second row div. Add the Save QR button before it:

```tsx
<button
  type="button"
  onClick={() => setQrOpen(true)}
  disabled={!roast}
  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
>
  Save QR
</button>
<button
  type="button"
  onClick={handleCopy}
  disabled={!roast}
  aria-live="polite"
  className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
>
  {copied ? "Copied!" : "Copy link"}
</button>
```

3e. Add the Dialog at the end of the component's root `<div>` (before closing tag):

```tsx
<Dialog open={qrOpen} onOpenChange={setQrOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {coffeeParam ? `QR Code — ${coffeeParam}` : "QR Code"}
      </DialogTitle>
      <DialogDescription>
        Scan to open this roast-age page with all current details.
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white p-4" ref={qrContainerRef}>
        <QRCode value={typeof window !== "undefined" ? window.location.href : ""} size={256} />
      </div>
      <p className="break-all text-center text-xs text-white/40 font-mono">
        {typeof window !== "undefined" ? window.location.href : ""}
      </p>
    </div>
    <DialogFooter>
      <button
        type="button"
        onClick={handleDownloadPng}
        className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Download PNG
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: index.test.tsx all pass (22 existing + 5 new), date.test.ts 26 pass. Pre-existing failures (3 map-picker + 8 consultations) unchanged.

- [ ] **Step 5: Commit**

```bash
git add components/roast-age/index.tsx components/roast-age/index.test.tsx
git commit -m "feat(roast-age): add QR save dialog with PNG download"
```

---

### Task 2: Verification

- [ ] **Step 1: Lint**

Run: `npx eslint components/roast-age/`
Expected: No issues.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: Succeeds, `/roast-age` still static (○).

- [ ] **Step 3: Commit any fixes**

Only if required:
```bash
git add -A && git commit -m "fix(roast-age): address lint/build findings"
```

---

## Self-Review Notes

- **Spec coverage:** Save QR button disabled gate (Task 1 test), dialog with QR + encoded URL + title (Task 1 test), Download PNG (Task 1 test), reuse dialog + react-qr-code (Task 1 imports), filename `roast-age.png` (Task 1 download handler), no new deps.
- **Consistency:** `coffeeParam` used for title (parsed, display-only value) — matches existing display usage. `window.location.href` for QR value — matches Copy button approach.
- **Test caveats:** jsdom lacks real canvas/Image — stubs documented inline. If synchronous Image onload stub proves flaky, the assertion can degrade to "toDataURL called + anchor.click fired" without pixel correctness. Either is acceptable — the test verifies the download code path runs end-to-end, not that PNG bytes are correct.
- **Naming check:** verify the component export name (`RoastAge` vs `RestingPeriod`) by reading the file before writing tests — the route was renamed in f877fc2 but the component function name may not have been. Use the actual name in test imports.
