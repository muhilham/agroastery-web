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
    const { error: clearError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
    if (clearError) {
      return NextResponse.json(
        { error: 'Failed to update default', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Set this address as default
    const { error: setError } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', user.id);
    if (setError) {
      return NextResponse.json(
        { error: 'Failed to update default', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    // Update profile default_address_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ default_address_id: id })
      .eq('id', user.id);
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to update default', code: 'DB_ERROR' },
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
