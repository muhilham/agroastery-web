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
        disallow: ["/api/", "/checkout/", "/account/", "/orders/", "/login/"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/orders/", "/login/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/orders/", "/login/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/orders/", "/login/"],
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
        // (AI-crawler rules above still keep /checkout/ out for GPTBot et al.)
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/", "/orders/", "/login/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}