# Checkout Prefill for Logged-In Users Without Saved Addresses — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a logged-in user has no saved addresses, prefill `Data Penerima` fields (`fullName`, `phone`, `email`) from `profiles` table + Supabase auth `user.email`.

**Architecture:** Add a client-side `useEffect` in `app/(root)/checkout/page.tsx` that queries the `profiles` row via `createSupabaseBrowserClient()` when `user` exists, addresses are loaded, and `addresses.length === 0`. Prefill only non-dirty form fields.

**Tech Stack:** Next.js 16, React Hook Form, Supabase `@supabase/ssr`, TypeScript

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `app/(root)/checkout/page.tsx` | Modify | Add profile fetch + prefill logic |

---

### Task 1: Add `createSupabaseBrowserClient` import

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

- [ ] **Step 1: Add import**

Add this import alongside existing imports (around line 39, near other supabase/client imports):

```typescript
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
```

- [ ] **Step 2: Verify import resolves**

Run: `pnpm tsc --noEmit`
Expected: No new TypeScript errors.

---

### Task 2: Add profile fetch state and useEffect

**Files:**
- Modify: `app/(root)/checkout/page.tsx`

- [ ] **Step 1: Add `profilePrefilled` ref**

Near other refs/state declarations (around line 63, after `idempotencyKey` ref):

```typescript
const profilePrefilledRef = useRef(false);
```

- [ ] **Step 2: Add profile prefill useEffect**

Insert after the existing `useEffect` at line 215 (the one that handles address loading). This new effect runs when the user is logged in, addresses are done loading, and no addresses exist:

```typescript
useEffect(() => {
  if (!user || isLoadingAddresses || profilePrefilledRef.current) return;
  if (addresses.length > 0) return;

  profilePrefilledRef.current = true;

  const supabase = createSupabaseBrowserClient();
  supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single()
    .then(({ data, error }) => {
      if (error || !data) return;

      if (!form.getFieldState("fullName").isDirty) {
        form.setValue("fullName", data.full_name ?? "", { shouldValidate: true });
      }
      if (!form.getFieldState("phone").isDirty) {
        form.setValue("phone", data.phone ?? "", { shouldValidate: true });
      }
      if (!form.getFieldState("email").isDirty && user.email) {
        form.setValue("email", user.email, { shouldValidate: true });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, isLoadingAddresses, addresses]);
```

- [ ] **Step 3: Verify no lint/type errors**

Run: `pnpm lint`
Expected: No new lint errors in `app/(root)/checkout/page.tsx`.

Run: `pnpm tsc --noEmit`
Expected: No new TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/(root)/checkout/page.tsx
git commit -m "feat: prefill checkout Data Penerima from profile when no saved addresses"
```

---

### Task 3: Manual verification

**Files:**
- None (runtime verification)

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Test Case A — Logged-in, no addresses, profile exists**

1. Sign in with a test Google account
2. Ensure `profiles` row exists with `full_name` and `phone` for this user
3. Delete all saved addresses for this user (or use a fresh test account)
4. Add item to cart, go to `/checkout`
5. **Expected:** `Nama Lengkap` prefilled with `profiles.full_name`, `Nomor HP` with `profiles.phone`, `Email` with auth email
6. **Expected:** Shipping calculation does not trigger (no postal code / lat/lng yet)

- [ ] **Step 3: Test Case B — Logged-in, no addresses, profile missing**

1. Use a test account where `profiles` row does NOT exist
2. Go to `/checkout`
3. **Expected:** All `Data Penerima` fields empty (same as current behavior)

- [ ] **Step 4: Test Case C — User types before fetch completes**

1. Throttle network to "Slow 3G" in DevTools
2. Load `/checkout`
3. Immediately start typing in `Nama Lengkap`
4. **Expected:** Typed value preserved, profile fetch does not overwrite

- [ ] **Step 5: Test Case D — Logged-in with saved addresses**

1. Ensure user has at least one saved address
2. Go to `/checkout`
3. **Expected:** Default address selected and prefilled (existing behavior unchanged)

- [ ] **Step 6: Test Case E — Guest checkout**

1. Sign out
2. Go to `/checkout`
3. **Expected:** All fields empty, guest email field shown (existing behavior unchanged)

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Fetch `profiles` row client-side | Task 2, Step 2 |
| Prefill `fullName` from `profiles.full_name` | Task 2, Step 2 |
| Prefill `phone` from `profiles.phone` | Task 2, Step 2 |
| Prefill `email` from `user.email` | Task 2, Step 2 |
| Respect dirty fields (user input guard) | Task 2, Step 2 (`.isDirty` checks) |
| Graceful fallback when profile missing | Task 2, Step 2 (`if (error \|\| !data) return`) |
| Single file scope | All tasks target `app/(root)/checkout/page.tsx` only |
| No schema/API/hook changes | Plan contains no such tasks |

## Placeholder Scan

- No "TBD", "TODO", "implement later" found.
- All code blocks contain complete, runnable code.
- Exact file paths specified throughout.

## Type Consistency Check

- `createSupabaseBrowserClient` — matches existing import pattern in codebase (used in `useAuth.ts`)
- `profiles` table columns: `full_name`, `phone` — confirmed in `lib/supabase/types.ts`
- `user.email` — standard Supabase `User` type
- `form.getFieldState` and `form.setValue` — standard react-hook-form API, already used in this file
