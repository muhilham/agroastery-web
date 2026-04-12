import { atom } from "nanostores";

// --- Destination geo/place details (for WhatsApp message + shipping geo) ---

export type DestinationGeo = {
  lat?: number;
  lng?: number;
  place_id?: string;
  formatted_address?: string;
  place_name?: string; // e.g., venue/store name
  postal_code?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  address_notes?: string;
};

export const $destinationGeo = atom<DestinationGeo>({});

export function setDestinationGeo(
  lat?: number,
  lng?: number,
  extras?: Partial<Omit<DestinationGeo, 'lat' | 'lng'>>
) {
  $destinationGeo.set({
    ...$destinationGeo.get(),
    lat,
    lng,
    ...extras,
  });
}

export function setDestinationPlaceExtras(extras: Partial<DestinationGeo>) {
  $destinationGeo.set({
    ...$destinationGeo.get(),
    ...extras,
  });
}

// Types to align with Biteship Draft Order payload
export type OriginConfig = {
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_contact_email?: string;
  origin_address: string;
  origin_postal_code?: string | number;
  origin_lat?: number;
  origin_lng?: number;
  origin_note?: string;
  origin_collection_method?: 'pickup' | 'drop_off';
  origin_area_id?: string;
};

export type SelectedCourier = {
  company: string;          // biteship: courier_company (e.g., "jne")
  service_code: string;     // biteship: courier_type (e.g., "yes")
  service_name: string;
  price: number;
  etd?: string;
};

// Atom to store currently selected courier mapping for draft order API
export const $selectedCourier = atom<SelectedCourier | null>(null);

export function setSelectedCourier(courier: SelectedCourier | null) {
  $selectedCourier.set(courier);
}
