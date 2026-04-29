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

  // At this point biteshipOrderId is guaranteed to be defined (checked above)
  const bsOrderId = biteshipOrderId as string;

  async function applyUpdate(
    update: Record<string, unknown>,
    label: string
  ): Promise<boolean> {
    const byOrderId = await supabase
      .from('ecom_orders')
      .update(update)
      .eq('biteship_order_id', bsOrderId)
      .select('id')
      .single();
    if (byOrderId.data) return true;

    const referenceId = body.reference_id as string | undefined;
    if (!referenceId) {
      console.warn(
        `[biteship-webhook] No order found for biteship_order_id=${bsOrderId} and no reference_id fallback (${label})`
      );
      return false;
    }

    const byRef = await supabase
      .from('ecom_orders')
      .update(update)
      .eq('order_number', referenceId)
      .select('id')
      .single();
    if (!byRef.data) {
      console.warn(
        `[biteship-webhook] No order found for biteship_order_id=${bsOrderId} or reference_id=${referenceId} (${label})`
      );
      return false;
    }

    // Lazily persist biteship_order_id so future webhooks match by it directly.
    await supabase
      .from('ecom_orders')
      .update({ biteship_order_id: bsOrderId })
      .eq('id', byRef.data.id);
    return true;
  }

  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;
    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
    if (ecomStatus) {
      await applyUpdate({ status: ecomStatus }, `order.status=${rawStatus}`);
    } else {
      console.log(`[biteship-webhook] Unrecognised Biteship status "${rawStatus}" — no DB update`);
    }
  } else if (event === 'order.waybill_id') {
    const waybillId = body.courier_waybill_id as string | undefined;
    if (waybillId) {
      await applyUpdate({ tracking_number: waybillId }, 'order.waybill_id');
    }
  } else {
    console.log(`[biteship-webhook] Unhandled event "${event}" for Biteship order ${bsOrderId}`);
  }

  return NextResponse.json({ received: true });
}
