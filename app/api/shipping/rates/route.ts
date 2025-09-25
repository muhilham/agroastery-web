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
  destination_postal_code: z.union([z.string(), z.number()]),
  couriers: z.string().min(1), // comma separated
  items: z.array(ItemSchema).min(1),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
    },
    body: JSON.stringify({
      ...body,
      origin_postal_code: Number(body.origin_postal_code),
      destination_postal_code: Number(body.destination_postal_code),
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
