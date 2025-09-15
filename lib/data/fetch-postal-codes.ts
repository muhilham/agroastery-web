// Fetch from GitHub raw content (free, reliable)
export async function fetchIndonesianPostalCodes() {
  try {
    const response = await fetch(
      'https://cdn.agroastery.com/location/kodepos.json',
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch postal codes');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching postal codes:', error);
    // Fallback to local minimal dataset
    return await import('./postal-codes-fallback.json');
  }
}

// Define interfaces for postal code data
export interface PostalCodeItem {
  bps: string;
  nama: string;
}

export interface PostalCodeData {
  [postalCode: string]: PostalCodeItem;
}

// Local cache implementation
let postalCodeCache: PostalCodeData | null = null;


export async function getPostalCodeData(): Promise<PostalCodeData> {
  if (postalCodeCache) {
    return postalCodeCache;
  }
  
  postalCodeCache = await fetchIndonesianPostalCodes();
  return postalCodeCache as PostalCodeData;
}
