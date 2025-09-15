import { useState } from 'react';
import { fetchPostalData, type PostalCodeResult } from '@/lib/utils/postal-code-api';

// Define form interface for type safety - make it compatible with react-hook-form
interface FormMethods<TFieldValues> {
  setValue: (name: keyof TFieldValues, value: string) => void;
  getValues: (name: keyof TFieldValues) => string;
}

export const usePostalCode = () => {
  const [postalData, setPostalData] = useState<PostalCodeResult | null>(null);
  const [isLoadingPostal, setIsLoadingPostal] = useState(false);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [canCalculateShipping, setCanCalculateShipping] = useState(false);

  const handlePostalCodeChange = async <TFieldValues>(value: string, form: FormMethods<TFieldValues>) => {
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 5) {
      form.setValue('postalCode' as keyof TFieldValues, numericValue);
      setPostalError(null);
      setCanCalculateShipping(false);
      
      if (numericValue.length === 5) {
        setIsLoadingPostal(true);
        try {
          const data = await fetchPostalData(numericValue);
          setPostalData(data);
          
          if (data) {
            // Auto-enrich address with complete location data
            const currentAddress = form.getValues('address' as keyof TFieldValues);
            if (!currentAddress.includes(data.location_name)) {
              const enrichedAddress = `${currentAddress}, ${data.full_location}`;
              form.setValue('address' as keyof TFieldValues, enrichedAddress);
            }
            setCanCalculateShipping(true);
            return;
          } 
          setPostalError('Kode pos tidak ditemukan');
          setCanCalculateShipping(false);
          return;
        } catch {
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
