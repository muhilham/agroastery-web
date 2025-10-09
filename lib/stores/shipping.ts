import { map, atom } from "nanostores";

// Defines the structure of a single shipping rate from Biteship
export type TShippingRate = {
  company: string;
  courier_name: string;
  courier_code: string;
  courier_service_name: string;
  courier_service_code: string;
  description: string;
  duration: string;
  price: number;
  type: string;
};

// The store for shipping-related state
export const $shipping = map<{
  rates: TShippingRate[];
  selectedRate: TShippingRate | null;
  isLoading: boolean;
  error: string | null;
}> ({
  rates: [],
  selectedRate: null,
  isLoading: false,
  error: null,
});

// --- Actions to interact with the shipping store ---

/**
 * Fetches shipping rates from our API endpoint.
 */

// Define the structure of an item for the shipping payload
type ShippingItem = {
  name: string;
  description: string;
  value: number;
  weight: number;
  height: number;
  length: number;
  width: number;
  quantity: number;
};

export async function fetchShippingRates(payload: {
  destination_address: string;
  destination_postal_code: string;
  items: ShippingItem[];
}) {
  $shipping.setKey("isLoading", true);
  $shipping.setKey("error", null);
  $shipping.setKey("rates", []); // Clear previous rates

  try {
    const response = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Gagal mengambil tarif pengiriman.");
    }

    // Sort rates by price, from cheapest to most expensive
    const sortedRates = result.pricing.sort(
      (a: TShippingRate, b: TShippingRate) => a.price - b.price,
    );

    $shipping.setKey("rates", sortedRates);
  } catch (err) {
    if (err instanceof Error) {
      $shipping.setKey("error", err.message);
    } else {
      $shipping.setKey("error", "An unknown error occurred.");
    }
  } finally {
    $shipping.setKey("isLoading", false);
  }
}

/**
 * Sets the user's chosen shipping rate.
 */
export function setSelectedRate(rate: TShippingRate | null) {
  $shipping.setKey("selectedRate", rate);
}

/**
 * Resets the shipping store to its initial state.
 */
export function clearShippingState() {
  $shipping.set({
    rates: [],
    selectedRate: null,
    isLoading: false,
    error: null,
  });
}

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
