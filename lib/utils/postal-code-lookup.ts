import { getProvinceData, getKotaKabupatenData, getPostalCodeData } from '@/lib/data/fetch-locations';

export interface PostalCodeResult {
  postal_code: string;
  bps_code: string;
  location_name: string;
  kota_kabupaten: string;
  province: string;
  full_location: string;
}

export async function findPostalData(postalCode: string): Promise<PostalCodeResult | null> {
  if (postalCode.length !== 5) return null;
  
  try {
    const [allPostalCodes, kotaKabupatenData, provinceData] = await Promise.all([
      getPostalCodeData(),
      getKotaKabupatenData(),
      getProvinceData()
    ]);
    
    // FIX: Use object property access instead of array find
    const postalData = allPostalCodes[postalCode];
    
    if (!postalData) return null;
    
    // Get kota/kabupaten from BPS code (first 4 digits)
    const bpsPrefix = postalData.bps.substring(0, 4);
    const kotaKabupaten = kotaKabupatenData[bpsPrefix] || `Wilayah BPS ${bpsPrefix}`;
    
    // Get province from BPS code (first 2 digits)
    const provinceCode = postalData.bps.substring(0, 2);
    const province = provinceData[provinceCode] || 'Indonesia';
    
    return {
      postal_code: postalCode,
      bps_code: postalData.bps,
      location_name: postalData.nama,
      kota_kabupaten: kotaKabupaten,
      province: province,
      full_location: `${postalData.nama}, ${kotaKabupaten}, ${province}`
    };
  } catch (error) {
    console.error('Postal code lookup error:', error);
    return null;
  }
}

export async function isValidPostalCode(postalCode: string): Promise<boolean> {
  if (postalCode.length !== 5) return false;
  
  try {
    const allPostalCodes = await getPostalCodeData();
    // FIX: Check if property exists in object
    return postalCode in allPostalCodes;
  } catch (error) {
    return false;
  }
}

export async function searchByLocationName(query: string): Promise<PostalCodeResult[]> {
  if (query.length < 3) return [];
  
  try {
    const [allPostalCodes, kotaKabupatenData, provinceData] = await Promise.all([
      getPostalCodeData(),
      getKotaKabupatenData(),
      getProvinceData()
    ]);
    
    const results: PostalCodeResult[] = [];
    
    // FIX: Iterate through object keys instead of array
    for (const [postalCode, postalData] of Object.entries(allPostalCodes)) {
      const bpsPrefix = postalData.bps.substring(0, 4);
      const kotaKabupaten = kotaKabupatenData[bpsPrefix] || '';
      const provinceCode = postalData.bps.substring(0, 2);
      const province = provinceData[provinceCode] || '';
      
      if (
        postalData.nama.toLowerCase().includes(query.toLowerCase()) ||
        kotaKabupaten.toLowerCase().includes(query.toLowerCase()) ||
        province.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          postal_code: postalCode,
          bps_code: postalData.bps,
          location_name: postalData.nama,
          kota_kabupaten: kotaKabupaten,
          province: province,
          full_location: `${postalData.nama}, ${kotaKabupaten}, ${province}`
        });
        
        if (results.length >= 10) break; // Limit results
      }
    }
    
    return results;
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
}

export async function getBpsLocationName(bpsCode: string): Promise<string> {
  try {
    const kotaKabupatenData = await getKotaKabupatenData();
    return kotaKabupatenData[bpsCode] || `Wilayah ${bpsCode}`;
  } catch (error) {
    return `Wilayah ${bpsCode}`;
  }
}

export async function getProvinceName(provinceCode: string): Promise<string> {
  try {
    const provinceData = await getProvinceData();
    return provinceData[provinceCode] || `Provinsi ${provinceCode}`;
  } catch (error) {
    return `Provinsi ${provinceCode}`;
  }
}
