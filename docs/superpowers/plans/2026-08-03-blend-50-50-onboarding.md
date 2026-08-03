# Blend 50:50 Onboarding Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, non-ecommerce onboarding page at `/start/blend-50-50` that teaches marketplace buyers (via a printed QR code) how to brew Blend 50:50 in three ways, with troubleshooting help, a WhatsApp escalation path, and a low-pressure reorder CTA — instrumented with 5 versioned GA4 events.

**Architecture:** One server-rendered page (`app/start/blend-50-50/page.tsx`) composes small, mostly-presentational section components from `components/section/blend-onboarding/`. Content lives in a single typed data module (`lib/data/blend-50-50.ts`) alongside a page-specific analytics wrapper (`trackBlendEvent`) that stamps every GA4 event with `product`/`version` so no event can skip that context. Scroll-triggered analytics (`brew_guide_viewed`, `troubleshooting_viewed`) go through one generic, reusable `ViewTracker` client component (IntersectionObserver + ref-guarded fire-once), kept free of any analytics-specific knowledge — the analytics call lives in the thin client wrapper around it, not inside it.

**Tech Stack:** Next.js 15 App Router (server components by default), TypeScript, Tailwind CSS 3, `lucide-react` + `react-icons` (already installed, no new deps), Vitest + `@testing-library/react` + jsdom (already configured).

**Spec:** `docs/superpowers/specs/2026-08-03-blend-50-50-onboarding-design.md`

## Global Constraints

- Route: `/start/blend-50-50`, standalone — outside the `(root)` route group. No shared Navbar/Footer/cart icon.
- Copy language: Indonesian primary (headings, instructions, troubleshooting, CTAs). Taste-profile words stay as short English/loanword tags (e.g. "Chocolate", "Bold", "Starch-like oat") — do not translate these.
- Single dark theme only. No light/dark toggle. Reuse existing CSS vars (`--primary`, `--secondary`, `--background` in `app/globals.css`) and the existing Montserrat font — no font override.
- No new UI library. Icons only via already-installed `lucide-react` / `react-icons`, and only where they aid comprehension.
- Every analytics call on this page goes through `trackBlendEvent()` from `lib/data/blend-50-50.ts` — never call `trackEvent()` from `lib/analytics/gtag.ts` directly on this page. `trackBlendEvent` always merges `{ product: PRODUCT_SLUG, version: CONTENT_VERSION }` into every event.
- `CONTENT_VERSION` (currently `"2026-08"`) must be bumped whenever recipe dose/yield/time copy changes, so analytics can distinguish recipe versions.
- Reorder CTA links to `/product/biji-kopi-blend-5050-kopi-susu-ekonomis`. Secondary link goes to `/katalog`.
- Rounded corners, very light shadows, no gradients, no marketing illustrations, no carousels/popups/testimonials.
- Test runner: `npm test -- <path/to/file.test.ts>` (forwards args to `vitest run`).

---

### Task 1: Data module + versioned analytics wrapper

**Files:**
- Create: `lib/data/blend-50-50.ts`
- Test: `lib/data/blend-50-50.test.ts`

