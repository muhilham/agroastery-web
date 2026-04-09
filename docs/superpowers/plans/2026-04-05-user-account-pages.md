# User Account Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/account` (profile edit), `/account/addresses` (saved address CRUD), `/account/addresses/new`, and `/account/addresses/[id]/edit` — all auth-guarded with redirect to `/login?next=/account`.

**Architecture:** Server components fetch user data via `createSupabaseServerClient()` (RLS-enforced). Mutations go through Next.js API routes (Zod-validated). A new reusable `AddressForm` component wraps React Hook Form + Zod + MapPicker. Navigation gains an "Account" link in both desktop and mobile menus.

**Tech Stack:** Next.js 15 App Router, `@supabase/ssr`, React Hook Form + Zod, MapPicker (dynamic import, `ssr: false`), Vitest for unit tests, `node vitest-runner.js` to run tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/supabase/queries/profiles.ts` | Create | `getProfile`, `upsertProfile` |
| `lib/supabase/queries/addresses.ts` | Create | `getAddresses`, `getAddressById` |
| `lib/supabase/queries/profiles.test.ts` | Create | Unit tests for query functions |
| `app/api/account/profile/route.ts` | Create | `PATCH /api/account/profile` |
| `app/api/account/addresses/route.ts` | Create | `GET` + `POST /api/account/addresses` |
| `app/api/account/addresses/[id]/route.ts` | Create | `PUT` + `DELETE /api/account/addresses/[id]` |
| `app/api/account/addresses/[id]/default/route.ts` | Create | `PATCH` set-default |
| `components/section/address-form/index.tsx` | Create | Reusable AddressForm (client component) |
| `app/(root)/account/page.tsx` | Create | Profile page — server component + auth guard |
| `app/(root)/account/ProfileEditForm.tsx` | Create | Profile form (client component) |
| `app/(root)/account/addresses/page.tsx` | Create | Address list — server component |
| `app/(root)/account/addresses/AddressCard.tsx` | Create | Address card with Delete/Set-Default actions (client) |
| `app/(root)/account/addresses/new/page.tsx` | Create | New address page (client page) |
| `app/(root)/account/addresses/[id]/edit/page.tsx` | Create | Edit address — server pre-fetch |
| `app/(root)/account/addresses/[id]/edit/EditAddressForm.tsx` | Create | Edit form (client component) |
| `components/navigation/index.tsx` | Modify | Add "Account" link in desktop and mobile nav |

---

## Task 1: Supabase query functions — profiles and addresses

**Files:**
- Create: `lib/supabase/queries/profiles.ts`
- Create: `lib/supabase/queries/addresses.ts`
- Create: `lib/supabase/queries/profiles.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// lib/supabase/queries/profiles.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getProfile, upsertProfile } from './profiles';
import { getAddresses, getAddressById } from './addresses';

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('getProfile', () => {
  it('returns null when profile not found', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const eq = { single };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getProfile(supabase as any, 'user-1');
    expect(result).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('returns profile data when found', async () => {
    const profile = { id: 'user-1', full_name: 'Budi', phone: '081234567890', default_address_id: null, created_at: '', updated_at: '' };
    const single = vi.fn().mockResolvedValue({ data: profile, error: null });
    const eq = { single };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getProfile(supabase as any, 'user-1');
    expect(result).toEqual(profile);
  });
});

// ─── upsertProfile ────────────────────────────────────────────────────────────

describe('upsertProfile', () => {
  it('calls upsert on profiles table with userId and data', async () => {
    const upsertFn = vi.fn().mockResolvedValue({ error: null });
    const from = { upsert: upsertFn };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    await upsertProfile(supabase as any, 'user-1', { full_name: 'Budi', phone: '081234' });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', full_name: 'Budi', phone: '081234' })
    );
  });
});

// ─── getAddresses ─────────────────────────────────────────────────────────────

