import { map } from "nanostores";

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
