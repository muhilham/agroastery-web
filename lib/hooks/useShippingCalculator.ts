import { useState } from 'react';
import { 
  ShippingPricing, 
  ShippingRequestPayload, 
  ShippingResponseSchemaV2, 
  VerifiedLocation 
} from '../types/shipping';

export const useShippingCalculator = () => {
  const [shippingRates, setShippingRates] = useState<ShippingPricing[]>([]);
  const [location, setLocation] = useState<VerifiedLocation | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingPricing | null>(
    null
  );

  const resetShipping = () => {
    setShippingRates([]);
    setLocation(null);
    setShippingError(null);
    setSelectedShipping(null);
  };

  const calculateShipping = async (payload: ShippingRequestPayload) => {
    setIsLoadingShipping(true);
    setShippingError(null);
    setLocation(null);

    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const parsed = ShippingResponseSchemaV2.safeParse(data);

        if (parsed.success) {
          setShippingRates(parsed.data.pricing);
          setLocation(parsed.data.location);
          return parsed.data;
        } else {
          console.error('Failed to parse shipping response:', parsed.error);
          setShippingError('Gagal memuat data pengiriman.');
          return null;
        }
      } else {
        if (data.code === 'NO_SHIPPING_RATES') {
          setShippingError(
            data.error || 'Alamat pengiriman tidak valid atau tidak terjangkau.'
          );
        } else {
          setShippingError(data.error || 'Gagal mengambil tarif pengiriman');
        }
        return null;
      }
    } catch {
      setShippingError('Terjadi kesalahan. Silakan coba lagi.');
      return null;
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
