import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Track if options have been set to prevent multiple calls
let optionsSet = false;
let loadPromise: Promise<typeof google> | null = null;

export async function loadGoogleMaps(): Promise<typeof google> {
  // Return existing promise if already loading/loaded
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined');
  }

  // Set options only once
  if (!optionsSet) {
    setOptions({
      key: apiKey,
      v: 'weekly',
      libraries: ['places', 'marker'], // Include places and marker libraries
    });
    optionsSet = true;
  }

  // Create and cache the load promise using the new functional API
  loadPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('places')
  ]).then(() => window.google);
  
  return loadPromise;
}

// Reset function for testing or error recovery
export function resetGoogleMapsLoader(): void {
  optionsSet = false;
  loadPromise = null;
}
