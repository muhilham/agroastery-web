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
const QR_LINKS = new Map<string, { path: string; campaign: string }>([
  [
    "5050",
    {
      path: "/start/blend-50-50/",
      campaign: "reorder-blend-50-50",
    },
  ],
]);

const FALLBACK_PATH = "/katalog/";
const FALLBACK_CAMPAIGN = "qr-unknown";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  // Map lookup: never inherits prototype keys ("constructor", "__proto__"),
  // which a plain object index would resolve to a function truthy-check misses.
  const link = QR_LINKS.get(code.toLowerCase());

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";
  const url = new URL(link ? link.path : FALLBACK_PATH, siteUrl);
  url.searchParams.set("utm_source", "card");
  url.searchParams.set("utm_medium", "qr");
  url.searchParams.set(
    "utm_campaign",
    link ? link.campaign : FALLBACK_CAMPAIGN,
  );

  return NextResponse.redirect(url, 302);
}
