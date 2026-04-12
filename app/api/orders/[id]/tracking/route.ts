import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: order, error } = await admin
    .from('ecom_orders')
    .select('id, user_id, status, biteship_order_id, tracking_number, shipping_courier')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // If logged in, verify the order belongs to the current user.
  // Guests are allowed — the order UUID is cryptographically unguessable.
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && order.user_id && user.id !== order.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // Not logged in — guest access allowed
  }

  if (!order.biteship_order_id || !order.tracking_number) {
    return NextResponse.json({
      dispatched: false,
      status: order.status,
      tracking: null,
    });
  }

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const trackingRes = await fetch(
    `https://api.biteship.com/v1/trackings/${order.tracking_number}/couriers/${order.shipping_courier}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!trackingRes.ok) {
    // Waybill exists but courier hasn't published tracking events yet
    return NextResponse.json({
      dispatched: true,
      status: order.status,
      waybill_id: order.tracking_number,
      courier: order.shipping_courier,
      link: null,
      history: [],
    });
  }

  const tracking = (await trackingRes.json()) as {
    status: string;
    waybill_id: string;
    courier: { company: string };
    link: string | null;
    history: Array<{ note: string; status: string; updated_at: string }>;
  };

  return NextResponse.json({
    dispatched: true,
    status: order.status,
    waybill_id: tracking.waybill_id,
    courier: tracking.courier?.company ?? order.shipping_courier,
    link: tracking.link ?? null,
    history: (tracking.history ?? []).map((h) => ({
      status: h.status,
      note: h.note,
      updated_at: h.updated_at,
    })),
  });
}
