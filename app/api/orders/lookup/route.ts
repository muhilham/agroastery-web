import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

const rateLimitMap = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(ip) ?? [];
  const windowStart = now - WINDOW_MS;
  const recentAttempts = attempts.filter((t) => t > windowStart);
  rateLimitMap.set(ip, recentAttempts);
  return recentAttempts.length >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const attempts = rateLimitMap.get(ip) ?? [];
  attempts.push(Date.now());
  rateLimitMap.set(ip, attempts);
}

const LookupSchema = z.object({
  orderNumber: z.string().min(1).transform((v) => v.trim().toUpperCase()),
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(WINDOW_MS / 1000)) } }
    );
  }

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
  recordAttempt(ip);

  const admin = createSupabaseAdminClient();
  const { data: order, error } = await admin
    .from("ecom_orders")
    .select("id")
    .ilike("order_number", orderNumber)
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
