"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/maps/loadGoogleMaps';
import { Button } from '@/components/ui/button';
import AddressSearch from './AddressSearch';
import { setDestinationGeo } from '@/lib/stores/shipping';

interface MapPickerProps {
  value?: { lat: number | null; lng: number | null };
  onChange: (coords: { lat: number; lng: number }) => void;
  onAddressChange?: (address: string) => void;
  height?: number | string;
  className?: string;
  initialCenter?: { lat: number; lng: number };
  zoom?: number;
  showSearch?: boolean;
  searchValue?: string;
  readOnly?: boolean;
}

const JAKARTA_CENTER = { lat: -6.200000, lng: 106.816666 };

export default function MapPicker({
  value,
  onChange,
  onAddressChange,
  height = 320,
  className = '',
  initialCenter = JAKARTA_CENTER,
  zoom = 14,
  showSearch = true,
  searchValue = '',
  readOnly = false
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const dragListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onAddressChangeRef = useRef(onAddressChange);
  onAddressChangeRef.current = onAddressChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInputValue, setSearchInputValue] = useState(searchValue);
  // Store pending coords to apply after map initializes
  const pendingCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  // Track whether user has interacted with the map (selected place or clicked)
  const userInteractedRef = useRef(false);
  const mapInitializedRef = useRef(false);

  // Stable reference to initialCenter for use in callbacks
  const initialCenterRef = useRef(initialCenter);
  initialCenterRef.current = initialCenter;

  // Reverse geocode helper (non-debounced)
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current || !onAddressChange) return;

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      console.warn('Invalid coordinates for reverse geocoding:', { lat, lng });
      return;
    }

    try {
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK') {
              resolve({ results: results || [] } as google.maps.GeocoderResponse);
            } else {
              reject(new Error(`Geocoder failed: ${status}`));
            }
          }
        );
      });

      if (response.results?.[0]) {
        const address = response.results[0].formatted_address;
        onAddressChange(address);
        setSearchInputValue(address);
        // Extract postal code if available (typed) and save to destination store
        const compList = (response.results[0].address_components as unknown as google.maps.GeocoderAddressComponent[]) || [];
        const postalComp = compList.find((comp) => Array.isArray(comp.types) && comp.types.includes('postal_code'));
        const postal_code = postalComp?.long_name;
        setDestinationGeo(lat, lng, {
          formatted_address: response.results[0].formatted_address ?? undefined,
          postal_code,
        });
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }
  }, [onAddressChange]);

  // Debounced caller using a ref to avoid function identity issues
  const debouncedReverseGeocodeRef = useRef<((lat: number, lng: number) => void) | null>(
    null
  );
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    debouncedReverseGeocodeRef.current = (lat: number, lng: number) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => reverseGeocode(lat, lng), 300);
    };
    return () => {
      if (t) clearTimeout(t);
    };
  }, [reverseGeocode]);

  // Get user's current location and pan the existing map (without re-creating)
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Only pan to user location if they haven't already interacted
        if (userInteractedRef.current) return;
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(userLocation);
          markerRef.current.position = userLocation;
        }
      },
      () => {
        // Geolocation denied/failed — map stays at initialCenter
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      }
    );
  }, []);

  // Handle map click
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    userInteractedRef.current = true;

    // Ensure we get numbers, not Promises
    const latLng = event.latLng;
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

    // Validate coordinates before using them
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates from map click:', { lat, lng });
      return;
    }

    // Update marker position
    if (markerRef.current) {
      markerRef.current.position = { lat, lng };
    }

    // Call onChange callback
    onChangeRef.current({ lat, lng });
    // Persist destination coords (address will be set by reverse geocode below)
    setDestinationGeo(lat, lng);

    // Perform reverse geocoding
    debouncedReverseGeocodeRef.current?.(lat, lng);
  }, []);

  // Handle marker drag
  const handleMarkerDrag = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    
    // Ensure we get numbers, not Promises
    const latLng = event.latLng;
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
    
    // Validate coordinates before using them
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates from marker drag:', { lat, lng });
      return;
    }
    
    onChangeRef.current({ lat, lng });
    // Persist destination coords (address will be set by reverse geocode below)
    setDestinationGeo(lat, lng);

    // Perform reverse geocoding
    debouncedReverseGeocodeRef.current?.(lat, lng);
  }, []);

  // Handle place selection from search
  const handlePlaceSelected = useCallback((coords: { lat: number; lng: number }, address: string) => {
    userInteractedRef.current = true;

    // Always update form values immediately
    onChangeRef.current(coords);

    // Update address
    if (onAddressChangeRef.current) {
      onAddressChangeRef.current(address);
    }

    setSearchInputValue(address);

    // Update marker position if map is ready
    if (markerRef.current) {
      markerRef.current.position = coords;
    }

    // Pan and zoom map if map is ready
    if (mapRef.current) {
      mapRef.current.setCenter(coords);
      mapRef.current.setZoom(16);
    } else {
      // Map not ready yet, store coords to apply after initialization
      pendingCoordsRef.current = coords;
    }
  }, []);

  // Initialize map (called once on mount)
  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current || mapInitializedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      await loadGoogleMaps();

      // Determine initial map center
      const currentValue = valueRef.current;
      const mapCenter = currentValue?.lat && currentValue?.lng
        ? { lat: currentValue.lat, lng: currentValue.lng }
        : initialCenterRef.current;

      // Create map using the global google object
      const map = new google.maps.Map(mapContainerRef.current, {
        center: mapCenter,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
        mapId: 'DEMO_MAP_ID', // Required for Advanced Markers
      });

      mapRef.current = map;

      // Initialize geocoder
      geocoderRef.current = new google.maps.Geocoder();

      // Create marker using AdvancedMarkerElement
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: mapCenter,
        map,
        gmpDraggable: !readOnly,
        title: readOnly ? 'Lokasi pengiriman' : 'Pilih lokasi pengiriman',
      });

      markerRef.current = marker;

      // Add event listeners only when not in readOnly mode
      if (!readOnly) {
        clickListenerRef.current = map.addListener('click', handleMapClick);
        dragListenerRef.current = marker.addListener('dragend', handleMarkerDrag);
      }

      // Apply any pending coordinates from search selection
      if (pendingCoordsRef.current) {
        marker.position = pendingCoordsRef.current;
        map.setCenter(pendingCoordsRef.current);
        map.setZoom(16);
        pendingCoordsRef.current = null;
      }

      mapInitializedRef.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load Google Maps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map');
      setIsLoading(false);
    }
  }, [zoom, handleMapClick, handleMarkerDrag, readOnly]);

  // Update marker position when value changes
  useEffect(() => {
    if (markerRef.current && value?.lat && value?.lng) {
      const newPosition = { lat: value.lat, lng: value.lng };
      markerRef.current.position = newPosition;
      if (mapRef.current) {
        mapRef.current.setCenter(newPosition);
      }
    }
  }, [value]);

  // Initialize map once on mount, then get user location
  useEffect(() => {
    if (mapContainerRef.current) {
      initializeMap().then(() => {
        getCurrentLocation();
      });
    }

    // Cleanup on unmount
    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
      if (dragListenerRef.current) {
        google.maps.event.removeListener(dragListenerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retry function
  const handleRetry = useCallback(() => {
    mapInitializedRef.current = false;
    initializeMap();
  }, [initializeMap]);

  // (removed unused formatCoordinate to satisfy ESLint)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Address Search */}
      {showSearch && (
        <div className="space-y-1">
          <AddressSearch
            value={searchInputValue}
            onPlaceSelected={handlePlaceSelected}
            className="w-full"
          />
          <p className="text-xs text-gray-400">
            Pilih dari saran untuk menetapkan pin
          </p>
        </div>
      )}

      {/* Map container */}
      <div 
        className="relative border border-white/10 rounded-lg overflow-hidden bg-gray-900"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center p-4">
            <div className="text-center text-white max-w-sm">
              <p className="text-sm mb-4">Failed to load map: {error}</p>
              <Button onClick={handleRetry} size="sm" variant="outline">
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-400">
        {isMobile ? 'Tap map to drop a pin' : 'Click map to drop a pin'}
      </p>

    </div>
  );
}
