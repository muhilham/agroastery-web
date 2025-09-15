import { useState } from 'react';
import { ShippingPricing, ShippingResponseSchema } from '../types/shipping';

export const useShippingCalculator = () => {
  const [shippingRates, setShippingRates] = useState<ShippingPricing[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingPricing | null>(
    null
  );

  const calculateShipping = async (payload: any) => {
    setIsLoadingShipping(true);
    setShippingError(null);

    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.pricing) {
        const parsed = ShippingResponseSchema.safeParse(data);

        if (parsed.success) {
          setShippingRates(parsed.data.pricing);
          return parsed.data.pricing;
        } else {
          console.error('Failed to parse shipping rates:', parsed.error);
          setShippingError('Gagal memuat data pengiriman.');
          return null;
        }
      } else {
        if (data.code === 'INVALID_POSTAL_CODE') {
          setShippingError(
            'Alamat pengiriman tidak valid. Silakan periksa kode pos Anda.'
          );
        } else {
          setShippingError(data.error || 'Gagal mengambil tarif pengiriman');
        }
        return null;
      }
    } catch (error) {
      setShippingError('Terjadi kesalahan. Silakan coba lagi.');
      return null;
    } finally {
      setIsLoadingShipping(false);
    }
  };

  return {
    shippingRates,
    isLoadingShipping,
    shippingError,
    selectedShipping,
    setSelectedShipping,
    calculateShipping,
    setShippingError
  };
};
