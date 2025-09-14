import { NextRequest, NextResponse } from 'next/server';

// Types for our data structures
interface ProvinceData {
  [bpsCode: string]: string;
}

interface KotaKabupatenData {
  [bpsCode: string]: string;
}

interface PostalCodeItem {
  bps: string;
  nama: string;
}

interface PostalCodeData {
  [postalCode: string]: PostalCodeItem;
}

// Fetch data from Agroastery CDN
async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return {} as T;
  }
}

// GET handler for postal code lookup
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get('code');
  
  if (!postalCode || postalCode.length !== 5) {
    return NextResponse.json(
      { error: 'Valid 5-digit postal code required' },
      { status: 400 }
    );
  }

  try {
    // Fetch all data in parallel
    const [provinceData, kotaKabupatenData, postalCodeData] = await Promise.all([
      fetchData<ProvinceData>('https://cdn.agroastery.com/location/provinsi.json'),
      fetchData<KotaKabupatenData>('https://cdn.agroastery.com/location/kota-kabupaten.json'),
      fetchData<PostalCodeData>('https://cdn.agroastery.com/location/kodepos.json')
    ]);

    // Lookup postal code
    const postalData = postalCodeData[postalCode];
    if (!postalData) {
      return NextResponse.json(
        { error: 'Postal code not found' },
        { status: 404 }
      );
    }

    // Get location details
    const bpsPrefix = postalData.bps.substring(0, 4);
    const provinceCode = postalData.bps.substring(0, 2);
    
    const result = {
      postal_code: postalCode,
      bps_code: postalData.bps,
      location_name: postalData.nama,
      kota_kabupaten: kotaKabupatenData[bpsPrefix] || `Wilayah BPS ${bpsPrefix}`,
      province: provinceData[provinceCode] || 'Indonesia',
      full_location: `${postalData.nama}, ${kotaKabupatenData[bpsPrefix] || `Wilayah BPS ${bpsPrefix}`}, ${provinceData[provinceCode] || 'Indonesia'}`
    };

    return NextResponse.json({ success: true, data: result });
    
  } catch (error) {
    console.error('Postal code API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for bulk lookup or search
export async function POST(request: NextRequest) {
  try {
    const { action, query } = await request.json();
    
    if (action === 'search' && query) {
      const [provinceData, kotaKabupatenData, postalCodeData] = await Promise.all([
        fetchData<ProvinceData>('https://cdn.agroastery.com/location/provinsi.json'),
        fetchData<KotaKabupatenData>('https://cdn.agroastery.com/location/kota-kabupaten.json'),
        fetchData<PostalCodeData>('https://cdn.agroastery.com/location/kodepos.json')
      ]);

      const results = [];
      
      for (const [postalCode, postalData] of Object.entries(postalCodeData)) {
        const bpsPrefix = postalData.bps.substring(0, 4);
        const provinceCode = postalData.bps.substring(0, 2);
        const kotaKabupaten = kotaKabupatenData[bpsPrefix] || '';
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

          if (results.length >= 10) break;
        }
      }

      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Postal code search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
