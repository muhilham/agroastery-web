export interface ProvinceData {
  [bpsCode: string]: string;
}

export interface KotaKabupatenData {
  [bpsCode: string]: string;
}

export interface PostalCodeItem {
  bps: string;
  nama: string;
}

export interface PostalCodeData {
  [postalCode: string]: PostalCodeItem;
}

// Fetch province data from Agroastery CDN
export async function fetchProvinceData(): Promise<ProvinceData> {
  try {
    const response = await fetch(
      'https://cdn.agroastery.com/location/provinsi.json',
      { 
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch province data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch {
    console.error('Error fetching province data:');
    return {};
  }
}

// Fetch kota/kabupaten data from Agroastery CDN
export async function fetchKotaKabupatenData(): Promise<KotaKabupatenData> {
  try {
    const response = await fetch(
      'https://cdn.agroastery.com/location/kota-kabupaten.json',
      { 
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch kota/kabupaten data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch {
    console.error('Error fetching kota/kabupaten data:');
    return {};
  }
}

// Fetch postal code data from Agroastery CDN
export async function fetchPostalCodeData(): Promise<PostalCodeData> {
  try {
    const response = await fetch(
      'https://cdn.agroastery.com/location/kodepos.json',
      { 
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch postal code data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch {
    console.error('Error fetching postal code data:');
    return {};
  }
}

export async function getProvinceData(): Promise<ProvinceData> {
  try {
    return await fetchProvinceData();
  } catch {
    console.warn('Using fallback province data due to fetch error');
    return {
      '11': 'Aceh',
      '12': 'Sumatera Utara',
      '13': 'Sumatera Barat',
      '31': 'DKI Jakarta',
      '32': 'Jawa Barat',
      '33': 'Jawa Tengah',
      '34': 'DI Yogyakarta',
      '35': 'Jawa Timur',
    };
  }
}

export async function getKotaKabupatenData(): Promise<KotaKabupatenData> {
  try {
    return await fetchKotaKabupatenData();
  } catch {
    console.warn('Using fallback kota/kabupaten data due to fetch error');
    return {
      '3173': 'Jakarta Pusat',
      '3171': 'Jakarta Selatan',
      '3273': 'Kota Bandung',
      '3374': 'Kota Semarang',
      '3578': 'Kota Surabaya',
    };
  }
}

export async function getPostalCodeData(): Promise<PostalCodeData> {
  try {
    return await fetchPostalCodeData();
  } catch {
    console.warn('Using fallback postal code data due to fetch error');
    return {
      '10110': { bps: '3173', nama: 'Gambir' },
      '10120': { bps: '3173', nama: 'Sawah Besar' },
      '10130': { bps: '3173', nama: 'Kemayoran' },
      '12730': { bps: '3171', nama: 'Mampang Prapatan' },
      '40111': { bps: '3273', nama: 'Bandung Wetan' },
    };
  }
}
