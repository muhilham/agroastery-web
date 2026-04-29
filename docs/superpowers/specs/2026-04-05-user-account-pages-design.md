# User Account Pages — Design Spec

**Date:** 2026-04-05
**Branch:** claude/review-pr-7AjrY

## Context

The app has auth (Google OAuth via Supabase) and order history pages (`/orders`, `/orders/[id]`) already built. Missing are the user account management pages: profile editing and saved delivery addresses. These are needed so logged-in users can maintain their details without re-entering them at checkout.

## Routes

```
/account                          Server component — profile view + edit
/account/addresses                Server component — saved address list
/account/addresses/new            Client-heavy — add address (map picker)
/account/addresses/[id]/edit      Client-heavy — edit address (map picker)
```

All four routes redirect to `/login?next=/account` if no session.

## Data Layer

### New Supabase query files

**`lib/supabase/queries/profiles.ts`**
- `getProfile(supabase, userId)` — fetches `profiles` row; returns null if not found
- `upsertProfile(supabase, userId, data: { full_name, phone })` — create or update

**`lib/supabase/queries/addresses.ts`**
- `getAddresses(supabase, userId)` — all addresses, ordered `is_default DESC, created_at ASC`
- `getAddressById(supabase, id, userId)` — single address (edit pre-fill); returns null if not found or not owned

### New API routes

| Method | Route | Action |
|---|---|---|
| PATCH | `/api/account/profile` | Update `full_name`, `phone` in `profiles` (upsert) |
| GET | `/api/account/addresses` | List addresses for authed user |
| POST | `/api/account/addresses` | Create new address |
| PUT | `/api/account/addresses/[id]` | Update address |
| DELETE | `/api/account/addresses/[id]` | Delete address (unsets `default_address_id` in profiles if it was default) |
| PATCH | `/api/account/addresses/[id]/default` | Set as default (unsets previous default in same transaction) |

All routes use `createSupabaseServerClient()` (SSR, RLS-enforced). All inputs validated with Zod.

## Components

### New: `components/section/address-form/index.tsx`

Reusable client component. The checkout page is **not changed** — it keeps its embedded form.

**Props:** `onSubmit(data: AddressFormValues)`, `defaultValues?: Partial<AddressFormValues>`, `isLoading?: boolean`, `submitLabel?: string`

**Fields:**
- `label` — text input (e.g. "Rumah", "Kantor")
- `recipient_name` — text input (min 2 chars)
- `phone` — text input
- `address_line` — textarea (min 10 chars)
- `postal_code` — text input (5 digits)
- `lat`, `lng` — optional, from MapPicker

**Reuses:** `MapPicker` (`components/map/MapPicker.tsx`), `AddressSearch` (`components/map/AddressSearch.tsx`), React Hook Form + Zod, existing UI form components (`components/ui/form.tsx`, `input.tsx`, `textarea.tsx`, `button.tsx`).

### New pages

**`app/(root)/account/page.tsx`** — Server component
- Fetches profile server-side via `getProfile()`
- Renders `ProfileEditForm` (client component) pre-filled with full_name and phone
- Shows links to `/account/addresses` and `/orders`

**`app/(root)/account/addresses/page.tsx`** — Server component
- Fetches addresses via `getAddresses()`
- Renders address cards with Edit / Delete / Set Default actions
- "Add address" button → navigates to `/account/addresses/new`

**`app/(root)/account/addresses/new/page.tsx`** — Client wrapper
- Renders `AddressForm` with empty defaults
- On submit → `POST /api/account/addresses` → `router.push('/account/addresses')`

**`app/(root)/account/addresses/[id]/edit/page.tsx`** — Server component (pre-fetch) + client form
- Server side: fetches address by ID; returns 404 page if not found or not owned
- Renders `AddressForm` pre-filled with existing values
- On submit → `PUT /api/account/addresses/[id]` → `router.push('/account/addresses')`

### Navigation update

**`components/navigation/index.tsx`** — Add "Account" link (pointing to `/account`) alongside the existing user menu links in both desktop and mobile nav.

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Unauthenticated visit | Redirect to `/login?next=/account` |
| Profile row doesn't exist yet | `upsertProfile()` creates it on first save |
| Deleting the default address | API unsets `profiles.default_address_id` before deleting the address row |
| Address ID not owned by user | API returns 404 (RLS prevents reading; 404 not 403 to avoid enumeration) |
| Address form submitted without coordinates | `lat`/`lng` stored as null — postal code used for shipping calculation |
| `/account/addresses/[id]/edit` with unknown ID | Server component returns 404 page |

## Out of Scope

- Pre-filling checkout from saved addresses (separate future feature)
- Email display/editing (managed by Google OAuth)
- Order cancellation or order detail actions
- Password management (app uses Google OAuth only)