**Interfaces:**
- Produces: `PRODUCT_SLUG: string`, `CONTENT_VERSION: string`, `type BrewMethod = "espresso" | "iced_americano" | "es_kopi_susu"`, `type Recipe = { id: BrewMethod; title: string; steps: { label: string; value: string }[]; tasteProfile: string[]; note?: string }`, `type Ingredient = { name: string; detail: string }`, `type Troubleshooting = { question: string; answer: string }`, `recipes: Recipe[]` (length 3), `ingredients: Ingredient[]`, `troubleshooting: Troubleshooting[]`, `trackBlendEvent(eventName: string, params?: Record<string, unknown>): void`.
- Consumes: `trackEvent` from `@/lib/analytics/gtag` (existing, signature `trackEvent(eventName: string, params?: Record<string, unknown>): void`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/data/blend-50-50.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { trackEvent } from "@/lib/analytics/gtag";

vi.mock("@/lib/analytics/gtag", () => ({
  trackEvent: vi.fn(),
}));

import {
  trackBlendEvent,
  PRODUCT_SLUG,
  CONTENT_VERSION,
  recipes,
  ingredients,
  troubleshooting,
} from "./blend-50-50";

describe("blend-50-50 content", () => {
  it("has exactly 3 recipes with unique ids", () => {
    expect(recipes).toHaveLength(3);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(3);
    expect(recipes.map((r) => r.id).sort()).toEqual(
      ["es_kopi_susu", "espresso", "iced_americano"].sort()
    );
  });

  it("has ingredients and troubleshooting entries", () => {
    expect(ingredients.length).toBeGreaterThan(0);
    expect(troubleshooting).toHaveLength(4);
  });
});

describe("trackBlendEvent", () => {
  afterEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("merges product and version into every event", () => {
    trackBlendEvent("whatsapp_clicked");
    expect(trackEvent).toHaveBeenCalledWith("whatsapp_clicked", {
      product: PRODUCT_SLUG,
      version: CONTENT_VERSION,
    });
  });

  it("merges extra params without overwriting product/version", () => {
    trackBlendEvent("brew_guide_viewed", { brew_method: "espresso" });
    expect(trackEvent).toHaveBeenCalledWith("brew_guide_viewed", {
      product: PRODUCT_SLUG,
      version: CONTENT_VERSION,
      brew_method: "espresso",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/data/blend-50-50.test.ts`
Expected: FAIL — `./blend-50-50` module not found.

- [ ] **Step 3: Write the implementation**

```ts
// lib/data/blend-50-50.ts
import { trackEvent } from "@/lib/analytics/gtag";

export const PRODUCT_SLUG = "blend-50-50";
export const CONTENT_VERSION = "2026-08"; // bump whenever recipe dose/yield/time copy changes

export type BrewMethod = "espresso" | "iced_americano" | "es_kopi_susu";

export type Recipe = {
  id: BrewMethod;
  title: string;
  steps: { label: string; value: string }[];
  tasteProfile: string[];
  note?: string;
};

export type Ingredient = {
  name: string;
  detail: string;
};

export type Troubleshooting = {
  question: string;
  answer: string;
};

export function trackBlendEvent(eventName: string, params?: Record<string, unknown>): void {
  trackEvent(eventName, { product: PRODUCT_SLUG, version: CONTENT_VERSION, ...params });
}

export const recipes: Recipe[] = [
  {
    id: "espresso",
    title: "Espresso",
    steps: [
      { label: "Dose", value: "18g" },
      { label: "Yield", value: "40g" },
      { label: "Waktu", value: "26–29 detik" },
    ],
    tasteProfile: ["Chocolate", "Earthy", "Orange Peel", "Bold"],
    note: "Resep ini adalah titik awal yang kami rekomendasikan. Penyesuaian kecil mungkin diperlukan tergantung grinder dan mesin espresso Anda.",
  },
  {
    id: "iced_americano",
    title: "Iced Americano",
    steps: [
      { label: "Espresso", value: "1 shot" },
      { label: "Air (suhu ruang)", value: "100g" },
      { label: "Es", value: "70g" },
    ],
    tasteProfile: ["Nutty", "Chocolate", "Orange Peel", "Starch-like oat"],
  },
  {
    id: "es_kopi_susu",
    title: "Es Kopi Susu",
    steps: [
      { label: "Liquid Creamer", value: "30g" },
      { label: "Espresso", value: "1 shot" },
      { label: "Liquid Aren Mahorahora", value: "10g" },
      { label: "Diamond Full Cream UHT", value: "80g" },
      { label: "Es", value: "150g" },
    ],
    tasteProfile: ["Chocolate Cookie", "Creamy", "Sweet Aren", "Starch-like oat"],
  },
];

export const ingredients: Ingredient[] = [
  { name: "Air", detail: "Aqua" },
  { name: "Susu", detail: "Diamond Full Cream UHT" },
  { name: "Sirup Aren", detail: "Mahorahora" },
  {
    name: "Liquid Creamer",
    detail: "Campur 50g bubuk creamer + 50g Aqua, blender hingga halus.",
  },
];

export const troubleshooting: Troubleshooting[] = [
  { question: "Kopi terasa terlalu asam", answer: "Coba giling lebih halus." },
  { question: "Kopi terasa pahit", answer: "Giling lebih kasar." },
  {
    question: "Rasa kopi hilang setelah ditambah susu",
    answer: "Tingkatkan kekuatan ekstraksi atau kurangi susu.",
  },
  { question: "Aliran terlalu cepat", answer: "Giling lebih halus." },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/data/blend-50-50.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/data/blend-50-50.ts lib/data/blend-50-50.test.ts
git commit -m "feat: add Blend 50:50 onboarding content data and versioned analytics wrapper"
```

---

### Task 2: `ViewTracker` — generic scroll-into-view component

**Files:**
- Create: `components/section/blend-onboarding/ViewTracker.tsx`
- Test: `components/section/blend-onboarding/ViewTracker.test.tsx`

**Interfaces:**
- Produces: `ViewTracker({ onView, children, className?, threshold? }: { onView: () => void; children: React.ReactNode; className?: string; threshold?: number })` — a client component. Calls `onView()` at most once, the first time its wrapped `<div>` becomes intersecting (default `threshold: 0.4`). No analytics knowledge — purely a generic reusable primitive.
- Consumes: nothing project-specific (React only).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/ViewTracker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ViewTracker } from "./ViewTracker";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  // @ts-expect-error jsdom has no real IntersectionObserver
  global.IntersectionObserver = FakeIntersectionObserver;
});

describe("ViewTracker", () => {
  it("calls onView once when the element intersects, even if triggered twice", () => {
    const onView = vi.fn();
    render(
      <ViewTracker onView={onView}>
        <div>content</div>
      </ViewTracker>
    );
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger(true);
    observer.trigger(true);
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it("does not call onView when the element is not intersecting", () => {
    const onView = vi.fn();
    render(
      <ViewTracker onView={onView}>
        <div>content</div>
      </ViewTracker>
    );
    FakeIntersectionObserver.instances[0].trigger(false);
    expect(onView).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/ViewTracker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/ViewTracker.tsx
"use client";

import { useEffect, useRef } from "react";

type ViewTrackerProps = {
  onView: () => void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
};

export function ViewTracker({ onView, children, className, threshold = 0.4 }: ViewTrackerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            onView();
            observer.disconnect();
          }
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onView, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/ViewTracker.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/ViewTracker.tsx components/section/blend-onboarding/ViewTracker.test.tsx
git commit -m "feat: add generic ViewTracker component for scroll-into-view analytics"
```

---

### Task 3: `Hero` component

**Files:**
- Create: `components/section/blend-onboarding/Hero.tsx`
- Test: `components/section/blend-onboarding/Hero.test.tsx`

**Interfaces:**
- Produces: `Hero()` — server component (no `"use client"`, no hooks). Renders 3 anchor links with hrefs `#espresso`, `#iced-americano`, `#es-kopi-susu` (must match the section `id`s produced by Task 4's `RecipeCard`, derived as `recipe.id.replace(/_/g, "-")`).
- Consumes: nothing (static copy).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/Hero.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders CTA links pointing to each recipe section", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Espresso" })).toHaveAttribute("href", "#espresso");
    expect(screen.getByRole("link", { name: "Iced Americano" })).toHaveAttribute(
      "href",
      "#iced-americano"
    );
    expect(screen.getByRole("link", { name: "Es Kopi Susu" })).toHaveAttribute(
      "href",
      "#es-kopi-susu"
    );
  });

  it("renders the title and subhead", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { name: "Blend 50:50" })).toBeInTheDocument();
    expect(screen.getByText("Dirancang untuk minuman berbasis susu.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/Hero.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/Hero.tsx
export function Hero() {
  return (
    <header className="mx-auto max-w-2xl px-6 pt-16 pb-10 text-center sm:pt-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Blend 50:50</h1>
      <p className="mt-3 text-base text-[hsl(var(--secondary))]">
        Dirancang untuk minuman berbasis susu.
      </p>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[hsl(var(--secondary))]">
        Halaman ini membagikan resep persis yang digunakan AGRoastery untuk menyeduh Blend 50:50.
      </p>
      <nav className="mt-10 flex flex-wrap justify-center gap-3">
        <a
          href="#espresso"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:border-white/30"
        >
          Espresso
        </a>
        <a
          href="#iced-americano"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:border-white/30"
        >
          Iced Americano
        </a>
        <a
          href="#es-kopi-susu"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:border-white/30"
        >
          Es Kopi Susu
        </a>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/Hero.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/Hero.tsx components/section/blend-onboarding/Hero.test.tsx
git commit -m "feat: add Hero section for Blend 50:50 onboarding page"
```

---

### Task 4: `RecipeCard` component

**Files:**
- Create: `components/section/blend-onboarding/RecipeCard.tsx`
- Test: `components/section/blend-onboarding/RecipeCard.test.tsx`

**Interfaces:**
- Produces: `RecipeCard({ recipe }: { recipe: Recipe })` — server component. Renders a `<section id={recipe.id.replace(/_/g, "-")}>` with title, steps as a `<dl>`, taste-profile tags, and optional note.
- Consumes: `Recipe` type and `recipes` array from `@/lib/data/blend-50-50` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/RecipeCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeCard } from "./RecipeCard";
import { recipes } from "@/lib/data/blend-50-50";

describe("RecipeCard", () => {
  it("renders title, section id, steps, and taste tags for espresso", () => {
    const recipe = recipes.find((r) => r.id === "espresso")!;
    const { container } = render(<RecipeCard recipe={recipe} />);

    expect(screen.getByRole("heading", { name: "Espresso" })).toBeInTheDocument();
    expect(container.querySelector("#espresso")).not.toBeNull();
    expect(screen.getByText("18g")).toBeInTheDocument();
    expect(screen.getByText("40g")).toBeInTheDocument();
    recipe.tasteProfile.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it("derives a hyphenated section id from an underscored recipe id", () => {
    const recipe = recipes.find((r) => r.id === "iced_americano")!;
    const { container } = render(<RecipeCard recipe={recipe} />);
    expect(container.querySelector("#iced-americano")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/RecipeCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/RecipeCard.tsx
import type { Recipe } from "@/lib/data/blend-50-50";

type RecipeCardProps = { recipe: Recipe };

export function RecipeCard({ recipe }: RecipeCardProps) {
  const sectionId = recipe.id.replace(/_/g, "-");

  return (
    <section id={sectionId} className="scroll-mt-8 border-t border-white/10 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-xl font-semibold">{recipe.title}</h2>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {recipe.steps.map((step) => (
            <div key={step.label}>
              <dt className="text-xs uppercase tracking-wide text-[hsl(var(--secondary))]">
                {step.label}
              </dt>
              <dd className="mt-1 text-lg font-medium">{step.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {recipe.tasteProfile.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs">
              {tag}
            </span>
          ))}
        </div>
        {recipe.note && (
          <p className="mt-6 text-sm leading-relaxed text-[hsl(var(--secondary))]">{recipe.note}</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/RecipeCard.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/RecipeCard.tsx components/section/blend-onboarding/RecipeCard.test.tsx
git commit -m "feat: add RecipeCard presentational component"
```

---

### Task 5: `RecipeSection` — wires `ViewTracker` + `RecipeCard` to `brew_guide_viewed`

**Files:**
- Create: `components/section/blend-onboarding/RecipeSection.tsx`
- Test: `components/section/blend-onboarding/RecipeSection.test.tsx`

**Interfaces:**
- Produces: `RecipeSection({ recipe }: { recipe: Recipe })` — client component. Renders `<ViewTracker onView={...}><RecipeCard recipe={recipe} /></ViewTracker>`, firing `trackBlendEvent("brew_guide_viewed", { brew_method: recipe.id })` on first intersection.
- Consumes: `ViewTracker` (Task 2), `RecipeCard` (Task 4), `Recipe` type + `trackBlendEvent` from `@/lib/data/blend-50-50` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/RecipeSection.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { RecipeSection } from "./RecipeSection";
import { recipes } from "@/lib/data/blend-50-50";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  // @ts-expect-error jsdom has no real IntersectionObserver
  global.IntersectionObserver = FakeIntersectionObserver;
});

describe("RecipeSection", () => {
  it("fires brew_guide_viewed with the recipe's brew_method on scroll-into-view", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    const recipe = recipes.find((r) => r.id === "espresso")!;
    render(<RecipeSection recipe={recipe} />);

    FakeIntersectionObserver.instances[0].trigger(true);

    expect(trackBlendEvent).toHaveBeenCalledWith("brew_guide_viewed", { brew_method: "espresso" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/RecipeSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/RecipeSection.tsx
"use client";

import type { Recipe } from "@/lib/data/blend-50-50";
import { trackBlendEvent } from "@/lib/data/blend-50-50";
import { RecipeCard } from "./RecipeCard";
import { ViewTracker } from "./ViewTracker";

type RecipeSectionProps = { recipe: Recipe };

export function RecipeSection({ recipe }: RecipeSectionProps) {
  return (
    <ViewTracker onView={() => trackBlendEvent("brew_guide_viewed", { brew_method: recipe.id })}>
      <RecipeCard recipe={recipe} />
    </ViewTracker>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/RecipeSection.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/RecipeSection.tsx components/section/blend-onboarding/RecipeSection.test.tsx
git commit -m "feat: wire RecipeCard to brew_guide_viewed via ViewTracker"
```

---

### Task 6: `IngredientsSection` component

**Files:**
- Create: `components/section/blend-onboarding/IngredientsSection.tsx`
- Test: `components/section/blend-onboarding/IngredientsSection.test.tsx`

**Interfaces:**
- Produces: `IngredientsSection()` — server component, no props. Renders all entries from `ingredients`.
- Consumes: `ingredients` from `@/lib/data/blend-50-50` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/IngredientsSection.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IngredientsSection } from "./IngredientsSection";
import { ingredients } from "@/lib/data/blend-50-50";

describe("IngredientsSection", () => {
  it("renders every ingredient's name and detail", () => {
    render(<IngredientsSection />);
    ingredients.forEach((ingredient) => {
      expect(screen.getByText(ingredient.name)).toBeInTheDocument();
      expect(screen.getByText(ingredient.detail)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/IngredientsSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/IngredientsSection.tsx
import { ingredients } from "@/lib/data/blend-50-50";

export function IngredientsSection() {
  return (
    <section id="bahan" className="scroll-mt-8 border-t border-white/10 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-xl font-semibold">Bahan yang Digunakan</h2>
        <dl className="mt-6 space-y-4">
          {ingredients.map((ingredient) => (
            <div key={ingredient.name}>
              <dt className="text-sm font-medium">{ingredient.name}</dt>
              <dd className="mt-1 text-sm text-[hsl(var(--secondary))]">{ingredient.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/IngredientsSection.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/IngredientsSection.tsx components/section/blend-onboarding/IngredientsSection.test.tsx
git commit -m "feat: add IngredientsSection component"
```

---

### Task 7: `TroubleshootingCard` + `TroubleshootingSection`

**Files:**
- Create: `components/section/blend-onboarding/TroubleshootingCard.tsx`
- Create: `components/section/blend-onboarding/TroubleshootingSection.tsx`
- Test: `components/section/blend-onboarding/TroubleshootingSection.test.tsx`

**Interfaces:**
- Produces: `TroubleshootingCard({ item }: { item: Troubleshooting })` — server, presentational. `TroubleshootingSection()` — client component, wraps all cards in one `ViewTracker`, fires `trackBlendEvent("troubleshooting_viewed")` once on first intersection.
- Consumes: `Troubleshooting` type + `troubleshooting` array + `trackBlendEvent` from `@/lib/data/blend-50-50` (Task 1), `ViewTracker` (Task 2).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/TroubleshootingSection.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TroubleshootingSection } from "./TroubleshootingSection";
import { troubleshooting } from "@/lib/data/blend-50-50";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  // @ts-expect-error jsdom has no real IntersectionObserver
  global.IntersectionObserver = FakeIntersectionObserver;
});

describe("TroubleshootingSection", () => {
  it("renders every question and answer", () => {
    render(<TroubleshootingSection />);
    troubleshooting.forEach((item) => {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    });
  });

  it("fires troubleshooting_viewed once on scroll-into-view", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    render(<TroubleshootingSection />);
    FakeIntersectionObserver.instances[0].trigger(true);
    FakeIntersectionObserver.instances[0].trigger(true);
    expect(trackBlendEvent).toHaveBeenCalledTimes(1);
    expect(trackBlendEvent).toHaveBeenCalledWith("troubleshooting_viewed", undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/TroubleshootingSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/TroubleshootingCard.tsx
import type { Troubleshooting } from "@/lib/data/blend-50-50";

type TroubleshootingCardProps = { item: Troubleshooting };

export function TroubleshootingCard({ item }: TroubleshootingCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 shadow-sm">
      <p className="text-sm font-medium">{item.question}</p>
      <p className="mt-2 text-sm text-[hsl(var(--secondary))]">{item.answer}</p>
    </div>
  );
}
```

```tsx
// components/section/blend-onboarding/TroubleshootingSection.tsx
"use client";

import { troubleshooting, trackBlendEvent } from "@/lib/data/blend-50-50";
import { TroubleshootingCard } from "./TroubleshootingCard";
import { ViewTracker } from "./ViewTracker";

export function TroubleshootingSection() {
  return (
    <ViewTracker onView={() => trackBlendEvent("troubleshooting_viewed")}>
      <section className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-xl font-semibold">Troubleshooting</h2>
          <div className="mt-6 space-y-4">
            {troubleshooting.map((item) => (
              <TroubleshootingCard key={item.question} item={item} />
            ))}
          </div>
        </div>
      </section>
    </ViewTracker>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/TroubleshootingSection.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/TroubleshootingCard.tsx components/section/blend-onboarding/TroubleshootingSection.tsx components/section/blend-onboarding/TroubleshootingSection.test.tsx
git commit -m "feat: add TroubleshootingSection wired to troubleshooting_viewed"
```

---

### Task 8: `HelpSection` — WhatsApp CTA

**Files:**
- Create: `components/section/blend-onboarding/HelpSection.tsx`
- Test: `components/section/blend-onboarding/HelpSection.test.tsx`

**Interfaces:**
- Produces: `HelpSection()` — client component. Renders a WhatsApp link built with `buildWhatsAppLink()`, firing `trackBlendEvent("whatsapp_clicked")` on click.
- Consumes: `buildWhatsAppLink` from `@/lib/whatsapp` (existing, signature `buildWhatsAppLink(message: string): string`), `trackBlendEvent` from `@/lib/data/blend-50-50` (Task 1), `FaWhatsapp` from `react-icons/fa` (existing dep).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/HelpSection.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpSection } from "./HelpSection";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HelpSection", () => {
  it("renders a WhatsApp link", () => {
    render(<HelpSection />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\//);
  });

  it("fires whatsapp_clicked on click", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    render(<HelpSection />);
    fireEvent.click(screen.getByRole("link", { name: /whatsapp/i }));
    expect(trackBlendEvent).toHaveBeenCalledWith("whatsapp_clicked");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/HelpSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/HelpSection.tsx
"use client";

import { FaWhatsapp } from "react-icons/fa";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { trackBlendEvent } from "@/lib/data/blend-50-50";

export function HelpSection() {
  const href = buildWhatsAppLink("Halo, saya butuh bantuan dial-in Blend 50:50 saya.");

  return (
    <section className="border-t border-white/10 py-12">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-xl font-semibold">Butuh Bantuan?</h2>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--secondary))]">
          Belum dapat hasil yang Anda inginkan? Tim kami dengan senang hati membantu Anda dial-in
          kopi ini.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackBlendEvent("whatsapp_clicked")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-medium text-black"
        >
          <FaWhatsapp className="h-4 w-4" />
          Chat via WhatsApp
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/HelpSection.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/HelpSection.tsx components/section/blend-onboarding/HelpSection.test.tsx
git commit -m "feat: add HelpSection with WhatsApp CTA and click tracking"
```

---

### Task 9: `ReorderSection` — final CTA

**Files:**
- Create: `components/section/blend-onboarding/ReorderSection.tsx`
- Test: `components/section/blend-onboarding/ReorderSection.test.tsx`

**Interfaces:**
- Produces: `ReorderSection()` — client component. Primary link to `/product/biji-kopi-blend-5050-kopi-susu-ekonomis` firing `trackBlendEvent("reorder_clicked")` on click; secondary link to `/katalog` (untracked).
- Consumes: `Link` from `next/link` (existing), `trackBlendEvent` from `@/lib/data/blend-50-50` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/ReorderSection.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReorderSection } from "./ReorderSection";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReorderSection", () => {
  it("links the primary CTA to the Blend 50:50 product page", () => {
    render(<ReorderSection />);
    expect(screen.getByRole("link", { name: "Pesan Ulang Blend 50:50" })).toHaveAttribute(
      "href",
      "/product/biji-kopi-blend-5050-kopi-susu-ekonomis"
    );
  });

  it("links the secondary CTA to the catalog", () => {
    render(<ReorderSection />);
    expect(screen.getByRole("link", { name: "Jelajahi Kopi Lainnya" })).toHaveAttribute(
      "href",
      "/katalog"
    );
  });

  it("fires reorder_clicked when the primary CTA is clicked", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    render(<ReorderSection />);
    fireEvent.click(screen.getByRole("link", { name: "Pesan Ulang Blend 50:50" }));
    expect(trackBlendEvent).toHaveBeenCalledWith("reorder_clicked");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/ReorderSection.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/ReorderSection.tsx
"use client";

import Link from "next/link";
import { trackBlendEvent } from "@/lib/data/blend-50-50";

export function ReorderSection() {
  return (
    <section className="border-t border-white/10 py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-xl font-semibold">Menikmati Blend 50:50?</h2>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--secondary))]">
          Pesan langsung dari AGRoastery dan nikmati harga terbaik kami. Hemat hingga 11%
          dibanding harga marketplace.
        </p>
        <Link
          href="/product/biji-kopi-blend-5050-kopi-susu-ekonomis"
          onClick={() => trackBlendEvent("reorder_clicked")}
          className="mt-6 inline-block rounded-full bg-[hsl(var(--primary))] px-6 py-3 text-sm font-medium text-black"
        >
          Pesan Ulang Blend 50:50
        </Link>
        <div className="mt-4">
          <Link
            href="/katalog"
            className="text-sm underline underline-offset-4 text-[hsl(var(--secondary))]"
          >
            Jelajahi Kopi Lainnya
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/ReorderSection.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/ReorderSection.tsx components/section/blend-onboarding/ReorderSection.test.tsx
git commit -m "feat: add ReorderSection final CTA with click tracking"
```

---

### Task 10: `OnboardingStartTracker` — fires `onboarding_started` once on mount

**Files:**
- Create: `components/section/blend-onboarding/OnboardingStartTracker.tsx`
- Test: `components/section/blend-onboarding/OnboardingStartTracker.test.tsx`

**Interfaces:**
- Produces: `OnboardingStartTracker()` — client component, renders `null`. Fires `trackBlendEvent("onboarding_started")` exactly once on mount.
- Consumes: `trackBlendEvent` from `@/lib/data/blend-50-50` (Task 1).

- [ ] **Step 1: Write the failing test**

```tsx
// components/section/blend-onboarding/OnboardingStartTracker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { OnboardingStartTracker } from "./OnboardingStartTracker";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingStartTracker", () => {
  it("fires onboarding_started exactly once on mount", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    const { rerender } = render(<OnboardingStartTracker />);
    rerender(<OnboardingStartTracker />);
    expect(trackBlendEvent).toHaveBeenCalledTimes(1);
    expect(trackBlendEvent).toHaveBeenCalledWith("onboarding_started");
  });

  it("renders nothing visible", () => {
    const { container } = render(<OnboardingStartTracker />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/section/blend-onboarding/OnboardingStartTracker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// components/section/blend-onboarding/OnboardingStartTracker.tsx
"use client";

import { useEffect, useRef } from "react";
import { trackBlendEvent } from "@/lib/data/blend-50-50";

export function OnboardingStartTracker() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackBlendEvent("onboarding_started");
  }, []);

  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/section/blend-onboarding/OnboardingStartTracker.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/section/blend-onboarding/OnboardingStartTracker.tsx components/section/blend-onboarding/OnboardingStartTracker.test.tsx
git commit -m "feat: add OnboardingStartTracker for onboarding_started event"
```

---

### Task 11: Page composition, smooth scroll, and manual verification

**Files:**
- Create: `app/start/blend-50-50/page.tsx`
- Modify: `app/layout.tsx:38` (add `className="scroll-smooth"` to `<html>`)
- Test: `app/start/blend-50-50/page.test.tsx`

**Interfaces:**
- Consumes: `Hero` (Task 3), `RecipeSection` (Task 5), `IngredientsSection` (Task 6), `TroubleshootingSection` (Task 7), `HelpSection` (Task 8), `ReorderSection` (Task 9), `OnboardingStartTracker` (Task 10), `recipes` from `@/lib/data/blend-50-50` (Task 1).
- Produces: default-exported `Blend5050OnboardingPage()` server component and a `metadata` export, mounted at route `/start/blend-50-50`.

- [ ] **Step 1: Write the failing test**

```tsx
// app/start/blend-50-50/page.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Blend5050OnboardingPage from "./page";

describe("Blend5050OnboardingPage", () => {
  it("renders the hero, all three recipe sections, ingredients, troubleshooting, help, and reorder CTAs", () => {
    render(<Blend5050OnboardingPage />);
    expect(screen.getByRole("heading", { name: "Blend 50:50" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Espresso" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Iced Americano" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Es Kopi Susu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bahan yang Digunakan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Troubleshooting" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pesan Ulang Blend 50:50" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/start/blend-50-50/page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```tsx
// app/start/blend-50-50/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/section/blend-onboarding/Hero";
import { RecipeSection } from "@/components/section/blend-onboarding/RecipeSection";
import { IngredientsSection } from "@/components/section/blend-onboarding/IngredientsSection";
import { TroubleshootingSection } from "@/components/section/blend-onboarding/TroubleshootingSection";
import { HelpSection } from "@/components/section/blend-onboarding/HelpSection";
import { ReorderSection } from "@/components/section/blend-onboarding/ReorderSection";
import { OnboardingStartTracker } from "@/components/section/blend-onboarding/OnboardingStartTracker";
import { recipes } from "@/lib/data/blend-50-50";

export const metadata: Metadata = {
  title: "Panduan Seduh Blend 50:50 | AGRoastery",
  description:
    "Resep dan panduan menyeduh Blend 50:50 langsung dari AGRoastery — espresso, iced americano, dan es kopi susu.",
  openGraph: {
    title: "Panduan Seduh Blend 50:50 | AGRoastery",
    description: "Resep dan panduan menyeduh Blend 50:50 langsung dari AGRoastery.",
  },
};

export default function Blend5050OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl">
      <OnboardingStartTracker />
      <div className="px-6 pt-8">
        <Link href="/" className="text-sm font-medium tracking-wide text-[hsl(var(--secondary))]">
          AGRoastery
        </Link>
      </div>
      <Hero />
      {recipes.map((recipe) => (
        <RecipeSection key={recipe.id} recipe={recipe} />
      ))}
      <IngredientsSection />
      <TroubleshootingSection />
      <HelpSection />
      <ReorderSection />
    </main>
  );
}
```

Also modify `app/layout.tsx` (add smooth scrolling for the hero's anchor-link navigation — harmless app-wide):

```tsx
// app/layout.tsx — change:
      <html lang="en">
// to:
      <html lang="en" className="scroll-smooth">
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/start/blend-50-50/page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: All tests pass (existing suite + all new tests from Tasks 1–11).

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 7: Manual verification in browser**

Run: `npm run dev`, then open `http://localhost:3000/start/blend-50-50`.

Check:
- Page renders with no shared Navbar/Footer/cart icon — only the small "AGRoastery" wordmark.
- Hero CTA buttons smooth-scroll to the correct recipe section.
- All 3 recipes, ingredients, troubleshooting cards, WhatsApp button, and reorder CTA render correctly.
- Mobile viewport (375px width): CTAs and cards stack vertically, no horizontal overflow.
- Open browser devtools Network tab, confirm `onboarding_started` fires once on load (if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in `.env.local`; GA4 requests go to `google-analytics.com/g/collect` or similar — check via Network tab filtering on "collect").
- Scroll through recipe sections and confirm `brew_guide_viewed` fires once per recipe (not repeatedly) and troubleshooting fires once.
- Click WhatsApp button — confirm it opens `wa.me` in a new tab and `whatsapp_clicked` fires.
- Click reorder CTA — confirm it navigates to `/product/biji-kopi-blend-5050-kopi-susu-ekonomis` and `reorder_clicked` fires.

- [ ] **Step 8: Commit**

```bash
git add app/start/blend-50-50/page.tsx app/start/blend-50-50/page.test.tsx app/layout.tsx
git commit -m "feat: compose Blend 50:50 onboarding page at /start/blend-50-50"
```

---

## Final Check

- [ ] All 5 GA4 events (`onboarding_started`, `brew_guide_viewed`, `troubleshooting_viewed`, `whatsapp_clicked`, `reorder_clicked`) verified firing with `product`/`version` in the browser Network tab.
- [ ] `npm test` and `npm run lint` both pass.
- [ ] Manual browser check confirms mobile responsiveness, no Navbar/Footer leakage, and correct anchor scrolling.
