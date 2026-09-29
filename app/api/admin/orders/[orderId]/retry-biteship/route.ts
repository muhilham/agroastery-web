import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { retryBiteshipDraft } from "@/lib/biteship/retryDraft";

export const dynamic = "force-dynamic";

function verifyAdminKey(key: string | null): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!key || !expected) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const paramsSchema = z.object({
  orderId: z.string().uuid(),
});

/**
 * POST /api/admin/orders/{orderId}/retry-biteship
 * Manually retries Biteship draft creation for an order.
 * Protected by X-Admin-Key header (ADMIN_SECRET env).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!verifyAdminKey(request.headers.get("x-admin-key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = paramsSchema.parse(await params);

  // Fire-and-forget (#199): the retry chain now awaits a 0/60s/300s backoff,
  // so a synchronous await would hold the request open up to ~6 minutes and
  // hit gateway timeouts. The response means "initiated" — the terminal
  // outcome (success re-alert or BITESHIP GAGAL 3x) arrives via ops alerts.
  // The try/catch only covers synchronous entry failures (bad client setup).
  try {
    retryBiteshipDraft(orderId).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[retry-biteship] Retry chain failed for order ${orderId}:`, message);
    });
    return NextResponse.json({
      success: true,
      message: "Biteship draft retry initiated",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[retry-biteship] Failed for order ${orderId}:`, message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
