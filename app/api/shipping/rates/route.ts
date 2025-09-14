import { NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for validating the incoming request body
const shippingRequestSchema = z.object({
  destination_address: z.string().min(10, "Alamat tujuan terlalu singkat"),
  destination_postal_code: z.string().min(5, "Kode pos tidak valid"),
  // In the future, you might fetch item details from a D1 database
  // using the slug or an ID passed from the client.
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      value: z.number().positive(),
      weight: z.number().positive("Berat harus lebih dari 0"), // Weight in grams
      height: z.number().positive(), // Dimensions in cm
      length: z.number().positive(),
      width: z.number().positive(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export const runtime = "edge";

export async function POST(request: Request) {
  // --- 1. VALIDATE INCOMING REQUEST ---
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const validation = shippingRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input.", details: validation.error.formErrors },
      { status: 400 },
    );
  }

  const { destination_address, destination_postal_code, items } = validation.data;

  // --- 2. CONSTRUCT BITESHP PAYLOAD ---
  const biteshipPayload = {
    origin_contact_name: process.env.ORIGIN_CONTACT_NAME,
    origin_contact_phone: process.env.ORIGIN_CONTACT_PHONE,
    origin_address: process.env.ORIGIN_ADDRESS,
    origin_postal_code: parseInt(process.env.ORIGIN_POSTAL_CODE || "0"),
    destination_contact_name: "Placeholder Name", // Will be replaced by form data
    destination_contact_phone: "080000000000", // Will be replaced by form data
    destination_address: destination_address,
    destination_postal_code: parseInt(destination_postal_code),
    couriers: "grab,gojek,jne,anteraja,lalamove", // Couriers for Jabodetabek
    items: items,
  };

  // --- 3. FETCH RATES FROM BITESHIP ---
  try {
    const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.BITESHIP_API_KEY || "",
      },
      body: JSON.stringify(biteshipPayload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Biteship API Error:", errorBody);
      return NextResponse.json(
        { success: false, error: "Failed to fetch rates from Biteship.", details: errorBody },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (!data.success) {
        console.error("Biteship API Error:", data.error);
        return NextResponse.json(
          { success: false, error: "Biteship could not process the request.", details: data.error },
          { status: 400 },
        );
    }

    // --- 4. FORMAT AND RETURN RESPONSE ---
    // Explicitly set cache-control headers to disable caching
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    };

    return NextResponse.json({ success: true, pricing: data.pricing }, { status: 200, headers });

  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { success: false, error: "An internal server error occurred." },
      { status: 500 },
    );
  }
}
