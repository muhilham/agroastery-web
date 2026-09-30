import { NextRequest, NextResponse } from "next/server";

/**
 * Short-link redirects for printed QR codes.
 *
 * ## Print-run doc
 *
 * Card URL format (verbatim for the designer): `https://agroastery.com/r/<code>`
 * — no trailing slash needed; Next redirects `/r/5050` → `/r/5050/` fine.
 * The code never changes on the card; target page + campaign live here, so
 * print runs need no reprint when the target moves.
 *
 * HOW TO ADD A CODE: append one `["<code>", { path, campaign }]` entry to
 * QR_LINKS below (lowercase code, path starts with `/`, campaign
 * `reorder-<product>`), then `pnpm test` — route.test.ts enforces registry
 * integrity: non-/product/ paths must be a real static route dir under `app/`;
 * /product/<slug>/ paths are only format-checked, so confirm the slug is
 * active in the catalog/sitemap before print approval. Unknown/retired
 * product slugs still render a sellable page (404 → "Kembali ke Katalog"),
 * so a retired SKU's card never dead-ends. Codes already printed must never
 * be repurposed across products without a print-run note here.
 *
 * GA4 CHECK after cards circulate: GA4 property 547741910, explore report on
 * `sessionCampaignName` — each code's campaign (e.g. reorder-blend-70-30)
 * must show sessions; zero sessions after a week = cards not circulating or
 * codes misprinted.
 *
 * UTM params are appended on redirect so scans land in GA4 under the
 * "card / qr" campaign instead of blurry direct traffic.
 *
 * PRINT RUNS:
 * - v1 (shipped ~2026-09, live since v0.33.0): 5050.
 * - v2 (pre-registered, per last-120-day ecom_order_items volume): 7030,
 *   2080, fa, fr, house-blend, gayo, kintamani.
 */
export const QR_LINKS = new Map<string, { path: string; campaign: string }>([
  // Blend 50/50 → brewing guide (guide pages beat PDPs where they exist).
  [
    "5050",
    {
      path: "/start/blend-50-50/",
      campaign: "reorder-blend-50-50",
    },
  ],
  // Kopi Susu Ekonomis line — top reorder sellers; targets are PDPs until
  // guide pages exist for each blend.
  [
    "7030",
    {
      path: "/product/biji-kopi-blend-7030-kopi-susu-ekonomis/",
      campaign: "reorder-blend-70-30",
    },
  ],
  [
    "2080",
    {
      path: "/product/biji-kopi-blend-2080-kopi-susu-ekonomis/",
      campaign: "reorder-blend-20-80",
    },
  ],
  [
    "fa",
    {
      path: "/product/biji-kopi-full-arabica-kopi-susu-ekonomis-1-kg-1kg/",
      campaign: "reorder-full-arabica",
    },
  ],
  [
    "fr",
    {
      path: "/product/biji-kopi-full-robusta-kopi-susu-ekonomis/",
      campaign: "reorder-full-robusta",
    },
  ],
  // House blend espresso (PRIME73, top seller after the KSE blends).
  [
    "house-blend",
    {
      path: "/product/house-blend-espresso-arabica-fine-robusta-prime73/",
      campaign: "reorder-house-blend-prime73",
    },
  ],
  // Single origins — the two active STANDARD full-arabica sellers.
  [
    "gayo",
    {
      path: "/product/biji-kopi-standard-gayo-full-arabica/",
      campaign: "reorder-standard-gayo",
    },
  ],
  [
    "kintamani",
    {
      path: "/product/biji-kopi-standard-kintamani-full-arabica/",
      campaign: "reorder-standard-kintamani",
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
