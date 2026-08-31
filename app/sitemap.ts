import { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${siteUrl}/katalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/konsultasi`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/roast-age`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/track`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/cart`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic product pages
  const supabase = createSupabaseAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .not("slug", "is", null);

  const productPages: MetadataRoute.Sitemap = (products ?? []).map(
    (product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: product.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  return [...staticPages, ...productPages];
}