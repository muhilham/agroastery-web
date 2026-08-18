# Resting Period Helper Page — Design

**Date:** 2026-08-18
**Status:** Approved (design)

## Summary

A standalone customer-facing page that helps coffee drinkers track the resting period of their beans. User enters a roast date; the page shows the calendar dates for days 3, 7, 14, and 21 after roast, plus which rest day today is. The roast date lives in the URL (`?roast=YYYY-MM-DD`) so any state is shareable by copying the link.

## Requirements

- Manual roast date input (date picker)
- Milestone dates for rest days 3, 7, 14, 21
- "Today is day N" indicator based on roast date
- Copy URL button for sharing the current state
- English UI labels; dates rendered in written-out Indonesian style ("4 Agustus 2026")
- "Today" computed in WIB (Asia/Jakarta), independent of visitor's local timezone
- Discoverable via footer link

## Approach

Client-side single page (chosen from three options considered):

- **A (chosen): Client-side single page.** Server shell exports metadata only; client component reads `?roast=` from `useSearchParams()`, does all date math locally, updates the URL with `router.replace()` on change. Instant interaction, URL is the source of truth.
- **B (rejected): Server reads searchParams, client island.** Same output but a server round trip on every date change — no benefit for a pure calculator.
- **C (rejected): Path param `/resting-period/[roastDate]`.** Prettier URLs, but requires separate input-state handling when no date is in the path, and editing the date becomes navigation. Worse UX for a tool.

## Architecture

### Files

| File | Purpose |
|---|---|
| `app/(root)/resting-period/page.tsx` | Server component. Exports `metadata` (title "Resting Period", English description). Renders the client component inside a `<Suspense>` boundary (Next.js requirement for `useSearchParams` on static pages). |
| `components/resting-period/index.tsx` | Client component. All logic: param parsing, date math, rendering, copy button. |
| `constant/menu-list.ts` | Add `{ href: "/resting-period", label: "Resting Period" }` to `footer` list. Nav header stays unchanged. |
| `components/ui/footer.tsx` | Footer currently hardcodes `target="_blank"` on every link. Detect internal hrefs (starting with `/`) and render them without `target`/`rel` so the page opens in the same tab. |

### State & URL

- `useSearchParams()` reads `roast` param (`YYYY-MM-DD`).
- Date input bound to the param. On change: `router.replace(?roast=...)` with `scroll: false` — no history spam.
- Invalid or absent param → empty state prompting the user to pick a date.
- Copy button: `navigator.clipboard.writeText(window.location.href)`, "Copied!" feedback for 2 seconds. If the Clipboard API is unavailable or rejected, show the full URL in a readonly input so the user can copy it manually. Compatible with `trailingSlash: true` config.

### Date Math

- **"Today" in WIB:** `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })` yields a `YYYY-MM-DD` string for the current WIB date. Day count is a pure calendar-day diff between roast date and WIB-today. No local timezone is ever consulted, so every visitor of a shared URL sees the same day count.
- **Day numbering:** roast day itself is day 0. Day N = roast date + N calendar days.
- **Milestones:** 3, 7, 14, 21. Milestone dates are pure calendar math on the roast date — timezone-independent.
- **Status badges per milestone:** `Today` (milestone date equals WIB today) / `In X days` (future) / `X days ago` (past).
- **Future roast date:** banner state "Not roasted yet"; milestone dates still shown.
- **Banner:** "Today is day N since roast on 4 Agustus 2026".
- **Date display:** `Intl` `id-ID` written-out format → "4 Agustus 2026". UI labels stay English.

## UI / Styling

- Dark theme matching site: `background` (#1a1a1a), `foreground` (#f5ebc9).
- Tailwind with project custom screens (`sm`/`md`/`lg`/`tablet`/`desktop`), mobile-first.
- Layout: date input + copy button at top; today's day number as hero element; milestones as a card/row list with status badges.

## Error Handling & Edge Cases

- `roast` param invalid → ignored, empty state shown.
- No UTC timestamp math anywhere → no off-by-one across timezones.
- Clipboard API unavailable/failed → fallback, no crash.
- `useSearchParams` wrapped in Suspense to keep the page statically renderable.

## Testing

Vitest + jsdom (run via `pnpm test`), component tests for:

- Valid param → correct milestone dates and statuses
- Empty/invalid param → empty state
- WIB "today" computation (mock system time across timezones)
- Copy button interaction (mocked clipboard, "Copied!" feedback)
- Future roast date → "Not roasted yet" state

## Out of Scope

- Brew-method-specific rest recommendations (e.g. filter vs espresso notes)
- User-configurable milestones
- Pulling roast date from order history
- Server-side rendering of computed dates
