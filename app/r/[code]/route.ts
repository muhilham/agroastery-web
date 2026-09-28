import { NextRequest, NextResponse } from "next/server";

/**
 * Short-link redirects for printed QR codes.
 *
 * Cards encode https://agroastery.com/r/<code> — the code never changes,
 * while the target page and campaign tagging live here, so future print
 * runs need no logic change and tracking can be edited server-side.
 *
 * UTM params are appended on redirect so scans land in GA4 under the
 * "card / qr" campaign instead of blurry direct traffic.
 */
const QR_LINKS: Record<string, { path: string; campaign: string }> = {
  "5050": {
    path: "/start/blend-50-50/",
    campaign: "reorder-blend-50-50",
  },
};

const FALLBACK_PATH = "/katalog/";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const link = QR_LINKS[code.toLowerCase()];

  const url = new URL(link ? link.path : FALLBACK_PATH, "https://agroastery.com");
  url.searchParams.set("utm_source", "card");
  url.searchParams.set("utm_medium", "qr");
  url.searchParams.set("utm_campaign", link ? link.campaign : "qr-unknown");

  return NextResponse.redirect(url, 302);
}
