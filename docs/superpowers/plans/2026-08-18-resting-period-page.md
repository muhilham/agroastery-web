# Resting Period Helper Page Implementation Plan

> **For agonic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A shareable `/resting-period` page where users enter a roast date and see rest-day milestones (3/7/14/21) and today's rest-day count, with the date encoded in the URL for copying.

**Architecture:** Client-side single page. Server shell exports metadata and wraps a client component in `<Suspense>` (Next.js requirement for `useSearchParams` on static pages). All date math lives in a pure helper module; the URL query param `?roast=YYYY-MM-DD` is the source of truth, updated via `router.replace` (no history spam). "Today" is computed in Asia/Jakarta (WIB) regardless of visitor timezone.

**Tech Stack:** Next.js 16 App Router, React client component, Tailwind (project custom screens `sm`/`md`/`tablet`/`desktop`, dark theme `background` #1a1a1a / `foreground` #f5ebc9), Vitest + @testing-library/react (run via `pnpm test`, never `vitest` directly — it needs the crypto polyfill runner).

**Spec:** `docs/superpowers/specs/2026-08-18-resting-period-page-design.md`

---

### Task 1: Date helpers (pure module, TDD)

**Files:**
- Create: `components/resting-period/date.ts`
- Test: `components/resting-period/date.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `components/resting-period/date.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getTodayWIB,
  isRoastDate,
  diffDays,
  addDays,
  formatDateID,
  milestoneStatus,
} from "./date";

describe("getTodayWIB", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the WIB calendar date when local time is past midnight WIB", () => {
    vi.useFakeTimers();
    // 2026-08-18T20:00:00Z = 2026-08-19 03:00 WIB
    vi.setSystemTime(new Date("2026-08-18T20:00:00Z"));
    expect(getTodayWIB(new Date())).toBe("2026-08-19");
  });

  it("returns the same calendar date during WIB daytime", () => {
    vi.useFakeTimers();
    // 2026-08-18T10:00:00Z = 2026-08-18 17:00 WIB
    vi.setSystemTime(new Date("2026-08-18T10:00:00Z"));
    expect(getTodayWIB(new Date())).toBe("2026-08-18");
  });

  it("is independent of the host machine timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T20:00:00Z"));
    const realTz = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      expect(getTodayWIB(new Date())).toBe("2026-08-19");
    } finally {
      process.env.TZ = realTz;
    }
  });
});

describe("isRoastDate", () => {
  it("accepts a valid YYYY-MM-DD string", () => {
    expect(isRoastDate("2026-08-04")).toBe(true);
  });

  it("rejects non-YYYY-MM-DD formats", () => {
    expect(isRoastDate("04-08-2026")).toBe(false);
    expect(isRoastDate("2026/08/04")).toBe(false);
    expect(isRoastDate("")).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(isRoastDate("2026-02-30")).toBe(false);
    expect(isRoastDate("2026-13-01")).toBe(false);
  });
});

describe("diffDays", () => {
  it("counts calendar days between dates", () => {
    expect(diffDays("2026-08-04", "2026-08-18")).toBe(14);
  });

  it("returns 0 for the same date", () => {
    expect(diffDays("2026-08-04", "2026-08-04")).toBe(0);
  });

  it("returns negative when target is before source", () => {
    expect(diffDays("2026-08-18", "2026-08-04")).toBe(-14);
  });

  it("handles month boundaries", () => {
    expect(diffDays("2026-08-31", "2026-09-01")).toBe(1);
  });
});

describe("addDays", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("adds 3 days to the spec example", () => {
    expect(addDays("2026-08-04", 3)).toBe("2026-08-07");
  });

  it("round-trips with diffDays", () => {
    expect(addDays("2026-08-04", 21)).toBe("2026-08-25");
  });
});

describe("formatDateID", () => {
  it("formats as written-out Indonesian date", () => {
    expect(formatDateID("2026-08-04")).toBe("4 Agustus 2026");
  });

  it("formats the 17th of August correctly", () => {
    expect(formatDateID("2045-08-17")).toBe("17 Agustus 2045");
  });
});

