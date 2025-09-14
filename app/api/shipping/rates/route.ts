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
      height: z.number().positive(),
      length: z.number().positive(),
      width: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Minimal 1 item diperlukan"),
});

// Add postal code validation function
async function validatePostalCode(postalCode: string): Promise<boolean> {
  try {
    // For local development, use relative URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/postal-code?code=${postalCode}`);
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Postal code validation failed:', error);
    return false;
  }
}

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const { destination, items } = validation.data;

    // Validate postal code before proceeding
    const isValidPostalCode = await validatePostalCode(destination.postal_code);
    if (!isValidPostalCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid postal code. Please check your shipping address.',
          code: 'INVALID_POSTAL_CODE'
        },
        { status: 400 }
      );
    }

    // Construct Biteship payload with correct field names
    const biteshipPayload = {
      origin_contact_name: process.env.SHIPPING_ORIGIN_CONTACT_NAME || "AGROASTERY TEAM",
      origin_contact_phone: process.env.SHIPPING_ORIGIN_CONTACT_PHONE || "+628979092726",
      origin_address: process.env.SHIPPING_ORIGIN_ADDRESS || "Jl. Kemang Barat No.7I, RT.9/RW.1, Bangka, Kec. Mampang Prpt.",
      origin_postal_code: parseInt(process.env.SHIPPING_ORIGIN_POSTAL_CODE || "12730"),
      destination_contact_name: destination.contact_name,
      destination_contact_phone: destination.contact_phone,
      destination_address: destination.address,
      destination_postal_code: parseInt(destination.postal_code),
      couriers: "grab,gojek,jne,anteraja",
      items: items.map(item => ({
        name: item.name,
        value: item.value,
        weight: item.weight,
        height: item.height,
        length: item.length,
        width: item.width,
        quantity: item.quantity
      })),
    };

    // Call Biteship API
    const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.BITESHIP_API_KEY || '',
      },
      body: JSON.stringify(biteshipPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Biteship API error:', response.status, errorBody);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch shipping rates', 
          details: errorBody 
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    
    // Check if Biteship returned success
    if (!data.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Biteship could not process the request', 
          details: data 
        },
        { status: 400 },
      );
    }

    // Explicitly set cache-control headers to disable caching
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    };

    return NextResponse.json({ 
      success: true, 
      pricing: data.pricing,
      metadata: {
        origin: biteshipPayload.origin,
        destination: biteshipPayload.destination
      }
    }, { status: 200, headers });

  } catch (error) {
    console.error('Shipping API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
