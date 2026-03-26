import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Verify Xendit webhook token from request header.
 * Xendit sends x-callback-token header with a static token.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyXenditWebhook(request: NextRequest): boolean {
  if (process.env.XENDIT_MOCK === "true") {
    console.warn("[Xendit] Webhook verification skipped — MOCK mode");
    return true;
  }

  const token = request.headers.get("x-callback-token");
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!expectedToken) {
    console.warn("XENDIT_WEBHOOK_TOKEN not configured");
    return false;
  }

  if (!token) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expectedToken);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