describe("milestoneStatus", () => {
  it("returns today when milestone date equals today", () => {
    expect(milestoneStatus("2026-08-18", "2026-08-18")).toEqual({ kind: "today" });
  });

  it("returns future with day count", () => {
    expect(milestoneStatus("2026-08-25", "2026-08-18")).toEqual({ kind: "future", days: 7 });
  });

  it("returns past with day count", () => {
    expect(milestoneStatus("2026-08-07", "2026-08-18")).toEqual({ kind: "past", days: 11 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- components/resting-period/date.test.ts`
Expected: FAIL — module `./date` does not exist.

- [ ] **Step 3: Write the implementation**

Create `components/resting-period/date.ts`:

```ts
const WIB = "Asia/Jakarta";
const MS_PER_DAY = 86_400_000;

/** Current calendar date in WIB as YYYY-MM-DD, regardless of host timezone. */
export function getTodayWIB(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Strict YYYY-MM-DD validation, including impossible calendar dates. */
export function isRoastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

function toUtcMs(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Calendar-day diff: to minus from. Negative when to is before from. */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** Roast date plus N days, as YYYY-MM-DD. */
export function addDays(value: string, days: number): string {
  return new Date(toUtcMs(value) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Written-out Indonesian date, e.g. "4 Agustus 2026". */
export function formatDateID(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export type MilestoneStatus =
  | { kind: "today" }
  | { kind: "future"; days: number }
  | { kind: "past"; days: number };

/** Status of a milestone date relative to today. */
export function milestoneStatus(milestoneDate: string, today: string): MilestoneStatus {
  const diff = diffDays(today, milestoneDate);
  if (diff === 0) return { kind: "today" };
  if (diff > 0) return { kind: "future", days: diff };
  return { kind: "past", days: -diff };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- components/resting-period/date.test.ts`
Expected: PASS (all tests in file).

- [ ] **Step 5: Commit**

```bash
git add components/resting-period/date.ts components/resting-period/date.test.ts
git commit -m "feat(resting-period): add WIB-aware date helpers"
```

---

### Task 2: RestingPeriod client component (TDD)

**Files:**
- Create: `components/resting-period/index.tsx`
- Test: `components/resting-period/index.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `components/resting-period/index.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestingPeriod } from "./index";

const { mockReplace, mockRoastParam } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRoastParam: { value: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () =>
    new URLSearchParams(mockRoastParam.value ? `roast=${mockRoastParam.value}` : ""),
}));

describe("RestingPeriod", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockRoastParam.value = "";
    vi.useFakeTimers();
    // 2026-08-18T10:00:00Z = 2026-08-18 17:00 WIB
    vi.setSystemTime(new Date("2026-08-18T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state prompting for a roast date when param is absent", () => {
    render(<RestingPeriod />);
    expect(screen.getByText(/enter.*roast date/i)).toBeInTheDocument();
    expect(screen.queryByText(/day 3/i)).not.toBeInTheDocument();
  });

  it("ignores an invalid roast param and shows empty state", () => {
    mockRoastParam.value = "not-a-date";
    render(<RestingPeriod />);
    expect(screen.getByText(/enter.*roast date/i)).toBeInTheDocument();
  });

  it("shows today's day count for a valid roast date", () => {
    mockRoastParam.value = "2026-08-04";
    render(<RestingPeriod />);
    expect(screen.getByText(/today is day 14 since roast on 4 Agustus 2026/i)).toBeInTheDocument();
  });

  it("shows day 0 banner on the roast day itself", () => {
    mockRoastParam.value = "2026-08-18";
    render(<RestingPeriod />);
    expect(screen.getByText(/today is roast day/i)).toBeInTheDocument();
  });

  it("shows not roasted yet for a future roast date", () => {
    mockRoastParam.value = "2026-08-20";
    render(<RestingPeriod />);
    expect(screen.getByText(/not roasted yet/i)).toBeInTheDocument();
  });

  it("renders all four milestones with dates and statuses", () => {
    mockRoastParam.value = "2026-08-04";
    render(<RestingPeriod />);

    const day3 = screen.getByText("Day 3").closest("div");
    expect(day3).toHaveTextContent("7 Agustus 2026");
    expect(day3).toHaveTextContent("11 days ago");

    const day7 = screen.getByText("Day 7").closest("div");
    expect(day7).toHaveTextContent("11 Agustus 2026");
    expect(day7).toHaveTextContent("7 days ago");

    const day14 = screen.getByText("Day 14").closest("div");
    expect(day14).toHaveTextContent("18 Agustus 2026");
    expect(day14).toHaveTextContent("Today");

    const day21 = screen.getByText("Day 21").closest("div");
    expect(day21).toHaveTextContent("25 Agustus 2026");
    expect(day21).toHaveTextContent("In 7 days");
  });

  it("updates the URL param when the date input changes", () => {
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/roast date/i), {
      target: { value: "2026-08-04" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/resting-period/?roast=2026-08-04",
      { scroll: false }
    );
  });

  it("removes the param when the date input is cleared", () => {
    mockRoastParam.value = "2026-08-04";
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/roast date/i), { target: { value: "" } });
    expect(mockReplace).toHaveBeenCalledWith("/resting-period/", { scroll: false });
  });

  it("copies the current URL and shows feedback", async () => {
    mockRoastParam.value = "2026-08-04";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it("shows a readonly URL fallback when the clipboard API fails", async () => {
    mockRoastParam.value = "2026-08-04";
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    const input = await screen.findByLabelText(/copy manually/i);
    expect(input).toHaveValue(window.location.href);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- components/resting-period/index.test.tsx`
Expected: FAIL — module `./index` does not exist.

- [ ] **Step 3: Write the implementation**

Create `components/resting-period/index.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  diffDays,
  formatDateID,
  getTodayWIB,
  isRoastDate,
  milestoneStatus,
  type MilestoneStatus,
} from "./date";

const MILESTONES = [3, 7, 14, 21] as const;

function statusLabel(status: MilestoneStatus): string {
  if (status.kind === "today") return "Today";
  if (status.kind === "future") return `In ${status.days} day${status.days > 1 ? "s" : ""}`;
  return `${status.days} day${status.days > 1 ? "s" : ""} ago`;
}

function statusClass(status: MilestoneStatus): string {
  if (status.kind === "today") return "bg-foreground text-background";
  if (status.kind === "future") return "bg-white/10 text-foreground";
  return "bg-white/5 text-white/40";
}

export function RestingPeriod() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roastParam = searchParams.get("roast");
  const roast = roastParam && isRoastDate(roastParam) ? roastParam : null;

  const [copied, setCopied] = useState(false);
  const [clipboardFailed, setClipboardFailed] = useState(false);

  const today = useMemo(() => getTodayWIB(new Date()), []);
  const dayCount = roast ? diffDays(roast, today) : null;

  function handleRoastChange(value: string) {
    if (!value) {
      router.replace("/resting-period/", { scroll: false });
      return;
    }
    router.replace(`/resting-period/?roast=${value}`, { scroll: false });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setClipboardFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setClipboardFailed(true);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl tablet:text-3xl font-semibold text-foreground">
          Resting Period
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Track how long your coffee has been resting since roast day.
        </p>
      </header>

      <section className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="roast-date"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Roast date
          </label>
          <input
            id="roast-date"
            type="date"
            value={roast ?? ""}
            max="2100-12-31"
            onChange={(e) => handleRoastChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground [color-scheme:dark] focus:border-foreground focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!roast}
          className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </section>

      {clipboardFailed && (
        <div className="mb-8">
          <label
            htmlFor="copy-manually"
            className="mb-2 block text-sm text-white/60"
          >
            Copy manually
          </label>
          <input
            id="copy-manually"
            type="text"
            readOnly
            value={typeof window !== "undefined" ? window.location.href : ""}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-foreground"
          />
        </div>
      )}

      {!roast ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
          Enter your roast date above to see the resting milestones.
        </p>
      ) : (
        <>
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            {dayCount !== null && dayCount < 0 ? (
              <>
                <p className="text-sm uppercase tracking-wide text-white/40">
                  Not roasted yet
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  Roast on {formatDateID(roast)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm uppercase tracking-wide text-white/40">
                  {dayCount === 0 ? "Today is roast day" : `Today is day ${dayCount} since roast`}
                </p>
                <p className="mt-2 text-5xl font-bold text-foreground">
                  Day {dayCount}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Roasted on {formatDateID(roast)}
                </p>
              </>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {MILESTONES.map((day) => {
              const date = addDays(roast, day);
              const status = milestoneStatus(date, today);
              return (
                <div
                  key={day}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60">Day {day}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}
                    >
                      {statusLabel(status)}
                    </span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatDateID(date)}
                  </p>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
```

Note on the `today is day 14` test: with system time fixed at 2026-08-18 17:00 WIB and roast `2026-08-04`, `diffDays` = 14, so the banner renders "Today is day 14 since roast" plus "Roasted on 4 Agustus 2026". The regex `/today is day 14 since roast on 4 Agustus 2026/i` matches across the two text nodes because Testing Library's `getByText` normalizes whitespace across nested elements — if this test fails due to text node splitting, query the section container and assert with `toHaveTextContent` instead:

```tsx
expect(screen.getByText(/today is day 14/i).closest("section")).toHaveTextContent(
  "Roasted on 4 Agustus 2026"
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- components/resting-period/index.test.tsx`
Expected: PASS (all tests in file).

- [ ] **Step 5: Commit**

```bash
git add components/resting-period/index.tsx components/resting-period/index.test.tsx
git commit -m "feat(resting-period): add RestingPeriod client component"
```

---

### Task 3: Page route and footer link

**Files:**
- Create: `app/(root)/resting-period/page.tsx`
- Modify: `constant/menu-list.ts` (footer array, lines 22-29)
- Modify: `components/ui/footer.tsx` (link rendering, lines 10-20)

- [ ] **Step 1: Create the page**

Create `app/(root)/resting-period/page.tsx` (follows the pattern of `app/(root)/konsultasi/page.tsx`):

```tsx
import { Suspense } from "react";
import Navigation from "@/components/navigation";
import { RestingPeriod } from "@/components/resting-period";

export const metadata = {
  title: "Resting Period — Agroastery",
  description:
    "Track your coffee's resting period: see days 3, 7, 14, and 21 after roast, and which rest day today is.",
};

export default function RestingPeriodPage() {
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-16 px-4 tablet:px-10 desktop:px-20">
        <Suspense fallback={null}>
          <RestingPeriod />
        </Suspense>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add the footer link entry**

In `constant/menu-list.ts`, append to the `footer` array (after the Tiktok entry):

```ts
export const footer: I_FooterInterface[] = [
  {
    href: "https://api.whatsapp.com/send?phone=628979092726",
    label: "WhatsApp",
  },
  { href: "https://t.me/agroastery", label: "Telegram" },
  { href: "https://www.instagram.com/agroastery/", label: "Instagram" },
  { href: "https://www.tiktok.com/@agroastery", label: "Tiktok" },
  { href: "/resting-period", label: "Resting Period" },
];
```

- [ ] **Step 3: Make footer internal links open in the same tab**

The footer currently hardcodes `target="_blank"` on every link, which would open `/resting-period` in a new tab. In `components/ui/footer.tsx`, replace the link map block:

Old:

```tsx
{footer.map((link) => (
  <a
    key={link.label}
    href={link.href}
    target="_blank"
    rel="noopener noreferrer"
    className="no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]"
  >
    {link.label}
  </a>
))}
```

New:

```tsx
{footer.map((link) => {
  const isInternal = link.href.startsWith("/");
  return (
    <a
      key={link.label}
      href={link.href}
      {...(isInternal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className="no-underline text-[#f5ebc9] text-sm hover:text-[#f5e4ac]"
    >
      {link.label}
    </a>
  );
})}
```

- [ ] **Step 4: Verify manually in dev server**

Run: `pnpm dev`
Open: `http://localhost:3000/resting-period/`
Expected:
- Empty state with date input renders
- Pick a date → URL becomes `/resting-period/?roast=YYYY-MM-DD`, banner + 4 milestone cards appear
- Footer (bottom of page) shows "Resting Period" link, opens same tab
- Copy link button copies the URL (verify by pasting somewhere)
- Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add app/(root)/resting-period/page.tsx constant/menu-list.ts components/ui/footer.tsx
git commit -m "feat(resting-period): add page route and footer link"
```

---

### Task 4: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass, including the new `date.test.ts` and `index.test.tsx`. No regressions in existing suites.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No new errors or warnings from the new/modified files.

- [ ] **Step 3: Run build**

Run: `pnpm build`
Expected: Build succeeds. `/resting-period` page listed in output as a static route. No Suspense/useSearchParams build error.

- [ ] **Step 4: Commit any fixes if needed**

If lint or build required changes:

```bash
git add -A
git commit -m "fix(resting-period): address lint/build findings"
```

---

## Self-Review Notes

- **Spec coverage:** URL param sharing (Task 2), copy button + fallback (Task 2), WIB today (Task 1), milestones 3/7/14/21 with statuses (Tasks 1+2), empty state (Task 2), input form (Task 2), footer link + same-tab (Task 3), Suspense boundary (Task 3), tests (Tasks 1+2), build verification (Task 4). Out-of-scope items from spec (configurable milestones, order-history prefill, brew notes) correctly absent.
- **Type consistency:** `MilestoneStatus` exported from `date.ts` and imported as type in `index.tsx`; helper names (`getTodayWIB`, `isRoastDate`, `diffDays`, `addDays`, `formatDateID`, `milestoneStatus`) identical across tasks and tests.
- **Conventions:** Test colocated next to component (matches `components/section/blend-onboarding/*.test.tsx` pattern); page structure mirrors `konsultasi/page.tsx`; `pnpm test` runner used per AGENTS.md.
