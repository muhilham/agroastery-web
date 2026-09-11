import { useState } from 'react';
import {
  ShippingCalcParams,
  ShippingCalcItem,
  BiteshipRatesResponseSchema,
  NormalizedRate,
  VerifiedLocation
} from '../types/shipping';

const ensureNonEmpty = (v: string | undefined | null, name: string): string => {
  if (!v || v.trim() === '') throw new Error(`${name} is required`);
  return v;
};

async function getShippingRates(p: ShippingCalcParams) {
  const origin = Number(p.originPostalCode);
  const hasGeo = Number.isFinite(p.destinationLatitude ?? NaN) && Number.isFinite(p.destinationLongitude ?? NaN);
  const destination = Number(p.destinationPostalCode);
  if (!Number.isFinite(origin)) throw new Error('originPostalCode must be a number-like value');
  if (!hasGeo && !Number.isFinite(destination)) throw new Error('destinationPostalCode must be a number-like value when coordinates are not provided');

  const couriers = p.couriers ?? process.env.NEXT_PUBLIC_BITESHIP_DEFAULT_COURIERS ?? "anteraja,jne,sicepat";

  // Use provided items array; fall back to building one item from scalar fields
  const items: ShippingCalcItem[] = p.items && p.items.length > 0
    ? p.items
    : (() => {
        if (!p.weightGrams || p.weightGrams <= 0) throw new Error('weightGrams must be > 0');
        if (!p.quantity || p.quantity <= 0) throw new Error('quantity must be > 0');
        if (!p.name) throw new Error('name is required when items[] is not provided');
        const name = ensureNonEmpty(p.name, 'name');
        return [{
          name,
          description: p.description ?? name,
          value: Math.max(0, Math.trunc(p.price ?? 0)),
          length: p.length ?? 20,
          width: p.width ?? 15,
          height: p.height ?? 10,
          weight: Math.trunc(p.weightGrams),
          quantity: Math.trunc(p.quantity),
        }];
      })();

  const body: Record<string, unknown> = { origin_postal_code: origin };
  if (hasGeo) {
    body.destination_latitude = p.destinationLatitude;
    body.destination_longitude = p.destinationLongitude;
  } else {
    body.destination_postal_code = destination;
  }
  body.couriers = couriers;
  body.items = items;

  const res = await fetch('/api/shipping/rates', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch shipping rates' }));
    throw new Error(errorData.error || 'Failed to fetch shipping rates');
  }

  const data = await res.json();
  const parsed = BiteshipRatesResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Failed to parse Biteship response', parsed.error.format(), data);
    throw new Error('Failed to parse shipping response');
  }

  return parsed.data.pricing.map((p) => ({
    carrier: p.courier_name,
    code: `${p.courier_code}-${p.courier_service_code}`,
    service: p.courier_service_name,
    eta: p.duration ?? (p.shipment_duration_range ? `${p.shipment_duration_range} ${p.shipment_duration_unit ?? ''}`.trim() : undefined),
    serviceType: p.service_type,
    price: p.price,
    raw: p,
  }));
}

export const useShippingCalculator = () => {
  const [shippingRates, setShippingRates] = useState<NormalizedRate[]>([]);
  const [location, setLocation] = useState<VerifiedLocation | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<NormalizedRate | null>(
    null
  );

  const resetShipping = () => {
    setShippingRates([]);
    setLocation(null);
    setShippingError(null);
    setSelectedShipping(null);
  };

  const calculateShipping = async (params: ShippingCalcParams) => {
    setIsLoadingShipping(true);
    setShippingError(null);
    setLocation(null);

    try {
      const normalizedRates = await getShippingRates(params);
      setShippingRates(normalizedRates);

      if (normalizedRates.length === 0) {
        setShippingError('Tidak ada kurir yang tersedia untuk tujuan ini.');
      }

      // Note: Location data is not available in current Biteship response
      // This is handled gracefully by the UI components
      return { pricing: normalizedRates, location: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      setShippingError(errorMessage);
      throw err;
    } finally {
      setIsLoadingShipping(false);
    }
  };

  return {
    shippingRates,
    location,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    resetShipping,
    setShippingError
  };
};
