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
