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
  // Accept empty body for Biteship registration test
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const secret = request.nextUrl.searchParams.get('secret') ?? '';
  const expected = process.env.BITESHIP_WEBHOOK_SECRET ?? '';

  // If both secret and expected are present, validate
  if (secret && expected) {
    if (!verifySecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (expected && !secret) {
    // Env var is set but request has no secret.
    // Allow empty-body registration probes; reject real webhooks without secret.
    const hasEventData = body.event || body.order_id;
    if (hasEventData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const event = body.event as string;
  const biteshipOrderId = body.order_id as string | undefined;

  if (!biteshipOrderId) {
    // Likely a test ping from Biteship dashboard — log and acknowledge
    console.log(`[biteship-webhook] Event "${event}" with no order_id — ignoring`);
    return NextResponse.json({ received: true });
  }

  const supabase = createSupabaseAdminClient();
  const bsOrderId = biteshipOrderId;

  async function applyUpdate(
    update: Record<string, unknown>,
    label: string
  ): Promise<boolean> {
    // Fast path: biteship_order_id already persisted from a previous webhook
    const byOrderId = await supabase
      .from('ecom_orders')
      .update(update)
      .eq('biteship_order_id', bsOrderId)
      .select('id')
      .single();
    if (byOrderId.data) return true;

    // Slow path: first webhook for this order — draft_order_id != order_id in Biteship,
    // so we fetch the confirmed order from Biteship to get draft_order_id, then match
    // against our biteship_draft_id column.
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      console.warn(`[biteship-webhook] Missing BITESHIP_API_KEY, cannot resolve order ${bsOrderId} (${label})`);
      return false;
    }

    let draftOrderId: string | undefined;
    try {
      const biteshipRes = await fetch(`https://api.biteship.com/v1/orders/${bsOrderId}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      });
      if (biteshipRes.ok) {
        const biteshipOrder = await biteshipRes.json() as Record<string, unknown>;
        draftOrderId = biteshipOrder.draft_order_id as string | undefined;
      } else {
        console.warn(`[biteship-webhook] Biteship GET /v1/orders/${bsOrderId} returned ${biteshipRes.status} (${label})`);
      }
    } catch (err) {
      console.warn(`[biteship-webhook] Failed to fetch order ${bsOrderId} from Biteship (${label}):`, err);
    }

    if (!draftOrderId) {
      console.warn(`[biteship-webhook] No draft_order_id from Biteship for order ${bsOrderId} (${label})`);
      return false;
    }

    const byDraftId = await supabase
      .from('ecom_orders')
      .update(update)
      .eq('biteship_draft_id', draftOrderId)
      .select('id')
      .single();

    if (!byDraftId.data) {
      console.warn(
        `[biteship-webhook] No order found for biteship_draft_id=${draftOrderId} (biteship order_id=${bsOrderId}) (${label})`
      );
      return false;
    }

    // Persist biteship_order_id so future webhooks skip the Biteship API fetch
    await supabase
      .from('ecom_orders')
      .update({ biteship_order_id: bsOrderId })
      .eq('id', byDraftId.data.id);

    return true;
  }

  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;
    const ecomStatus = rawStatus ? BITESHIP_STATUS_MAP[rawStatus] : undefined;
    const courierWaybillId = body.courier_waybill_id as string | undefined;

    const courierTrackingId = body.courier_tracking_id as string | undefined;

    const update: Record<string, unknown> = {};
    if (ecomStatus) update.status = ecomStatus;
    if (courierWaybillId) update.tracking_number = courierWaybillId;
    if (courierTrackingId) update.courier_tracking_id = courierTrackingId;

    if (Object.keys(update).length > 0) {
      await applyUpdate(update, `order.status=${rawStatus}`);
    } else {
      console.log(`[biteship-webhook] Unrecognised Biteship status "${rawStatus}" — no DB update`);
    }
  } else if (event === 'order.waybill_id') {
    const waybillId = body.courier_waybill_id as string | undefined;
    const trackingId = body.courier_tracking_id as string | undefined;
    const update: Record<string, unknown> = {};
    if (waybillId) update.tracking_number = waybillId;
    if (trackingId) update.courier_tracking_id = trackingId;
    if (Object.keys(update).length > 0) {
      await applyUpdate(update, 'order.waybill_id');
    }
  } else {
    console.log(`[biteship-webhook] Unhandled event "${event}" for Biteship order ${bsOrderId}`);
  }

  return NextResponse.json({ received: true });
}
