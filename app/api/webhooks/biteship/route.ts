import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

// Maps Biteship order status to ecom_orders.status
const BITESHIP_STATUS_MAP: Record<string, string> = {
  confirmed: 'processing',
  scheduled: 'processing',
  allocated: 'processing',
  picking_up: 'processing',
  on_hold: 'processing',
  picked: 'shipped',
  dropping_off: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  rejected: 'cancelled',
  courier_not_found: 'cancelled',
  disposed: 'cancelled',
  returned: 'refunded',
  return_in_transit: 'refunded',
};

function verifySecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret') ?? '';
  const expected = process.env.BITESHIP_WEBHOOK_SECRET ?? '';
  if (!secret || !expected) return false;
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event as string;
  const biteshipOrderId = body.order_id as string | undefined;

  if (!biteshipOrderId) {
    // Likely a test ping from Biteship dashboard — log and acknowledge
    console.log(`[biteship-webhook] Event "${event}" with no order_id — ignoring`);
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseAdminClient();

  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;
    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
    if (ecomStatus) {
      const { data } = await supabase
        .from('ecom_orders')
        .update({ status: ecomStatus })
        .eq('biteship_order_id', biteshipOrderId)
        .select('id')
        .single();
      if (!data) {
        console.warn(`[biteship-webhook] No order found for biteship_order_id: ${biteshipOrderId}`);
      }
    } else {
      console.log(`[biteship-webhook] Unrecognised Biteship status "${rawStatus}" — no DB update`);
    }
  } else if (event === 'order.waybill_id') {
    const waybillId = body.courier_waybill_id as string | undefined;
    if (waybillId) {
      const { data: waybillData } = await supabase
        .from('ecom_orders')
        .update({ tracking_number: waybillId })
        .eq('biteship_order_id', biteshipOrderId)
        .select('id')
        .single();
      if (!waybillData) {
        console.warn(`[biteship-webhook] No order found for biteship_order_id: ${biteshipOrderId} (waybill_id event)`);
      }
    }
  } else {
    // order.price or any future event — log only, no action required
    console.log(`[biteship-webhook] Unhandled event "${event}" for Biteship order ${biteshipOrderId}`);
  }

  return NextResponse.json({ received: true });
}
