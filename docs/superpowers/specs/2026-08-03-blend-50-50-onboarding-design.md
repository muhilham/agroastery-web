# Blend 50:50 Onboarding Page — Design Spec

## Context

Most first-time Blend 50:50 buyers purchase via Tokopedia/Shopee, not agroastery.com. The printed recipe card shipped with the coffee carries a QR code pointing to this page.

This is a **product onboarding page**, not a marketing or ecommerce page. Its job is to help the customer brew Blend 50:50 exactly as AGRoastery intends, before any selling happens. Visual tone: Apple documentation / Linear.app — minimal, calm, spacious, typography-first. No banners, popups, carousels, testimonials, or unnecessary animation.

Business goal: convert a good first brewing experience into a direct-to-agroastery.com repeat customer, via a single low-pressure reorder CTA at the very end.

Audience: home espresso users, small coffee shop owners, offices, restaurants. Not assumed to be beginners or experts.

## Content Order (fixed, never reversed)

1. What is this coffee designed for?
2. How should I brew it?
3. What should it taste like?
4. What do I do if my result is different?
5. Where can I get help?
6. If I enjoy it, how do I reorder?

## Route

`/start/blend-50-50` — standalone route, **outside** the `(root)` route group. No shared Navbar/Footer/cart icon from the rest of the ecommerce app. Own minimal header: small AGRoastery wordmark linking to `/`, nothing else.

Chosen over `/resep/blend-50-50` or `/blend-50-50` so future blends' onboarding pages live under the same `/start/*` prefix (e.g. `/start/single-origin-x`).

## Language

Indonesian primary copy (headings, instructions, troubleshooting, CTAs) — matches the marketplace-buyer audience. Taste-profile words stay as short English/loanword tasting tags (Chocolate, Earthy, Bold, Nutty, Starch-like oat, etc.), matching how the printed recipe card already presents them.

## File Structure

```
app/start/blend-50-50/page.tsx          — server component, composes sections, sets metadata
lib/data/blend-50-50.ts                 — typed content + versioning constants
components/section/blend-onboarding/
  Hero.tsx                — title, ID intro line, 3 CTA buttons (plain anchor scroll links)
  RecipeCard.tsx           — dose/yield/time table + taste-tag pills; one per brew method
  IngredientsSection.tsx   — water/milk/aren syrup/liquid creamer list
  TroubleshootingCard.tsx  — question/answer card
  HelpSection.tsx          — WhatsApp CTA, reuses lib/whatsapp.ts buildWhatsAppLink
  ReorderSection.tsx       — final CTA
  ViewTracker.tsx          — client component, IntersectionObserver, ref-guarded fire-once wrapper
```

`ViewTracker` is a generic, reusable primitive (not named after "section" or tied to "onboarding") so it can wrap any element on any future page that needs scroll-into-view analytics.

## Data Model (`lib/data/blend-50-50.ts`)

```ts
export const PRODUCT_SLUG = "blend-50-50";
export const CONTENT_VERSION = "2026-08"; // bump whenever recipe dose/yield/time copy changes

export type Recipe = {
  id: "espresso" | "iced_americano" | "es_kopi_susu";
  title: string;
  steps: { label: string; value: string }[]; // e.g. { label: "Dose", value: "18g" }
  tasteProfile: string[];
  note?: string;
};

export type Troubleshooting = {
  question: string;
  answer: string;
};

export const recipes: Recipe[] = [ /* Espresso, Iced Americano, Es Kopi Susu — verbatim from print card, ID-translated */ ];
export const ingredients: { name: string; detail: string }[] = [ /* Aqua, Diamond Full Cream UHT, Mahorahora aren, liquid creamer mix */ ];
export const troubleshooting: Troubleshooting[] = [ /* 4 entries from print card */ ];
```

`CONTENT_VERSION` exists so that when the recipe is tuned later (e.g. yield 40g → 42g, time 26–29s → 28s), analytics can distinguish which recipe version drove which outcomes — without relying on the URL or deploy date to infer it.

