"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import { z } from "zod";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useShippingCalculator } from "@/lib/hooks/useShippingCalculator";
import { buildQuoteItems, CHECKOUT_COURIERS_POSTAL, CHECKOUT_COURIERS_GEO } from "@/lib/checkout/shippingQuote";
import type { CartItem } from "@/lib/stores/cart";
import type { Address } from "@/lib/hooks/useAddresses";
import type { TForm } from "@/app/(root)/checkout/checkoutSchemas";

/**
 * Checkout shipping-quote lifecycle (extracted from checkout-page-content.tsx
 * for issue #143 — zero behavior changes intended).
 *
 * Owns: watched postal/geo inputs → debounce → calculateShipping, the
 * cart-change re-quote effect, and the post-409 drift refresh. The component
 * keeps address selection state and passes it in as `quoteGateOpen`
 * (true while "new address"/guest mode is active, matching the old
 * `selectedAddressId !== "new" && selectedAddressId !== null` early-returns).
 */
export function useCheckoutShipping(options: {
  control: Control<TForm>;
  cartItems: CartItem[];
  /** Fire the postal/geo watch effects only in "new address" or guest mode. */
  quoteGateOpen: boolean;
  /** Live form values for the post-drift refresh (form.getValues). */
  getValues: () => Pick<TForm, "postalCode" | "lat" | "lng">;
}) {
  const { control, cartItems, quoteGateOpen, getValues } = options;

  const {
    shippingRates,
    location,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    resetShipping,
  } = useShippingCalculator();

  const watchedPostalCode = useWatch({ control, name: "postalCode" });
  const debouncedPostalCode = useDebounce(watchedPostalCode, 800);
  const watchedLat = useWatch({ control, name: "lat" });
  const watchedLng = useWatch({ control, name: "lng" });

  // One quote line per cart line: totalized weight, qty collapsed to 1,
  // dims matching createDraft (issue #138 — Biteship multiplies weight×qty
  // per item, so merged weight + real quantity inflated rates up to 4x).
  const quoteItems = useMemo(
    () =>
      buildQuoteItems(
        cartItems.map((i) => ({
          name: i.productName,
          unitPrice: i.unitPrice,
          weightGramsPerUnit: i.shipWeightGrams,
          quantity: i.quantity,
        }))
      ),
    [cartItems]
  );

  const handleCalculateShippingByPostal = useCallback(async (postalCode: string) => {
    if (cartItems.length === 0) return;
    try {
      await calculateShipping({
        originPostalCode: process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440",
        destinationPostalCode: postalCode,
        couriers: CHECKOUT_COURIERS_POSTAL,
        items: quoteItems,
      });
    } catch {
      // error already surfaced via shippingError state
    }
  }, [cartItems, quoteItems, calculateShipping]);

  const handleCalculateShippingByGeo = useCallback(async (lat: number, lng: number) => {
    if (cartItems.length === 0) return;
    try {
      await calculateShipping({
        originPostalCode: process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE || "12440",
        destinationLatitude: lat,
        destinationLongitude: lng,
        couriers: CHECKOUT_COURIERS_GEO,
        items: quoteItems,
      });
    } catch {
      // error already surfaced via shippingError state
    }
  }, [cartItems, quoteItems, calculateShipping]);

  // Postal path: quote when a valid 5-digit code settles; reset when invalid.
  // quoteItems in deps re-quotes live when cart contents change (#139).
  useEffect(() => {
    if (!quoteGateOpen) return;
    const latValid = typeof watchedLat === "number" && Number.isFinite(watchedLat);
    const lngValid = typeof watchedLng === "number" && Number.isFinite(watchedLng);
    if (latValid && lngValid) return;

    const postalValid = z.string().length(5).safeParse(debouncedPostalCode);
    if (postalValid.success) {
      handleCalculateShippingByPostal(postalValid.data);
    } else {
      resetShipping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPostalCode, watchedLat, watchedLng, quoteGateOpen, quoteItems]);

  // Geo path: a map pin (lat+lng) always wins over the postal quote.
  useEffect(() => {
    if (!quoteGateOpen) return;
    const latValid = typeof watchedLat === "number" && Number.isFinite(watchedLat);
    const lngValid = typeof watchedLng === "number" && Number.isFinite(watchedLng);
    if (latValid && lngValid) {
      handleCalculateShippingByGeo(watchedLat as number, watchedLng as number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedLat, watchedLng, quoteGateOpen, quoteItems]);

  /** Quote for a saved address: geo preferred, then postal (default + select paths). */
  const quoteForAddress = useCallback((addr: Address) => {
    if (addr.latitude != null && addr.longitude != null) {
      void handleCalculateShippingByGeo(addr.latitude, addr.longitude);
    } else if (addr.postal_code) {
      void handleCalculateShippingByPostal(addr.postal_code);
    }
  }, [handleCalculateShippingByGeo, handleCalculateShippingByPostal]);

  /**
   * After a server 409 SHIPPING_RATE_STALE / unavailable: clear the stale
   * selection and re-quote the current destination so the buyer confirms
   * fresh prices instead of retrying the old one.
   */
  const refreshAfterDrift = useCallback(() => {
    setSelectedShipping(null);
    const { postalCode: postal, lat, lng } = getValues();
    if (typeof lat === "number" && typeof lng === "number") {
      void handleCalculateShippingByGeo(lat, lng);
    } else if (postal) {
      void handleCalculateShippingByPostal(postal);
    }
  }, [getValues, setSelectedShipping, handleCalculateShippingByGeo, handleCalculateShippingByPostal]);

  return {
    shippingRates,
    location,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    resetShipping,
    watchedLat,
    watchedLng,
    quoteItems,
    handleCalculateShippingByPostal,
    handleCalculateShippingByGeo,
    quoteForAddress,
    refreshAfterDrift,
  };
}
