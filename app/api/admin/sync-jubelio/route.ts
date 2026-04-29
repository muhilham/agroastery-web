import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { syncJubelioProducts } from "@/lib/jubelio/sync";

function verifyAdminSecret(secret: string | null): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!secret || !expected) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * POST /api/admin/sync-jubelio
 * Fetches products from Jubelio and upserts them into Supabase.
 * Protected by ADMIN_SECRET header.
 */
export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request.headers.get("x-admin-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.JUBELIO_EMAIL || !process.env.JUBELIO_PASSWORD) {
    return NextResponse.json(
      { error: "JUBELIO_EMAIL / JUBELIO_PASSWORD not configured" },
      { status: 503 }
    );
  }

  try {
    const result = await syncJubelioProducts();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-jubelio] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
