import { useState } from 'react';
import { fetchPostalData, type PostalCodeResult } from '@/lib/utils/postal-code-api';

export const usePostalCode = () => {
  const [postalData, setPostalData] = useState<PostalCodeResult | null>(null);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [canCalculateShipping, setCanCalculateShipping] = useState(false);

  const handlePostalCodeChange = async (value: string, form: any) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 5) {
      form.setValue('postalCode', numericValue);
      setPostalError(null);
      setCanCalculateShipping(false);
      
      if (numericValue.length === 5) {
        setIsLoadingPostal(true);
        try {
          const data = await fetchPostalData(numericValue);
          setPostalData(data);
          
          if (data) {
            // Auto-enrich address with complete location data
            const currentAddress = form.getValues('address');
            if (!currentAddress.includes(data.location_name)) {
              const enrichedAddress = `${currentAddress}, ${data.full_location}`;
              form.setValue('address', enrichedAddress);
            }
            setCanCalculateShipping(true);
            return;
          } 
          setPostalError('Kode pos tidak ditemukan');
          setCanCalculateShipping(false);
          return;
        } catch (error) {
          setPostalError('Gagal memuat data lokasi');
          setCanCalculateShipping(false);
          return;
        } finally {
          setIsLoadingPostal(false);
        }
      }
      setPostalData(null);
      setCanCalculateShipping(false);
    }
  };

  return {
    postalData,
    isLoadingPostal,
    postalError,
    canCalculateShipping,
    handlePostalCodeChange,
    setPostalError,
    setCanCalculateShipping
  };
};