## Components & Layout

- **Hero**: "Blend 50:50" title, "Dirancang untuk minuman berbasis susu." subhead, one-sentence framing, 3 large CTA buttons (Espresso / Iced Americano / Es Kopi Susu) that plain-anchor-scroll to their sections (`scroll-behavior: smooth`, `scroll-margin-top` on target sections — no JS scrollspy, no sticky nav).
- **RecipeCard** × 3: dose/yield/time (or full recipe steps for Iced Americano / Es Kopi Susu), taste-profile pills, optional note ("recommended starting point, adjust for your grinder/machine").
- **IngredientsSection**: Aqua, Diamond Full Cream UHT, Mahorahora liquid aren, liquid creamer (with its own sub-recipe: 50g creamer powder + 50g Aqua, blended smooth).
- **TroubleshootingCard** × 4: question/answer pairs, card layout.
- **HelpSection**: short copy + large WhatsApp button via `buildWhatsAppLink()`.
- **ReorderSection**: calm, non-aggressive — "Enjoying Blend 50:50?" headline, direct-price/save-11% copy, primary "Reorder Blend 50:50" button → `/product/biji-kopi-blend-5050-kopi-susu-ekonomis`, secondary "Explore Other Coffees" link → `/katalog`.

## Visual Style

- Reuse existing app CSS tokens (`--primary`/`--secondary`/`--background` HSL vars — already a coffee/cream-on-dark palette), Montserrat (no font override).
- Single dark theme only — no light/dark toggle (app has no such infra anywhere today; out of scope here).
- Rounded corners, very light shadows, no gradients, no marketing illustrations.
- Icons only where they aid comprehension: `lucide-react` (droplet, timer, help-circle, etc.), `react-icons` `FaWhatsapp` on the WhatsApp button.
- Mobile-first: CTAs and cards stack vertically on mobile, grid on desktop.

## Analytics (GA4)

All events fire through one helper, `trackBlendEvent(eventName, params?)`, that auto-merges `{ product: PRODUCT_SLUG, version: CONTENT_VERSION }` into every call. No event on this page calls the generic `trackEvent()` directly, so `product`/`version` can never be accidentally omitted — analytics must never rely on inferring context from the page URL.

| Event | Trigger | Extra params |
|---|---|---|
| `onboarding_started` | Once, on page mount | — |
| `brew_guide_viewed` | Once per brew method, when that `RecipeCard`'s section scrolls into view (via `ViewTracker`, ref-guarded) | `brew_method: "espresso" \| "iced_americano" \| "es_kopi_susu"` |
| `troubleshooting_viewed` | Once, when the troubleshooting section scrolls into view (via `ViewTracker`) | — |
| `whatsapp_clicked` | On WhatsApp button click | — |
| `reorder_clicked` | On Reorder button click | — |

## Accessibility / SEO

- Semantic `h1`/`h2` hierarchy matching the fixed content order.
- Real `<button>`/`<a>` elements, no div-click handlers.
- Indexable (no `noindex` — this is a durable, real URL, not a landing-page throwaway).
- Standard Next.js `metadata` export (title, description, OpenGraph) per existing app conventions.

## Out of Scope

- Light/dark theme toggle (app-wide infra doesn't exist; single dark theme only).
- Supabase-backed/editable content (static TS data file is sufficient for one blend; revisit only if ops needs to edit copy without a developer).
- Sticky scroll-spy navigation (plain anchor scroll is enough; avoids extra JS and animation).
- Any assumption about the customer's skill level (recipes and troubleshooting are written for a range from home enthusiast to professional).

## Success Criteria

A first-time customer finishes the page thinking "I now know exactly how AGRoastery intended this coffee to be brewed" — not "I just visited another ecommerce page." Reorder CTA appears only after help is fully delivered, never before.
