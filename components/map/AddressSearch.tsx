"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMaps } from '@/lib/maps/loadGoogleMaps';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);

  // Initialize autocomplete
  const initializeAutocomplete = useCallback(async () => {
    if (!inputRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      await loadGoogleMaps();

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['geometry', 'formatted_address', 'address_components', 'name'],
        componentRestrictions: { country: Array.isArray(country) ? country : [country] },
        types: ['establishment', 'geocode']
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.geometry?.location) {
          // Ensure we get numbers, not Promises
          const location = place.geometry.location;
          const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
          const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
          
          // Validate coordinates before passing them
          if (typeof lat === 'number' && typeof lng === 'number' && 
              !isNaN(lat) && !isNaN(lng)) {
            const address = place.formatted_address || place.name || '';
            onPlaceSelected({ lat, lng }, address);
          } else {
            console.warn('Invalid coordinates from place selection:', { lat, lng });
          }
        }
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize autocomplete:', err);
      setError(err instanceof Error ? err.message : 'Failed to load address search');
      setIsLoading(false);
    }
  }, [country, onPlaceSelected]);

  // Handle manual search (fallback) using Geocoder to avoid deprecated PlacesService
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputRef.current?.value) {
      e.preventDefault();
      try {
        await loadGoogleMaps();
        const geocoder = new google.maps.Geocoder();
        const countryRestrict = Array.isArray(country) ? country[0] : country;
        geocoder.geocode(
          {
            address: inputRef.current.value,
            // Narrow results to country if provided
            componentRestrictions: { country: countryRestrict },
          },
          (results, status) => {
            if (status === 'OK' && results && results[0] && results[0].geometry?.location) {
              const loc = results[0].geometry.location;
              const lat = typeof loc.lat === 'function' ? loc.lat() : (loc as any).lat;
              const lng = typeof loc.lng === 'function' ? loc.lng() : (loc as any).lng;
              if (
                typeof lat === 'number' &&
                typeof lng === 'number' &&
                !isNaN(lat) &&
                !isNaN(lng)
              ) {
                const address = results[0].formatted_address || inputRef.current!.value;
                onPlaceSelected({ lat, lng }, address);
              } else {
                console.warn('Invalid coordinates from geocoder search:', { lat, lng });
              }
            } else if (status !== 'OK') {
              console.warn('Geocoder search failed:', status);
            }
          }
        );
      } catch (err) {
        console.error('Failed to search place:', err);
      }
    }
  }, [onPlaceSelected, country]);

  // Sync external value prop with internal state
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [initializeAutocomplete]);

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="w-full bg-white/90 backdrop-blur-sm border-white/20 text-gray-900 placeholder:text-gray-500"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
