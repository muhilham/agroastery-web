# Checkout Prefill for Logged-In Users Without Saved Addresses

## Problem
When a logged-in user reaches checkout with no saved addresses, `Data Penerima` fields remain empty even though `profiles.full_name`, `profiles.phone`, and `user.email` exist. The current code only prefills from the `addresses` array and does nothing when `addresses.length === 0`.

## Solution
Fetch the `profiles` row client-side in `app/(root)/checkout/page.tsx` and prefill `fullName`, `phone`, and `email` when the user is logged in and has zero saved addresses.

## Scope
**Single file only:** `app/(root)/checkout/page.tsx`

No new hooks, components, API routes, or schema changes.

## Data Flow

```
User loads /checkout (logged-in, no addresses)
  → useAuth returns user
  → useAddresses returns empty array
  → Existing useEffect (line 199) sets selectedAddressId = "new"
  → NEW: useEffect fetches profiles row via Supabase browser client
  → If profile found: setValue("fullName", profile.full_name)
                    setValue("phone", profile.phone)
                    setValue("email", user.email)
  → Form renders with prefilled Data Penerima
```

## Implementation Details

### When to run
Trigger a profile fetch when **all** true:
- `user` is not null
- `isLoadingAddresses` is false
- `addresses.length === 0`
- Profile not already fetched (guard via ref)

### What to fetch
```typescript
const supabase = createSupabaseBrowserClient();
const { data } = await supabase
  .from("profiles")
  .select("full_name, phone")
  .eq("id", user.id)
  .single();
```

RLS on `profiles` allows authenticated reads, so no admin client needed.

### What to prefill
| Field | Source |
|---|---|
| `fullName` | `profiles.full_name` |
| `phone` | `profiles.phone` |
| `email` | `user.email` (from Supabase auth) |

### Guard: respect user input
Only set values if field is **not dirty** (user hasn't typed yet):
```typescript
if (!form.getFieldState("fullName").isDirty) {
  form.setValue("fullName", profile.full_name ?? "");
}
```

### Graceful fallback
If `profiles` row missing or fetch errors, leave fields empty — same as current behavior.

## Testing Notes
- Case: logged-in, no addresses, profile exists → fields prefilled
- Case: logged-in, no addresses, profile missing → fields empty
- Case: logged-in, has addresses → existing behavior unchanged
- Case: guest → unchanged
- Case: user starts typing before fetch completes → typed values preserved

## Files Changed
- `app/(root)/checkout/page.tsx` — add profile fetch + prefill logic

## Approaches Considered
| Approach | Why Not Chosen |
|---|---|
| B. Include profile in auth store | Adds complexity to global auth state for a single-page need |
| C. API route `/api/account/me` | Overkill for one extra Supabase query client-side |