describe('getAddresses', () => {
  it('returns addresses ordered by is_default DESC then created_at ASC', async () => {
    const addresses = [
      { id: 'addr-1', user_id: 'user-1', is_default: true },
      { id: 'addr-2', user_id: 'user-1', is_default: false },
    ];
    const finalOrder = vi.fn().mockResolvedValue({ data: addresses, error: null });
    const firstOrder = { order: finalOrder };
    const eq = { order: vi.fn().mockReturnValue(firstOrder) };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddresses(supabase as any, 'user-1');

    expect(result).toEqual(addresses);
    expect(supabase.from).toHaveBeenCalledWith('addresses');
    expect(eq.order).toHaveBeenCalledWith('is_default', { ascending: false });
    expect(finalOrder).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('returns empty array on Supabase error', async () => {
    const finalOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const firstOrder = { order: finalOrder };
    const eq = { order: vi.fn().mockReturnValue(firstOrder) };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddresses(supabase as any, 'user-1');
    expect(result).toEqual([]);
  });
});

// ─── getAddressById ───────────────────────────────────────────────────────────

describe('getAddressById', () => {
  it('returns null when address not found', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const secondEq = { single };
    const firstEq = { eq: vi.fn().mockReturnValue(secondEq) };
    const select = { eq: vi.fn().mockReturnValue(firstEq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddressById(supabase as any, 'addr-1', 'user-1');
    expect(result).toBeNull();
  });

  it('returns address when found and owned by user', async () => {
    const address = { id: 'addr-1', user_id: 'user-1', recipient_name: 'Budi' };
    const single = vi.fn().mockResolvedValue({ data: address, error: null });
    const secondEq = { single };
    const firstEq = { eq: vi.fn().mockReturnValue(secondEq) };
    const select = { eq: vi.fn().mockReturnValue(firstEq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddressById(supabase as any, 'addr-1', 'user-1');
    expect(result).toEqual(address);
    expect(firstEq.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node vitest-runner.js
```

Expected: FAIL — cannot find module `'./profiles'` or `'./addresses'`.

- [ ] **Step 3: Create `lib/supabase/queries/profiles.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  data: { full_name?: string; phone?: string }
): Promise<void> {
  await supabase
    .from('profiles')
    .upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
}
```

- [ ] **Step 4: Create `lib/supabase/queries/addresses.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
};

export async function getAddresses(
  supabase: SupabaseClient,
  userId: string
): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []) as Address[];
}

export async function getAddressById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<Address | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as Address;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
node vitest-runner.js
```

Expected: all tests in `profiles.test.ts` PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/queries/profiles.ts lib/supabase/queries/addresses.ts lib/supabase/queries/profiles.test.ts
git commit -m "feat: add Supabase query functions for profiles and addresses"
```

---

## Task 2: API route — PATCH /api/account/profile

**Files:**
- Create: `app/api/account/profile/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// app/api/account/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { upsertProfile } from '@/lib/supabase/queries/profiles';

const ProfileUpdateSchema = z
  .object({
    full_name: z.string().min(2, 'Minimal 2 karakter').max(100).optional(),
    phone: z.string().min(6, 'Nomor tidak valid').max(20).optional(),
  })
  .refine((d) => d.full_name !== undefined || d.phone !== undefined, {
    message: 'Minimal satu field harus diisi',
  });

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await upsertProfile(supabase, user.id, parsed.data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/account/profile/route.ts
git commit -m "feat: add PATCH /api/account/profile route"
```

---

## Task 3: API routes — addresses CRUD

**Files:**
- Create: `app/api/account/addresses/route.ts`
- Create: `app/api/account/addresses/[id]/route.ts`
- Create: `app/api/account/addresses/[id]/default/route.ts`

- [ ] **Step 1: Create `app/api/account/addresses/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAddresses } from '@/lib/supabase/queries/addresses';

const AddressCreateSchema = z.object({
  label: z.string().max(50).optional(),
  recipient_name: z.string().min(2, 'Minimal 2 karakter').max(100),
  phone: z.string().min(6, 'Nomor tidak valid').max(20),
  address_line: z.string().min(10, 'Alamat terlalu singkat').max(300),
  postal_code: z.string().length(5, 'Kode pos harus 5 digit').optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const addresses = await getAddresses(supabase, user.id);
    return NextResponse.json({ data: addresses });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = AddressCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: parsed.data.label ?? null,
        recipient_name: parsed.data.recipient_name,
        phone: parsed.data.phone,
        address_line: parsed.data.address_line,
        postal_code: parsed.data.postal_code ?? null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create address', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create `app/api/account/addresses/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAddressById } from '@/lib/supabase/queries/addresses';

const AddressUpdateSchema = z.object({
  label: z.string().max(50).optional(),
  recipient_name: z.string().min(2).max(100).optional(),
  phone: z.string().min(6).max(20).optional(),
  address_line: z.string().min(10).max(300).optional(),
  postal_code: z.string().length(5).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const existing = await getAddressById(supabase, id, user.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = AddressUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(parsed.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update address', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Unset default_address_id in profiles if this address was the default
    await supabase
      .from('profiles')
      .update({ default_address_id: null })
      .eq('id', user.id)
      .eq('default_address_id', id);

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete address', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create `app/api/account/addresses/[id]/default/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAddressById } from '@/lib/supabase/queries/addresses';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const existing = await getAddressById(supabase, id, user.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Clear is_default from all user addresses
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set this address as default
    await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id);

    // Update profile default_address_id
    await supabase
      .from('profiles')
      .update({ default_address_id: id })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add "app/api/account/addresses/route.ts" "app/api/account/addresses/[id]/route.ts" "app/api/account/addresses/[id]/default/route.ts"
git commit -m "feat: add addresses CRUD API routes"
```

---

## Task 4: AddressForm reusable component

**Files:**
- Create: `components/section/address-form/index.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/section/address-form/index.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  loading: () => (
    <div className="h-[240px] rounded-lg bg-gray-900 border border-white/10 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
  ssr: false,
});

export const addressFormSchema = z.object({
  label: z.string().max(50).optional(),
  recipient_name: z.string().min(2, "Minimal 2 karakter").max(100),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
  address_line: z.string().min(10, "Alamat terlalu singkat").max(300),
  postal_code: z
    .string()
    .length(5, "Kode pos harus 5 digit")
    .optional()
    .or(z.literal("")),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  onSubmit: (data: AddressFormValues) => void;
  defaultValues?: Partial<AddressFormValues>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function AddressForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  submitLabel = "Simpan",
}: AddressFormProps) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "",
      recipient_name: "",
      phone: "",
      address_line: "",
      postal_code: "",
      ...defaultValues,
    },
  });

  const lat = form.watch("lat");
  const lng = form.watch("lng");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label Alamat</FormLabel>
              <FormControl>
                <Input placeholder="Rumah, Kantor, dll." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipient_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nama Penerima <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap penerima" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nomor HP <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="tel" placeholder="08xxxxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address_line"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Alamat <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Pos</FormLabel>
              <FormControl>
                <Input placeholder="12345" maxLength={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Lokasi Peta (opsional)</p>
          <MapPicker
            value={
              lat !== undefined && lng !== undefined
                ? { lat: lat ?? null, lng: lng ?? null }
                : undefined
            }
            onChange={({ lat, lng }) => {
              form.setValue("lat", lat);
              form.setValue("lng", lng);
            }}
            onAddressChange={(address) => {
              if (!form.getValues("address_line")) {
                form.setValue("address_line", address);
              }
            }}
            height={240}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <LoaderCircle className="animate-spin w-4 h-4 mr-2" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/section/address-form/index.tsx
git commit -m "feat: add reusable AddressForm component"
```

---

## Task 5: /account page — profile view and edit

**Files:**
- Create: `app/(root)/account/ProfileEditForm.tsx`
- Create: `app/(root)/account/page.tsx`

- [ ] **Step 1: Create `app/(root)/account/ProfileEditForm.tsx`**

```typescript
// app/(root)/account/ProfileEditForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().min(2, "Minimal 2 karakter").max(100),
  phone: z.string().min(6, "Nomor tidak valid").max(20),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  initialValues: { full_name: string | null; phone: string | null };
}

export default function ProfileEditForm({ initialValues }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialValues.full_name ?? "",
      phone: initialValues.phone ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Terjadi kesalahan");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor HP</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="08xxxxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-500">Profil berhasil disimpan</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <LoaderCircle className="animate-spin w-4 h-4 mr-2" />}
          Simpan
        </Button>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Create `app/(root)/account/page.tsx`**

```typescript
// app/(root)/account/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries/profiles";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import ProfileEditForm from "./ProfileEditForm";
import { MapPin, ShoppingBag, ChevronRight } from "lucide-react";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const profile = await getProfile(supabase, user.id);

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold text-primary mb-2">Account</h1>
          <p className="text-sm text-white/60 mb-8">{user.email}</p>

          <section className="mb-8">
            <h2 className="text-base font-medium text-primary mb-4">Profile</h2>
            <ProfileEditForm
              initialValues={{
                full_name: profile?.full_name ?? null,
                phone: profile?.phone ?? null,
              }}
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-primary mb-4">Links</h2>
            <Link
              href="/account/addresses"
              className="flex items-center justify-between rounded-xl border border-primary/30 px-4 py-3 text-sm text-primary hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Saved Addresses
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/orders"
              className="flex items-center justify-between rounded-xl border border-primary/30 px-4 py-3 text-sm text-primary hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Order History
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/account/page.tsx" "app/(root)/account/ProfileEditForm.tsx"
git commit -m "feat: add /account profile page"
```

---

## Task 6: /account/addresses page — address list

**Files:**
- Create: `app/(root)/account/addresses/AddressCard.tsx`
- Create: `app/(root)/account/addresses/page.tsx`

- [ ] **Step 1: Create `app/(root)/account/addresses/AddressCard.tsx`**

```typescript
// app/(root)/account/addresses/AddressCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Address } from "@/lib/supabase/queries/addresses";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Trash2, Star } from "lucide-react";

interface AddressCardProps {
  address: Address;
}

export default function AddressCard({ address }: AddressCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Hapus alamat ini?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}/default`, {
        method: "PATCH",
      });
      if (res.ok) router.refresh();
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">
              {address.label ?? "Alamat"}
            </span>
            {address.is_default && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-white/80 mt-1">
            {address.recipient_name} · {address.phone}
          </p>
          <p className="text-sm text-white/60 mt-0.5">{address.address_line}</p>
          {address.postal_code && (
            <p className="text-xs text-white/40 mt-0.5">
              Kode pos: {address.postal_code}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/account/addresses/${address.id}/edit`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Link>

        {!address.is_default && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-auto py-0 px-1 text-primary/70 hover:text-primary"
            onClick={handleSetDefault}
            disabled={isSettingDefault}
          >
            <Star className="w-3 h-3 mr-1" />
            Jadikan Default
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-auto py-0 px-1 text-destructive/70 hover:text-destructive ml-auto"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Hapus
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(root)/account/addresses/page.tsx`**

```typescript
// app/(root)/account/addresses/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAddresses } from "@/lib/supabase/queries/addresses";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import AddressCard from "./AddressCard";
import { Plus, ChevronLeft } from "lucide-react";

export default async function AddressesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/account/addresses");
  }

  const addresses = await getAddresses(supabase, user.id);

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/account" className="text-primary/60 hover:text-primary">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-primary">Saved Addresses</h1>
          </div>

          {addresses.length === 0 ? (
            <p className="text-sm text-white/60 text-center py-12">
              No saved addresses yet.
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {addresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}
            </div>
          )}

          <Link
            href="/account/addresses/new"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 px-4 py-3 text-sm text-primary hover:bg-primary/10 mt-4"
          >
            <Plus className="w-4 h-4" />
            Add New Address
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/account/addresses/page.tsx" "app/(root)/account/addresses/AddressCard.tsx"
git commit -m "feat: add /account/addresses list page"
```

---

## Task 7: /account/addresses/new page

**Files:**
- Create: `app/(root)/account/addresses/new/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// app/(root)/account/addresses/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import AddressForm, { type AddressFormValues } from "@/components/section/address-form";
import { ChevronLeft } from "lucide-react";

export default function NewAddressPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: data.label || undefined,
          recipient_name: data.recipient_name,
          phone: data.phone,
          address_line: data.address_line,
          postal_code: data.postal_code || undefined,
          latitude: data.lat ?? null,
          longitude: data.lng ?? null,
        }),
      });
      if (res.ok) {
        router.push("/account/addresses");
      } else {
        const json = await res.json();
        setError(json.error ?? "Terjadi kesalahan");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/account/addresses"
              className="text-primary/60 hover:text-primary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-primary">Add Address</h1>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <AddressForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Save Address"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(root)/account/addresses/new/page.tsx"
git commit -m "feat: add /account/addresses/new page"
```

---

## Task 8: /account/addresses/[id]/edit page

**Files:**
- Create: `app/(root)/account/addresses/[id]/edit/page.tsx`
- Create: `app/(root)/account/addresses/[id]/edit/EditAddressForm.tsx`

- [ ] **Step 1: Create `EditAddressForm.tsx`**

```typescript
// app/(root)/account/addresses/[id]/edit/EditAddressForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import AddressForm, { type AddressFormValues } from "@/components/section/address-form";
import type { Address } from "@/lib/supabase/queries/addresses";
import { ChevronLeft } from "lucide-react";

interface EditAddressFormProps {
  address: Address;
}

export default function EditAddressForm({ address }: EditAddressFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: data.label || undefined,
          recipient_name: data.recipient_name,
          phone: data.phone,
          address_line: data.address_line,
          postal_code: data.postal_code || undefined,
          latitude: data.lat ?? null,
          longitude: data.lng ?? null,
        }),
      });
      if (res.ok) {
        router.push("/account/addresses");
      } else {
        const json = await res.json();
        setError(json.error ?? "Terjadi kesalahan");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex-1">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/account/addresses"
              className="text-primary/60 hover:text-primary"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-primary">Edit Address</h1>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <AddressForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Update Address"
            defaultValues={{
              label: address.label ?? "",
              recipient_name: address.recipient_name,
              phone: address.phone,
              address_line: address.address_line,
              postal_code: address.postal_code ?? "",
              lat: address.latitude ?? undefined,
              lng: address.longitude ?? undefined,
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(root)/account/addresses/[id]/edit/page.tsx`**

```typescript
// app/(root)/account/addresses/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAddressById } from "@/lib/supabase/queries/addresses";
import EditAddressForm from "./EditAddressForm";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/account/addresses/${id}/edit`);
  }

  const address = await getAddressById(supabase, id, user.id);
  if (!address) {
    notFound();
  }

  return <EditAddressForm address={address} />;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(root)/account/addresses/[id]/edit/page.tsx" "app/(root)/account/addresses/[id]/edit/EditAddressForm.tsx"
git commit -m "feat: add /account/addresses/[id]/edit page"
```

---

## Task 9: Navigation — add Account link

**Files:**
- Modify: `components/navigation/index.tsx`

Context: The desktop user menu (around line 206) currently has a `<Link href="/orders">` with the user's first name and a sign-out button. The mobile menu (around line 341) has the same pattern. The spec asks to add an "Account" link pointing to `/account`. We change the user-name link to point to `/account` (the profile page is the natural destination for a user name link) and add an "Orders" text link for order history.

- [ ] **Step 1: Update the desktop user menu**

Find this block in `components/navigation/index.tsx` (around line 206):

```typescript
            {user ? (
              <div className="inline-flex items-center gap-2">
                <Link href="/orders" className="hover:underline flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.user_metadata?.full_name?.split(" ")[0] ?? "Akun"}</span>
                </Link>
                <button
                  onClick={signOut}
                  className="text-white/40 hover:text-white/70"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
```

Replace with:

```typescript
            {user ? (
              <div className="inline-flex items-center gap-2">
                <Link href="/account" className="hover:underline flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.user_metadata?.full_name?.split(" ")[0] ?? "Account"}</span>
                </Link>
                <Link href="/orders" className="text-white/60 hover:text-white text-sm">
                  Orders
                </Link>
                <button
                  onClick={signOut}
                  className="text-white/40 hover:text-white/70"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
```

- [ ] **Step 2: Update the mobile user menu**

Find this block (around line 341):

```typescript
            {user ? (
                <div className="flex items-center justify-between">
                  <Link
                    href="/orders"
                    className="text-primary font-normal text-sm inline-flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    {user.user_metadata?.full_name?.split(" ")[0] ?? "Akun saya"}
                  </Link>
                  <button
                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="text-white/40 text-sm"
                  >
                    Keluar
                  </button>
                </div>
```

Replace with:

```typescript
            {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/account"
                      className="text-primary font-normal text-sm inline-flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      className="text-primary/70 font-normal text-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                  </div>
                  <button
                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                    className="text-white/40 text-sm"
                  >
                    Keluar
                  </button>
                </div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Run all tests**

```bash
node vitest-runner.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/navigation/index.tsx
git commit -m "feat: add Account and Orders links to navigation"
```

---

## Task 10: Manual smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the following in the browser**

1. Visit `http://localhost:3000/account` without being logged in → redirects to `/login?next=/account`.
2. Log in with Google → redirects back to `/account`.
3. Profile page shows email, name/phone form; fill in valid values and save → success message appears.
4. Click "Saved Addresses" → navigates to `/account/addresses`.
5. Click "Add New Address" → navigates to `/account/addresses/new`.
6. Fill address form and submit → redirects to `/account/addresses`; new address card appears.
7. Click "Edit" on a card → navigates to `/account/addresses/{id}/edit`; form is pre-filled.
8. Modify and submit → redirects back to list; updated values shown.
9. Click "Jadikan Default" on a non-default address → card shows "Default" badge; others lose it.
10. Click "Hapus" on an address → confirm dialog appears; on confirm, address removed.
11. Deleting the default address unsets `profiles.default_address_id` (verify via Supabase table editor).
12. Direct URL `/account/addresses/nonexistent-id/edit` → Next.js 404 page.
13. Nav: logged-in user sees "Account" (→ `/account`) and "Orders" (→ `/orders`) in both desktop and mobile menus.
