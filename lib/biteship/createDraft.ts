import { createSupabaseAdminClient } from '@/lib/supabase/server';

type BiteshipDraftResponse = {
  success: boolean;
  id?: string;
  code?: number;
  error?: string;
};

type BiteshipDraftLookupResponse = {
  success: boolean;
  drafts?: Array<{ id: string; reference_id?: string }>;
};

export async function createBiteshipDraft(orderId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('ecom_orders')
    .select(
      'id, order_number, customer_name, customer_phone, customer_email, shipping_address, shipping_courier, shipping_service, notes'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`[createBiteshipDraft] Order not found: ${orderId}`);
  }

  if (!order.shipping_courier || !order.shipping_service) {
    console.warn(
      `[createBiteshipDraft] Order ${orderId} has no courier — skipping Biteship draft creation`
    );
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from('ecom_order_items')
    .select('product_name, unit_price, quantity, ship_weight_grams')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) {
    throw new Error(`[createBiteshipDraft] No order items found for order: ${orderId}`);
  }

  const addr = order.shipping_address as {
    recipient_name: string;
    phone: string;
    address_line: string;
    postal_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };

  const DEFAULT_ORIGIN_LAT = -6.263450138760574;
  const DEFAULT_ORIGIN_LNG = 106.81945752406575;
  const originLat = Number(process.env.ORIGIN_LATITUDE ?? DEFAULT_ORIGIN_LAT);
  const originLng = Number(process.env.ORIGIN_LONGITUDE ?? DEFAULT_ORIGIN_LNG);
  const originPostal =
    process.env.ORIGIN_POSTAL_CODE ?? process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE;

  const payload: Record<string, unknown> = {
    origin_contact_name: process.env.ORIGIN_CONTACT_NAME,
    origin_contact_phone: process.env.ORIGIN_CONTACT_PHONE,
    origin_address: process.env.ORIGIN_ADDRESS,
    ...(originPostal ? { origin_postal_code: Number(originPostal) } : {}),
    ...(Number.isFinite(originLat) && Number.isFinite(originLng)
      ? { origin_coordinate: { latitude: originLat, longitude: originLng } }
      : {}),

    destination_contact_name: addr.recipient_name,
    destination_contact_phone: addr.phone,
    destination_address: addr.address_line,
    ...(addr.postal_code ? { destination_postal_code: Number(addr.postal_code) } : {}),
    ...(addr.latitude != null && addr.longitude != null
      ? { destination_coordinate: { latitude: addr.latitude, longitude: addr.longitude } }
      : {}),

    courier_company: order.shipping_courier,
    courier_type: order.shipping_service,
    ...(order.notes ? { order_note: order.notes } : {}),
    reference_id: order.order_number,

    items: items.map((item) => ({
      name: item.product_name,
      value: item.unit_price,
      quantity: item.quantity,
      weight: item.ship_weight_grams,
      category: 'food_and_drink',
      height: 10,
      length: 20,
      width: 15,
    })),
  };

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error('[createBiteshipDraft] Missing BITESHIP_API_KEY env var');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const res = await fetch('https://api.biteship.com/v1/draft_orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as BiteshipDraftResponse;

  let draftId: string | undefined = data.success && data.id ? data.id : undefined;

  // Idempotent recovery: reference_id already taken (Pivot retried)
  if (!res.ok && data.code === 42211015) {
    const lookupRes = await fetch(
      `https://api.biteship.com/v1/draft_orders?reference_id=${encodeURIComponent(order.order_number)}`,
      { method: 'GET', headers }
    );
    const lookup = (await lookupRes.json()) as BiteshipDraftLookupResponse;
    const found = lookup.drafts?.find((d) => d.reference_id === order.order_number);
    if (!found?.id) {
      throw new Error(
        `[createBiteshipDraft] Reference ID ${order.order_number} taken but lookup found no matching draft`
      );
    }
    console.warn(
      `[createBiteshipDraft] Idempotent recovery for order ${orderId}: using existing draft ${found.id}`
    );
    draftId = found.id;
  }

  if (!draftId) {
    throw new Error(
      `[createBiteshipDraft] Biteship draft API error for order ${orderId}: ${JSON.stringify(data)}`
    );
  }

  const { error: updateError } = await supabase
    .from('ecom_orders')
    .update({ biteship_draft_id: draftId })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(
      `[createBiteshipDraft] Failed to store biteship_draft_id for order ${orderId}: ${updateError.message}`
    );
  }
}
