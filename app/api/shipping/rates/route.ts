import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Update the validation schema to match frontend payload
const shippingRequestSchema = z.object({
  destination: z.object({
    contact_name: z.string().min(2, "Nama terlalu pendek"),
    contact_phone: z.string().min(6, "Nomor telepon tidak valid"),
    address: z.string().min(10, "Alamat terlalu pendek"),
    postal_code: z.string().length(5, "Kode pos harus 5 digit"),
  }),
  items: z.array(
    z.object({
      name: z.string(),
      value: z.number().positive(),
      weight: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Minimal 1 item diperlukan"),
});

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };

  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400, headers }
      );
    }

    // Validate against schema
    const validation = shippingRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid input", 
          details: validation.error.format() 
        },
        { status: 400, headers }
      );
    }

    const { destination, items } = validation.data;

    // Validate required environment variables
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      console.error('BITESHIP_API_KEY is not configured');
      return NextResponse.json(
        { success: false, error: 'Shipping service configuration error' },
        { status: 500, headers }
      );
    }

    // Construct Biteship payload with correct field names
    const biteshipPayload = {
      origin_contact_name: process.env.ORIGIN_CONTACT_NAME || "AGROASTERY TEAM",
      origin_contact_phone: process.env.ORIGIN_CONTACT_PHONE || "+628979092726",
      origin_address: process.env.ORIGIN_ADDRESS || "Jl. Kemang Barat No.7I, RT.9/RW.1, Bangka, Kec. Mampang Prpt.",
      origin_postal_code: parseInt(process.env.ORIGIN_POSTAL_CODE || "12730"),
      destination_contact_name: destination.contact_name,
      destination_contact_phone: destination.contact_phone,
      destination_address: destination.address,
      destination_postal_code: parseInt(destination.postal_code),
      couriers: "grab,gojek,jne,anteraja,sicepat",
      items: items.map(item => ({
        name: item.name,
        value: item.value,
        weight: item.weight,
        height: 1,
        length: 1,
        width: 1,
        quantity: item.quantity
      })),
    };

    // Call Biteship API with proper timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'User-Agent': 'Agroastery/1.0',
        },
        body: JSON.stringify(biteshipPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Biteship API error:', response.status, errorBody);
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch shipping rates', 
            details: errorBody 
          },
          { status: response.status, headers }
        );
      }

      const data = await response.json();

      // Handle cases where Biteship indicates an error (e.g., invalid address)
      if (!data.success || !data.pricing || data.pricing.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || 'No shipping rates available for the provided address.',
            code: 'NO_SHIPPING_RATES'
          },
          { status: 404, headers }
        );
      }

      // Extract validated location data from Biteship's response
      const location = {
        postal_code: String(data.destination.postal_code), // Convert to string to match frontend schema
        province: data.destination.administrative_division_level_1_name,
        city: data.destination.administrative_division_level_2_name,
        district: data.destination.administrative_division_level_3_name,
      };

      return NextResponse.json({ 
        success: true, 
        pricing: data.pricing,
        location: location,
      }, { status: 200, headers });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout - shipping service took too long to respond' },
          { status: 408, headers }
        );
      }
      
      throw fetchError; // Re-throw other fetch errors
    }

  } catch (error) {
    console.error('Shipping API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers }
    );
  }
}
