"use client";

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/maps/loadGoogleMaps';
import { setDestinationGeo } from '@/lib/stores/shipping';

interface AddressSearchProps {
  value?: string;
  onPlaceSelected: (coords: { lat: number; lng: number }, address: string) => void;
  country?: string | string[];
  className?: string;
  placeholder?: string;
}

export default function AddressSearch({
  value = '',
  onPlaceSelected,
  country = 'id',
  className = '',
  placeholder = 'Cari alamat atau tempat…'
}: AddressSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        await loadGoogleMaps();

        if (!mounted || !containerRef.current) return;

        const countryList = Array.isArray(country) ? country : [country];

        const placeElement = new google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: countryList },
          types: ['establishment', 'geocode'],
        });

        placeElement.setAttribute('placeholder', placeholder);
        if (value) placeElement.setAttribute('value', value);

        elementRef.current = placeElement;
        containerRef.current.appendChild(placeElement);

        placeElement.addEventListener('gmp-placeselect', async (e: Event) => {
          const { place } = e as google.maps.places.PlaceAutocompletePlaceSelectEvent;

          try {
            await place.fetchFields({
              fields: ['location', 'formattedAddress', 'addressComponents', 'displayName', 'id'],
            });

            const loc = place.location;
            if (loc) {
              const coords = { lat: loc.lat(), lng: loc.lng() };
              const address = place.formattedAddress || place.displayName || '';

              const postalComponent = place.addressComponents?.find(
                (comp) => comp.types.includes('postal_code')
              );

              setDestinationGeo(coords.lat, coords.lng, {
                formatted_address: place.formattedAddress ?? undefined,
                place_id: place.id,
                place_name: place.displayName ?? undefined,
                postal_code: postalComponent?.longText ?? undefined,
              });

              onPlaceSelected(coords, address);
            } else {
              console.warn('No location in place selection');
            }
          } catch (err) {
            console.error('Failed to fetch place details:', err);
          }
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize autocomplete:', err);
        setError(err instanceof Error ? err.message : 'Failed to load address search');
        setIsLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
      if (elementRef.current && containerRef.current?.contains(elementRef.current)) {
        containerRef.current.removeChild(elementRef.current);
      }
      elementRef.current = null;
    };
  }, [country, onPlaceSelected, placeholder]);

  // Sync external value into the element's input (best-effort)
  useEffect(() => {
    if (elementRef.current && value !== undefined) {
      elementRef.current.setAttribute('value', value);
    }
  }, [value]);

  return (
    <div className={`relative autocomplete-wrapper pointer-events-auto ${className}`}>
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
      <div ref={containerRef} className="w-full" />
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
