import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";

  return {
    rules: [
      {
        // Block aggressive scrapers
        userAgent: "Bytespider",
        disallow: "/",
      },
      {
        // Allow AI/LLM crawlers for AI search visibility
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/track/", "/account/", "/orders/", "/login/"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/track/", "/account/", "/orders/", "/login/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/track/", "/account/", "/orders/", "/login/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/track/", "/account/", "/orders/", "/login/"],
      },
      {
        // Default: all other bots (incl. Googlebot — no explicit rule means it
        // inherits this one).
        // Issue #177: /checkout/ is deliberately NOT disallowed anymore —
        // Google can only honor a page's noindex meta if it can crawl the
        // page; a disallow would keep already-indexed
        // /checkout/{payment,success} URLs stuck in the index (GA4 saw
        // organic landings on them). The noindex, follow robots meta on those
        // pages is now the de-indexing mechanism.
        // Issue #237: same defect found for /account/ and /orders/ — both
        // pages ship a noindex meta (account/page.tsx, orders/page.tsx) that
        // a disallow made unreachable, so GSC removals could never stick.
        // They are now crawlable + noindexed; /orders/[id] gained its own
        // noindex meta to cover every per-order URL shape.
        // /login/ deliberately STAYS disallowed: it is a "use client" page
        // with no metadata export (no layout), carries zero organic landings
        // in GA4 (30d), so exposing it buys nothing (issue #237).
        // (AI-crawler rules above still keep all private paths out.)
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}