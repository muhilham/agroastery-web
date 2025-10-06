import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// We proxy Biteship as-is and do not transform the response shape.
// Client code must validate/normalize with BiteshipRatesResponseSchema.

const ItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.number().int().nonnegative(),
  length: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  weight: z.number().int().positive(), // grams
  quantity: z.number().int().positive(),
});

const BodySchema = z.object({
  origin_postal_code: z.union([z.string(), z.number()]),
  destination_postal_code: z.union([z.string(), z.number()]).optional(),
  destination_latitude: z.number().optional(),
  destination_longitude: z.number().optional(),
  couriers: z.string().min(1), // comma separated
  items: z.array(ItemSchema).min(1),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // Validate location: allow either lat/lng pair OR destination_postal_code
  const hasGeo =
    typeof body.destination_latitude === 'number' && Number.isFinite(body.destination_latitude) &&
    typeof body.destination_longitude === 'number' && Number.isFinite(body.destination_longitude);

  const hasPostal = body.destination_postal_code !== undefined &&
    Number.isFinite(Number(body.destination_postal_code));

  if (!hasGeo && !hasPostal) {
    return NextResponse.json({
      error: "Destination must include either a valid latitude/longitude pair or a destination_postal_code",
    }, { status: 400 });
  }

  // Include origin coordinates as well (env-overridable), default to provided coordinates
  const DEFAULT_ORIGIN_LAT = -6.263450138760574;
  const DEFAULT_ORIGIN_LNG = 106.81945752406575;
  const originLatitude = Number(process.env.ORIGIN_LATITUDE ?? DEFAULT_ORIGIN_LAT);
  const originLongitude = Number(process.env.ORIGIN_LONGITUDE ?? DEFAULT_ORIGIN_LNG);
  const includeOriginGeo = Number.isFinite(originLatitude) && Number.isFinite(originLongitude);

  const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
    },
    body: JSON.stringify({
      origin_postal_code: Number(body.origin_postal_code),
      ...(includeOriginGeo ? { origin_latitude: originLatitude, origin_longitude: originLongitude } : {}),
      couriers: body.couriers,
      items: body.items,
      ...(hasGeo
        ? {
            destination_latitude: body.destination_latitude,
            destination_longitude: body.destination_longitude,
          }
        : {
            destination_postal_code: Number(body.destination_postal_code!),
          }),
    }),
    // Remove Next.js specific options for edge runtime compatibility
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "Biteship error", details: text }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
