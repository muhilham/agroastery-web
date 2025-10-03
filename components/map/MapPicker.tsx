"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/maps/loadGoogleMaps';
import { Button } from '@/components/ui/button';

interface MapPickerProps {
  value?: { lat: number | null; lng: number | null };
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: number | string;
  className?: string;
  initialCenter?: { lat: number; lng: number };
  zoom?: number;
}

const JAKARTA_CENTER = { lat: -6.200000, lng: 106.816666 };

export default function MapPicker({
  value,
  onChange,
  height = 320,
  className = '',
  initialCenter = JAKARTA_CENTER,
  zoom = 14,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const dragListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>(initialCenter);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setCurrentCenter(initialCenter);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentCenter(userLocation);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setCurrentCenter(initialCenter);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
      }
    );
  }, [initialCenter]);

  // Handle map click
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    // Update marker position
    if (markerRef.current) {
      markerRef.current.position = { lat, lng };
    }
    
    // Call onChange callback
    onChange({ lat, lng });
  }, [onChange]);

  // Handle marker drag
  const handleMarkerDrag = useCallback((event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    onChange({ lat, lng });
  }, [onChange]);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      await loadGoogleMaps();
      
      // Determine initial map center
      const mapCenter = value?.lat && value?.lng 
        ? { lat: value.lat, lng: value.lng }
        : currentCenter;

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

      // Create marker using AdvancedMarkerElement
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: mapCenter,
        map,
        gmpDraggable: true,
        title: 'Pilih lokasi pengiriman',
      });

      markerRef.current = marker;

      // Add event listeners
      clickListenerRef.current = map.addListener('click', handleMapClick);
      dragListenerRef.current = marker.addListener('dragend', handleMarkerDrag);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load Google Maps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map');
      setIsLoading(false);
    }
  }, [value, currentCenter, zoom, handleMapClick, handleMarkerDrag]);

  // Update marker position when value changes
  useEffect(() => {
    if (markerRef.current && value?.lat && value?.lng) {
      const newPosition = { lat: value.lat, lng: value.lng };
      markerRef.current.position = newPosition;
      
      // Optionally center map on new position
      if (mapRef.current) {
        mapRef.current.setCenter(newPosition);
      }
    }
  }, [value]);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Initialize map when container is ready and location is determined
  useEffect(() => {
    if (mapContainerRef.current && currentCenter) {
      initializeMap();
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
  }, [initializeMap, currentCenter]);

  // Retry function
  const handleRetry = useCallback(() => {
    initializeMap();
  }, [initializeMap]);

  // Format coordinates for display
  const formatCoordinate = (coord: number | null): string => {
    return coord !== null ? coord.toFixed(6) : '-';
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={`space-y-3 ${className}`}>
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

      {/* Coordinate display */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Latitude</label>
          <div className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs">
            {formatCoordinate(value?.lat || null)}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Longitude</label>
          <div className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-white font-mono text-xs">
            {formatCoordinate(value?.lng || null)}
          </div>
        </div>
      </div>
    </div>
  );
}
