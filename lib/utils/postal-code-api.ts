export interface PostalCodeResult {
  postal_code: string;
  bps_code: string;
  location_name: string;
  kota_kabupaten: string;
  province: string;
  full_location: string;
}

export async function fetchPostalData(postalCode: string): Promise<PostalCodeResult | null> {
  try {
    const response = await fetch(`/api/postal-code?code=${postalCode}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('Postal code API error:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch postal data:', error);
    return null;
  }
}

export async function searchLocations(query: string): Promise<PostalCodeResult[]> {
  try {
    const response = await fetch('/api/postal-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', query })
    });
    
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to search locations:', error);
    return [];
  }
}

export async function isValidPostalCode(postalCode: string): Promise<boolean> {
  if (postalCode.length !== 5) return false;
  
  try {
    const response = await fetch(`/api/postal-code?code=${postalCode}`);
    const data = await response.json();
    return data.success;
  } catch (error) {
    return false;
  }
}
