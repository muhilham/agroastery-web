'use client';

import { $selectedCourier, $destinationGeo } from '@/lib/stores/shipping';

export type CartItemInput = {
  name: string;
  description?: string;
  category?: string;
  value: number;   // IDR
  quantity: number;
  weight: number;  // grams (shipping weight, not net)
  height?: number; // cm
  length?: number; // cm
  width?: number;  // cm
};

export type OriginInput = {
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_contact_email?: string;
  origin_address: string;
  origin_postal_code?: number | string;
  origin_lat?: number;
  origin_lng?: number;
  origin_note?: string;
  origin_collection_method?: 'pickup' | 'drop_off';
};

export async function createDraftOrderFromUI(params: {
  origin: OriginInput;
  customer: { name: string; phone: string; email?: string };
  deliveryType?: 'now' | 'scheduled';
  deliveryDate?: string; // YYYY-MM-DD
  deliveryTime?: string; // HH:mm
  orderNote?: string;
  referenceId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  items: CartItemInput[];
  destinationFallback?: { address?: string; postalCode?: string | number; note?: string };
}) {
  const {
    origin,
    customer,
    deliveryType = 'now',
    deliveryDate,
    deliveryTime,
    orderNote,
    referenceId,
    tags,
    metadata,
    items,
    destinationFallback,
  } = params;

  const courier = $selectedCourier.get();
  const dest = $destinationGeo.get();
  const hasCoords = dest?.lat != null && dest?.lng != null;
  const hasPostal = !!dest?.postal_code || destinationFallback?.postalCode != null;
  if (!hasCoords && !hasPostal) {
    // Biteship requires at least one of postal_code, coordinate, or area_id
    throw new Error('Alamat tujuan belum lengkap (butuh postal code atau koordinat).');
  }

  const body: Record<string, any> = {
    // ORIGIN
    origin_contact_name: origin.origin_contact_name,
    origin_contact_phone: origin.origin_contact_phone,
    origin_contact_email: origin.origin_contact_email,
    origin_address: origin.origin_address,
    origin_postal_code: origin.origin_postal_code ? Number(origin.origin_postal_code) : undefined,
    origin_note: origin.origin_note,
    origin_collection_method: origin.origin_collection_method,
    origin_coordinate:
      origin.origin_lat != null && origin.origin_lng != null
        ? { latitude: origin.origin_lat, longitude: origin.origin_lng }
        : undefined,

    // DESTINATION
    destination_contact_name: customer.name,
    destination_contact_phone: customer.phone,
    destination_contact_email: customer.email,
    destination_address: dest?.formatted_address || dest?.place_name || destinationFallback?.address || '',
    destination_postal_code: dest?.postal_code ? Number(dest.postal_code) : (destinationFallback?.postalCode != null ? Number(destinationFallback.postalCode) : undefined),
    destination_note: dest?.address_notes ?? destinationFallback?.note,
    destination_coordinate:
      dest?.lat != null && dest?.lng != null
        ? { latitude: dest.lat as number, longitude: dest.lng as number }
        : undefined,

    // DELIVERY
    delivery_type: deliveryType,
    delivery_date: deliveryDate,
    delivery_time: deliveryTime,
    order_note: orderNote,

    // META
    reference_id: referenceId,
    tags,
    metadata,

    // ITEMS
    items: items.map((it) => ({
      name: it.name,
      description: it.description,
      category: it.category,
      value: it.value,
      quantity: it.quantity,
      height: it.height ?? 10,
      length: it.length ?? 20,
      width: it.width ?? 15,
      weight: it.weight,
    })),
  };

  if (courier?.company && courier?.service_code) {
    body.courier_company = courier.company;
    body.courier_type = courier.service_code;
  }

  const res = await fetch('/api/shipping/draft-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data?.details || data?.error || 'Gagal membuat draft order.');
  }

  // Return full Biteship draft order response (id is at top-level)
  return data;
}
