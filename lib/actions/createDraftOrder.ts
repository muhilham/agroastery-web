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

type Coordinate = { latitude: number; longitude: number };

type DraftOrderItem = {
  name: string;
  description?: string;
  category?: string;
  value: number;
  quantity: number;
  height?: number;
  length?: number;
  width?: number;
  weight: number;
};

type DraftOrderPayload = {
  // ORIGIN
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_contact_email?: string;
  origin_address: string;
  origin_postal_code?: number;
  origin_note?: string;
  origin_collection_method?: 'pickup' | 'drop_off';
  origin_coordinate?: Coordinate;
  origin_area_id?: string;

  // DESTINATION
  destination_contact_name: string;
  destination_contact_phone: string;
  destination_contact_email?: string;
  destination_address: string;
  destination_postal_code?: number;
  destination_note?: string;
  destination_coordinate?: Coordinate;
  destination_area_id?: string;

  // COURIER (optional)
  courier_company?: string;
  courier_type?: string;
  courier_insurance?: number;

  // DELIVERY
  delivery_type: 'now' | 'scheduled';
  delivery_date?: string;
  delivery_time?: string;
  order_note?: string;

  // META
  metadata?: Record<string, unknown>;
  reference_id?: string;
  tags?: string[];

  // ITEMS
  items: DraftOrderItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(data: unknown): string {
  if (isRecord(data)) {
    const details = typeof data.details === 'string' ? data.details : undefined;
    const error = typeof data.error === 'string' ? data.error : undefined;
    return details || error || 'Gagal membuat draft order.';
  }
  return 'Gagal membuat draft order.';
}

export async function createDraftOrderFromUI(params: {
  origin: OriginInput;
  customer: { name: string; phone: string; email?: string };
  deliveryType?: 'now' | 'scheduled';
  deliveryDate?: string; // YYYY-MM-DD
  deliveryTime?: string; // HH:mm
  orderNote?: string;
  referenceId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  items: CartItemInput[];
  destinationFallback?: { address?: string; postalCode?: string | number; note?: string };
}): Promise<unknown> {
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

  const body: DraftOrderPayload = {
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

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(getErrorMessage(data));
  }

  // Return full Biteship draft order response (id is at top-level)
  return data;
}
