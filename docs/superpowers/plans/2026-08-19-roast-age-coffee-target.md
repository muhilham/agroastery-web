# Roast Age: Coffee Name + Custom Rest Target — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two optional URL-persisted inputs to the existing `/roast-age` page — coffee name (display only) and a custom rest-day target (extra card above fixed milestones).

**Architecture:** Increment on the existing client component. Both values are URL query params (`?coffee=...&days=N`) read via `useSearchParams`, updated via `router.replace` — same pattern as `roast`. Pure validation helpers added to `date.ts`. No route, page, or footer changes.

**Tech Stack:** Same as existing feature (Next.js 16 App Router, React 19, Tailwind, Vitest + RTL via `pnpm test`).

**Spec:** `docs/superpowers/specs/2026-08-18-roast-age-page-design.md` (updated 2026-08-19)

**Worktree:** `/Users/muhammadilham/Documents/GitHub/agroastery-web/.worktrees/roast-age`, branch `feature/roast-age-page` (feature already implemented through commit 2d1854c; this plan extends it).

---

### Task 1: Param validation helpers (TDD)

**Files:**
- Modify: `components/roast-age/date.ts`
- Test: `components/roast-age/date.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `components/roast-age/date.test.ts` (inside existing imports, add `parseCoffeeName`, `parseRestDays` to the import from `./date`):

```ts
describe("parseCoffeeName", () => {
  it("trims whitespace", () => {
    expect(parseCoffeeName("  Toraja Sapan ")).toBe("Toraja Sapan");
  });

  it("caps at 60 characters", () => {
    expect(parseCoffeeName("a".repeat(80)).length).toBe(60);
  });

  it("returns null for empty or whitespace-only", () => {
    expect(parseCoffeeName("")).toBeNull();
    expect(parseCoffeeName("   ")).toBeNull();
  });

  it("returns null for null/undefined input", () => {
    expect(parseCoffeeName(null)).toBeNull();
    expect(parseCoffeeName(undefined)).toBeNull();
  });
});

