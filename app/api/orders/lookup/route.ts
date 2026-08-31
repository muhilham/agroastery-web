import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

const rateLimitMap = new Map<string, number[]>();
const FINGERPRINT_SECRET = "agroastery-lookup-v1";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const rightMost = parts.at(-1)?.trim();
    if (rightMost) return rightMost;
  }
  return computeFingerprint(req);
}

function computeFingerprint(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(ua + FINGERPRINT_SECRET)
    .digest("hex");
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(ip) ?? [];
  const windowStart = now - WINDOW_MS;
  const recentAttempts = attempts.filter((t) => t > windowStart);
  if (recentAttempts.length === 0) {
    rateLimitMap.delete(ip);
  } else {
    rateLimitMap.set(ip, recentAttempts);
  }
  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const attempts = rateLimitMap.get(ip) ?? [];
  attempts.push(Date.now());
  rateLimitMap.set(ip, attempts);
}

const LookupSchema = z.object({
  orderNumber: z.string().trim().min(1).transform((v) => v.toUpperCase()),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) } }
    );
  }

  recordAttempt(ip);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const parsed = LookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { orderNumber, email } = parsed.data;

  const admin = createSupabaseAdminClient();
  const { data: order, error } = await admin
    .from("ecom_orders")
    .select("id")
    .eq("order_number", orderNumber)
    .eq("customer_email", email)
    .maybeSingle();

  if (error) {
    console.error("[orders/lookup] DB error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi nanti." },
      { status: 500 }
    );
  }

  if (!order) {
    return NextResponse.json(
      { error: "Pesanan tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json({ orderId: order.id });
}
