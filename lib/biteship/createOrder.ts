import { createSupabaseAdminClient } from '@/lib/supabase/server';

type BiteshipOrderResponse = {
  success: boolean;
  id?: string;
  courier?: { waybill_id?: string | null };
  code?: number;
  details?: { order_id?: string; waybill_id?: string };
};

export async function createBiteshipOrder(orderId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('ecom_orders')
    .select(
      'id, order_number, customer_name, customer_phone, customer_email, shipping_address, shipping_courier, shipping_service, notes'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`[createBiteshipOrder] Order not found: ${orderId}`);
  }

  // Skip if no courier was selected (e.g. digital-only or free-shipping orders)
  if (!order.shipping_courier || !order.shipping_service) {
    console.warn(`[createBiteshipOrder] Order ${orderId} has no courier — skipping Biteship order creation`);
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from('ecom_order_items')
    .select('product_name, unit_price, quantity, ship_weight_grams')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) {
    throw new Error(`[createBiteshipOrder] No order items found for order: ${orderId}`);
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
    ...(originLat != null &&
    originLng != null &&
    Number.isFinite(originLat) &&
    Number.isFinite(originLng)
      ? { origin_coordinate: { latitude: originLat, longitude: originLng } }
      : {}),

    destination_contact_name: addr.recipient_name,
    destination_contact_phone: addr.phone,
    destination_address: addr.address_line,
    ...(addr.postal_code ? { destination_postal_code: Number(addr.postal_code) } : {}),
    ...(addr.latitude != null && addr.longitude != null
      ? { destination_coordinate: { latitude: addr.latitude, longitude: addr.longitude } }
      : {}),

    delivery_type: 'now',
    courier_company: order.shipping_courier,
    courier_type: order.shipping_service,
    ...(order.notes ? { order_note: order.notes } : {}),
    reference_id: order.order_number,

    items: items.map((item) => ({
      name: item.product_name,
      value: item.unit_price,
      quantity: item.quantity,
      weight: item.ship_weight_grams,
      category: 'food_and_drink', // Agroastery sells coffee
      height: 10,
      length: 20,
      width: 15,
    })),
  };

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error('[createBiteshipOrder] Missing BITESHIP_API_KEY env var');

  const res = await fetch('https://api.biteship.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as BiteshipOrderResponse;

  // Idempotency: if order_number was already used as reference_id (webhook retry),
  // Biteship returns code 40002060 with the existing order's details.
  if (!res.ok && data.code === 40002060 && data.details?.order_id) {
    console.warn(
      `[createBiteshipOrder] Idempotent recovery for order ${orderId}: using existing Biteship order ${data.details.order_id}`
    );
    const { error: idempotentUpdateError } = await supabase
      .from('ecom_orders')
      .update({
        biteship_order_id: data.details.order_id,
        ...(data.details.waybill_id ? { tracking_number: data.details.waybill_id } : {}),
      })
      .eq('id', orderId);
    if (idempotentUpdateError) {
      throw new Error(
        `[createBiteshipOrder] Failed to store recovered biteship_order_id for order ${orderId}: ${idempotentUpdateError.message}`
      );
    }
    return;
  }

  if (!res.ok || !data.success || !data.id) {
    throw new Error(
      `[createBiteshipOrder] Biteship API error for order ${orderId}: ${JSON.stringify(data)}`
    );
  }

  const { error: updateError } = await supabase
    .from('ecom_orders')
    .update({
      biteship_order_id: data.id,
      ...(data.courier?.waybill_id ? { tracking_number: data.courier.waybill_id } : {}),
    })
    .eq('id', orderId);
  if (updateError) {
    throw new Error(
      `[createBiteshipOrder] Failed to store biteship_order_id for order ${orderId}: ${updateError.message}`
    );
  }
}
