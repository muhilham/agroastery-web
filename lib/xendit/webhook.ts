import { NextRequest } from "next/server";

/**
 * Verify Xendit webhook token from request header.
 * Xendit sends x-callback-token header with a static token.
 */
export function verifyXenditWebhook(request: NextRequest): boolean {
  const token = request.headers.get("x-callback-token");
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!expectedToken) {
    console.warn("XENDIT_WEBHOOK_TOKEN not configured");
    return false;
  }

  return token === expectedToken;
}
