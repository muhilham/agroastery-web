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
        // Default: all other bots
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout/", "/account/", "/orders/", "/login/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}