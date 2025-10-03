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
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || '';
          
          onPlaceSelected({ lat, lng }, address);
        }
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize autocomplete:', err);
      setError(err instanceof Error ? err.message : 'Failed to load address search');
      setIsLoading(false);
    }
  }, [country, onPlaceSelected]);

  // Handle manual search (fallback)
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputRef.current?.value) {
      e.preventDefault();
      
      try {
        await loadGoogleMaps();
        
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = {
          query: inputRef.current.value,
          fields: ['geometry', 'formatted_address', 'name'],
        };

        service.findPlaceFromQuery(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
            const place = results[0];
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address || place.name || '';
              
              onPlaceSelected({ lat, lng }, address);
            }
          }
        });
      } catch (err) {
        console.error('Failed to search place:', err);
      }
    }
  }, [onPlaceSelected]);

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