describe("parseRestDays", () => {
  it("parses a valid integer string", () => {
    expect(parseRestDays("10")).toBe(10);
    expect(parseRestDays("1")).toBe(1);
    expect(parseRestDays("365")).toBe(365);
  });

  it("returns null for non-integers", () => {
    expect(parseRestDays("abc")).toBeNull();
    expect(parseRestDays("3.5")).toBeNull();
    expect(parseRestDays("")).toBeNull();
  });

  it("returns null out of range", () => {
    expect(parseRestDays("0")).toBeNull();
    expect(parseRestDays("-5")).toBeNull();
    expect(parseRestDays("366")).toBeNull();
  });

  it("returns null for null/undefined input", () => {
    expect(parseRestDays(null)).toBeNull();
    expect(parseRestDays(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `parseCoffeeName`/`parseRestDays` not exported from `./date`.

- [ ] **Step 3: Write the implementation**

Append to `components/roast-age/date.ts`:

```ts
/** Normalize a coffee name param: trim, cap at 60 chars. Null when absent/empty. */
export function parseCoffeeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 60);
}

/** Parse a custom rest-day param: integer 1-365. Null when invalid. */
export function parseRestDays(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (!/^\d+$/.test(value)) return null;
  const n = Number.parseInt(value, 10);
  if (n < 1 || n > 365) return null;
  return n;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: date.test.ts all pass (18 existing + 8 new). Component tests unchanged. Pre-existing failures (3 map-picker + 8 consultations) unchanged.

- [ ] **Step 5: Commit**

```bash
git add components/roast-age/date.ts components/roast-age/date.test.ts
git commit -m "feat(roast-age): add coffee name and rest days param parsers"
```

---

### Task 2: Component inputs, URL sync, custom target card (TDD)

**Files:**
- Modify: `components/roast-age/index.tsx`
- Test: `components/roast-age/index.test.tsx` (append)

- [ ] **Step 1: Write the failing tests**

Append to `components/roast-age/index.test.tsx`. Update the `vi.mock("next/navigation")` factory's `useSearchParams` to build params from a mock object instead of only `roast` — replace the hoisted block and mock factory at the top of the file:

```tsx
const { mockReplace, mockParams } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockParams: { value: {} as Record<string, string> },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockParams.value),
}));
```

Then update the two existing tests that set `mockRoastParam.value = "..."` to instead set `mockParams.value = { roast: "..." }`, and `beforeEach` to reset `mockParams.value = {}`. (Search for `mockRoastParam` — replace all occurrences.)

Append these tests inside the existing `describe("RoastAge", ...)`:

```tsx
it("shows coffee name under the header when param present", () => {
  mockParams.value = { roast: "2026-08-04", coffee: "Toraja Sapan" };
  render(<RoastAge />);
  expect(screen.getByText("Toraja Sapan")).toBeInTheDocument();
});

it("hides coffee name when param absent", () => {
  mockParams.value = { roast: "2026-08-04" };
  render(<RoastAge />);
  expect(screen.queryByText("Toraja Sapan")).not.toBeInTheDocument();
});

it("ignores whitespace-only coffee param", () => {
  mockParams.value = { roast: "2026-08-04", coffee: "   " };
  render(<RoastAge />);
  expect(screen.queryByText(/toraja/i)).not.toBeInTheDocument();
});

it("renders custom rest target card when days param valid", () => {
  mockParams.value = { roast: "2026-08-04", days: "10" };
  render(<RoastAge />);
  const card = screen.getByText("Rest target — 10 days").closest("div");
  expect(card).toHaveTextContent("14 Agustus 2026");
  expect(card).toHaveTextContent("In 4 days");
});

it("hides custom rest target card when days param invalid", () => {
  mockParams.value = { roast: "2026-08-04", days: "abc" };
  render(<RoastAge />);
  expect(screen.queryByText(/rest target/i)).not.toBeInTheDocument();
});

it("hides custom rest target card when days param out of range", () => {
  mockParams.value = { roast: "2026-08-04", days: "400" };
  render(<RoastAge />);
  expect(screen.queryByText(/rest target/i)).not.toBeInTheDocument();
});

it("updates coffee param in URL when name input changes", () => {
  mockParams.value = { roast: "2026-08-04" };
  render(<RoastAge />);
  fireEvent.change(screen.getByLabelText(/coffee name/i), {
    target: { value: "Gayo" },
  });
  expect(mockReplace).toHaveBeenCalledWith(
    "/roast-age/?roast=2026-08-04&coffee=Gayo",
    { scroll: false }
  );
});

it("removes coffee param from URL when name input cleared", () => {
  mockParams.value = { roast: "2026-08-04", coffee: "Gayo" };
  render(<RoastAge />);
  fireEvent.change(screen.getByLabelText(/coffee name/i), {
    target: { value: "" },
  });
  expect(mockReplace).toHaveBeenCalledWith(
    "/roast-age/?roast=2026-08-04",
    { scroll: false }
  );
});

it("updates days param in URL when rest days input changes", () => {
  mockParams.value = { roast: "2026-08-04" };
  render(<RoastAge />);
  fireEvent.change(screen.getByLabelText(/rest days/i), {
    target: { value: "12" },
  });
  expect(mockReplace).toHaveBeenCalledWith(
    "/roast-age/?roast=2026-08-04&days=12",
    { scroll: false }
  );
});

it("removes days param from URL when rest days input cleared", () => {
  mockParams.value = { roast: "2026-08-04", days: "12" };
  render(<RoastAge />);
  fireEvent.change(screen.getByLabelText(/rest days/i), {
    target: { value: "" },
  });
  expect(mockReplace).toHaveBeenCalledWith(
    "/roast-age/?roast=2026-08-04",
    { scroll: false }
  );
});
```

Note on URL construction: implementation builds query strings by always keeping current valid params in a fixed order (`roast`, then `coffee`, then `days`) and omitting cleared ones — tests above assert exact strings for that order.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — no "Coffee name"/"Rest days" inputs, no custom card, new URL assertions fail. Existing tests may break if mock refactor is wrong — fix mock refactor, not old assertions.

- [ ] **Step 3: Write the implementation**

In `components/roast-age/index.tsx`:

3a. Extend imports from `./date` (add `parseCoffeeName`, `parseRestDays`).

3b. Replace `handleRoastChange` with a single param-syncing update function:

```tsx
function updateParams(next: { roast?: string; coffee?: string; days?: string }) {
  const merged = {
    roast: roast ?? undefined,
    coffee: coffeeName ?? undefined,
    days: restDays !== null ? String(restDays) : undefined,
    ...next,
  };
  const query = new URLSearchParams();
  if (merged.roast) query.set("roast", merged.roast);
  if (merged.coffee) query.set("coffee", merged.coffee);
  if (merged.days) query.set("days", merged.days);
  const qs = query.toString();
  router.replace(`/roast-age/${qs ? `?${qs}` : ""}`, { scroll: false });
}
```

Wire the three inputs: roast date → `updateParams({ roast: e.target.value })`, coffee name → `updateParams({ coffee: e.target.value })`, rest days → `updateParams({ days: e.target.value })`. For coffee, URL-encoding is handled by `URLSearchParams` — pass raw value. Cleared inputs produce `""`/falsy values which the `if` guards skip, dropping the param.

3c. Add derived state after the `roast` line:

```tsx
const coffeeName = parseCoffeeName(searchParams.get("coffee"));
const restDays = parseRestDays(searchParams.get("days"));
```

3d. Coffee name display: under the header `<p>` (the "Track how long..." line), add:

```tsx
{coffeeName && (
  <p className="mt-1 text-base font-semibold text-foreground">{coffeeName}</p>
)}
```

3e. Inputs section: add two fields between roast date and copy button. Restructure the form section to stack rows on mobile:

```tsx
<section className="mb-8 flex flex-col gap-3">
  <div className="flex flex-col gap-3 sm:flex-row">
    <div className="flex-1">
      <label htmlFor="roast-date" className="mb-2 block text-sm font-medium text-foreground">
        Roast date
      </label>
      <input
        id="roast-date"
        type="date"
        value={roast ?? ""}
        max="2100-12-31"
        onChange={(e) => updateParams({ roast: e.target.value })}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground [color-scheme:dark] focus:border-foreground focus:outline-none"
      />
    </div>
    <div className="flex-1">
      <label htmlFor="coffee-name" className="mb-2 block text-sm font-medium text-foreground">
        Coffee name
      </label>
      <input
        id="coffee-name"
        type="text"
        maxLength={60}
        placeholder="e.g. Toraja Sapan"
        value={coffeeName ?? ""}
        onChange={(e) => updateParams({ coffee: e.target.value })}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground placeholder:text-white/30 focus:border-foreground focus:outline-none"
      />
    </div>
  </div>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <div className="flex-1">
      <label htmlFor="rest-days" className="mb-2 block text-sm font-medium text-foreground">
        Rest days (optional)
      </label>
      <input
        id="rest-days"
        type="number"
        min={1}
        max={365}
        placeholder="e.g. 10"
        value={restDays ?? ""}
        onChange={(e) => updateParams({ days: e.target.value })}
        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-foreground [color-scheme:dark] placeholder:text-white/30 focus:border-foreground focus:outline-none"
      />
    </div>
    <button
      type="button"
      onClick={handleCopy}
      disabled={!roast}
      aria-live="polite"
      className="rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  </div>
</section>
```

Delete the old form section (roast + copy button row) — this replaces it.

3f. Custom target card: inside the milestones `<section>`, BEFORE the `MILESTONES.map(...)`, add:

```tsx
{restDays !== null && (
  <div className="flex flex-wrap items-center justify-between gap-x-2 rounded-xl border border-foreground/30 bg-white/5 p-4 sm:col-span-2">
    <p className="text-sm text-white/60">Rest target — {restDays} days</p>
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
        milestoneStatus(addDays(roast, restDays), today)
      )}`}
    >
      {statusLabel(milestoneStatus(addDays(roast, restDays), today))}
    </span>
    <p className="mt-1 w-full text-lg font-semibold text-foreground">
      {formatDateID(addDays(roast, restDays))}
    </p>
  </div>
)}
```

(Label/badge/date layout matches milestone cards; `border-foreground/30` distinguishes it; `sm:col-span-2` spans the 2-col grid.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: index.test.tsx all pass (10 existing + 10 new), date.test.ts 26 pass. Pre-existing failures unchanged.

- [ ] **Step 5: Commit**

```bash
git add components/roast-age/index.tsx components/roast-age/index.test.tsx
git commit -m "feat(roast-age): add coffee name and custom rest target inputs"
```

---

### Task 3: Verification

- [ ] **Step 1: Lint new/modified files**

Run: `npx eslint components/roast-age/`
Expected: No issues.

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: Succeeds, `/roast-age` still static (○).

- [ ] **Step 3: Commit any fixes**

Only if Steps 1-2 required changes:
```bash
git add -A && git commit -m "fix(roast-age): address lint/build findings"
```

---

## Self-Review Notes

- **Spec coverage:** coffee param (trim/cap/absent — Task 1 + 2 tests), days param 1-365 (Task 1 + 2), URL updates/removals for both inputs (Task 2), banner subtitle (Task 2), custom card above milestones with same badge logic (Task 2), fixed milestones untouched, no route/footer/page changes needed.
- **Type consistency:** `parseCoffeeName(value: string | null | undefined): string | null`, `parseRestDays(value: string | null | undefined): number | null` — used identically in tests and component. `updateParams` internal only.
- **Behavior note:** typing in coffee input fires `router.replace` per keystroke — acceptable (same pattern as date input, no history spam via replace). Test mock `useSearchParams` returns a static snapshot per render; URL assertions use exact strings with fixed param order `roast,coffee,days` matching `updateParams` construction order.
