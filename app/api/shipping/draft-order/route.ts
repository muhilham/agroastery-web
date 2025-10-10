import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CoordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const ItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  value: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  height: z.number().positive().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  weight: z.number().positive(), // grams
});

const PayloadSchema = z
  .object({
    // ORIGIN
    origin_contact_name: z.string(),
    origin_contact_phone: z.string(),
    origin_contact_email: z.string().email().optional(),
    origin_address: z.string(),
    origin_note: z.string().optional(),
    origin_postal_code: z.union([z.number(), z.string()]).optional(),
    origin_coordinate: CoordinateSchema.optional(),
    origin_collection_method: z.enum(["pickup", "drop_off"]).optional(),
    origin_area_id: z.string().optional(),

    // DESTINATION
    destination_contact_name: z.string(),
    destination_contact_phone: z.string(),
    destination_contact_email: z.string().email().optional(),
    destination_address: z.string(),
    destination_postal_code: z.union([z.number(), z.string()]).optional(),
    destination_note: z.string().optional(),
    destination_coordinate: CoordinateSchema.optional(),
    destination_area_id: z.string().optional(),

    // COURIER (optional for draft)
    courier_company: z.string().optional(),
    courier_type: z.string().optional(),
    courier_insurance: z.number().optional(),

    // DELIVERY
    delivery_type: z.enum(["now", "scheduled"]),
    delivery_date: z.string().optional(), // "YYYY-MM-DD"
    delivery_time: z.string().optional(), // "HH:mm"
    order_note: z.string().optional(),

    // META
    metadata: z.record(z.any()).optional(),
    reference_id: z.string().optional(),
    tags: z.array(z.string()).optional(),

    // ITEMS
    items: z.array(ItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    // At least one of postal_code, coordinate, or area_id must exist per side
    const hasOriginOne = Boolean(
      data.origin_postal_code !== undefined ||
        data.origin_coordinate !== undefined ||
        (data.origin_area_id && data.origin_area_id.length > 0)
    );
    if (!hasOriginOne) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Origin must include at least one of: origin_postal_code, origin_coordinate, or origin_area_id",
        path: ["origin_postal_code"],
      });
    }
    const hasDestinationOne = Boolean(
      data.destination_postal_code !== undefined ||
        data.destination_coordinate !== undefined ||
        (data.destination_area_id && data.destination_area_id.length > 0)
    );
    if (!hasDestinationOne) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Destination must include at least one of: destination_postal_code, destination_coordinate, or destination_area_id",
        path: ["destination_postal_code"],
      });
    }

    // If delivery_type is scheduled, encourage date/time presence (not hard required)
    if (data.delivery_type === "scheduled") {
      if (!data.delivery_date || !data.delivery_time) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "For scheduled delivery, delivery_date and delivery_time are recommended.",
          path: ["delivery_type"],
        });
      }
    }
  });

function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((v) => stripUndefined(v)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === undefined) continue;
    out[k] = typeof v === "object" && v !== null ? stripUndefined(v) : v;
  }
  return out as T;
}

export async function POST(req: Request) {
  const json = (await req.json()) as unknown;
  const parsed = PayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = stripUndefined(parsed.data);

  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing BITESHIP_API_KEY server configuration" },
      { status: 500 }
    );
  }

  // Forward to Biteship Draft Orders endpoint (official path)
  const endpoint = "https://api.biteship.com/v1/draft_orders";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text) as unknown;
    return NextResponse.json(json, {
      status: res.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Non-JSON response fallback
    return NextResponse.json(
      { error: "Biteship error", details: text },
      { status: res.ok ? 200 : res.status }
    );
  }
}
