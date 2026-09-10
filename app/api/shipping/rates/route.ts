import { NextResponse } from "next/server";
import { z } from "zod";
import { checkoutOriginGeo, checkoutOriginPostal } from "@/lib/checkout/shippingQuote";
import { consumeRate, retryAfterSeconds, MAX_BODY_BYTES } from "@/lib/api/proxyGuard";

export const dynamic = 'force-dynamic';

// We proxy Biteship as-is and do not transform the response shape.
// Client code must validate/normalize with BiteshipRatesResponseSchema.
//
// #154: this proxy is public by necessity (guest checkout quotes before
// login), but #139 made checkout fail-closed on Biteship errors — unbounded
// abuse here burns the rate API quota and 503s every delivery checkout.
// Guards: per-IP sliding-window limit, body size cap, and the origin is
// pinned to our roastery postal (callers can't turn this into a free quote
// API for an arbitrary warehouse).

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
  items: z.array(ItemSchema).min(1).max(50),
});

// Trust ordering (issue #154 review): cf-connecting-ip is authoritative when
// Cloudflare fronts the domain; otherwise the LAST x-forwarded-for hop is the
// one our trusted edge appended — the FIRST hop is client-supplied and
// spoofable, which would let a bot rotate the header to reset its budget.
function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  const fwd = req.headers.get("x-forwarded-for");
  const hops = fwd?.split(",").map((s) => s.trim()).filter(Boolean);
  return hops?.length ? hops[hops.length - 1] : "unknown";
}

export async function POST(req: Request) {
  try {
    if (!consumeRate(clientIp(req))) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan, coba lagi sebentar" },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds(clientIp(req))) } }
      );
    }

    // Reject oversized claims BEFORE reading (req.text() would buffer it all),
    // then the hard cap on what actually arrived (chunked bodies hide length).
    const claimed = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(claimed) && claimed > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload terlalu besar" }, { status: 413 });
    }
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload terlalu besar" }, { status: 413 });
    }
    const parsed = BodySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    // Origin pin: quotes only ever leave from the Agroastery roastery. Accept
    // the value the browser actually sends (NEXT_PUBLIC_*, inlined at build)
    // as well as the server resolution — they can differ if ops sets only one.
    const clientOrigin = Number(
      (process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE ?? "").trim() || 12440
    );
    const origin = Number(body.origin_postal_code);
    if (origin !== checkoutOriginPostal() && origin !== clientOrigin) {
      return NextResponse.json({ error: "Origin tidak dikenal" }, { status: 403 });
    }

    // Destination must be either finite lat/lng OR a finite 5-digit postal
    // (#139 lesson: Number("") === 0 must not pass as a destination).
    const hasGeo =
      typeof body.destination_latitude === 'number' && Number.isFinite(body.destination_latitude) &&
      typeof body.destination_longitude === 'number' && Number.isFinite(body.destination_longitude);

    const hasPostal = body.destination_postal_code !== undefined &&
      Number.isFinite(Number(body.destination_postal_code)) &&
      /^\d{5}$/.test(String(body.destination_postal_code).trim());

    if (!hasGeo && !hasPostal) {
      return NextResponse.json({
        error: "Destination must include either a valid latitude/longitude pair or a destination_postal_code",
      }, { status: 400 });
    }

    // Check for required API key
    if (!process.env.BITESHIP_API_KEY) {
      console.error("[shipping/rates] BITESHIP_API_KEY is not configured");
      return NextResponse.json({ error: "Shipping service unavailable" }, { status: 503 });
    }

    // Origin geo shared with the /api/checkout re-quote (#151): Biteship only
    // prices geo-dispatch couriers when origin coords are present, so both
    // quote paths must send the exact same values.
    const originGeo = checkoutOriginGeo();

    const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      },
      body: JSON.stringify({
        origin_postal_code: Number(body.origin_postal_code),
        ...(originGeo
          ? { origin_latitude: originGeo.originLatitude, origin_longitude: originGeo.originLongitude }
          : {}),
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
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[shipping/rates] Biteship error:", res.status, text);
      return NextResponse.json({ error: "Biteship error", details: text }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[shipping/rates] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
