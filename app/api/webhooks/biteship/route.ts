import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { retryBiteshipDraft } from '@/lib/biteship/retryDraft';
import { sendPaymentNotification } from '@/lib/telegram/notify';

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

    if (byDraftId.data) {
      // Persist biteship_order_id so future webhooks skip the Biteship API fetch
      await supabase
        .from('ecom_orders')
        .update({ biteship_order_id: bsOrderId })
        .eq('id', byDraftId.data.id);

      return true;
    }

    console.warn(
      `[biteship-webhook] No order found for biteship_draft_id=${draftOrderId} (biteship order_id=${bsOrderId}) (${label})`
    );

    // History fallback: match dead Biteship orders
    const byHistory = await supabase
      .from('ecom_order_biteship_history')
      .select('order_id')
      .eq('biteship_order_id', bsOrderId)
      .maybeSingle();

    if (byHistory.data) {
      const safeUpdate = { ...update };
      delete safeUpdate.status;

      if (Object.keys(safeUpdate).length === 0) {
        console.log(`[biteship-webhook] History match ${byHistory.data.order_id} — nothing to update (status-only event skipped)`);
        return true;
      }

      const historyUpdate = await supabase
        .from('ecom_orders')
        .update(safeUpdate)
        .eq('id', byHistory.data.order_id)
        .select('id')
        .single();
      if (historyUpdate.data) {
        console.log(`[biteship-webhook] Matched via history for order ${byHistory.data.order_id} (status skipped)`);
        return true;
      }
    }

    return false;
  }

  if (event === 'order.status') {
    const rawStatus = body.status as string | undefined;

    // Handle courier_not_found: archive, clear, notify, retry
    if (rawStatus === 'courier_not_found') {
      const { data: orderRow } = await supabase
        .from('ecom_orders')
        .select('id, order_number, customer_name, customer_phone, total, biteship_order_id, biteship_draft_id')
        .eq('biteship_order_id', bsOrderId)
        .maybeSingle();

      if (orderRow) {
        await supabase.from('ecom_order_biteship_history').insert({
          order_id: orderRow.id,
          biteship_order_id: bsOrderId,
          biteship_draft_id: orderRow.biteship_draft_id,
          biteship_status: 'courier_not_found',
        });

        await supabase
          .from('ecom_orders')
          .update({
            biteship_order_id: null,
            biteship_draft_id: null,
            tracking_number: null,
            courier_tracking_id: null,
            status: 'cancelled',
          })
          .eq('id', orderRow.id);

        // HACK: using paymentMethod field to carry ops alert text
        sendPaymentNotification({
          orderId: orderRow.id,
          orderNumber: orderRow.order_number,
          customerName: orderRow.customer_name,
          customerPhone: orderRow.customer_phone,
          paymentMethod: '⚠️ BITESHIP COURIER NOT FOUND — mencoba ulang',
          total: orderRow.total,
          paidAt: new Date().toISOString(),
        }).catch(() => {});

        retryBiteshipDraft(orderRow.id).catch((err) =>
          console.error(`[biteship-webhook] Retry failed for order ${orderRow.id}:`, err)
        );
      }

      return NextResponse.json({ received: true });
    }

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
