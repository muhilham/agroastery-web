/**
 * Shared data for the issue #178 SEO content pages.
 *
 * Category slugs in the URL are marketing-friendly; the Supabase `products.category_ids`
 * column holds the real category names (probed live 2026-09: "Kopi Susu Series" and
 * "Roasted for Filter"). Keep this mapping honest — a wrong string silently yields an
 * empty grid, so the page tests assert the wiring.
 */
import type { SupabaseProduct } from "@/types/product";

export const KOPI_SUSU_CATEGORY = "Kopi Susu Series";
export const ROASTED_FOR_FILTER_CATEGORY = "Roasted for Filter";

/** Canonical site URL used in metadata/JSON-LD (matches BreadcrumbJsonLd fallback). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agroastery.com";

export function productsInCategory(
  products: SupabaseProduct[],
  category: string
): SupabaseProduct[] {
  return products.filter((p) => p.category_ids?.includes(category));
}

/** Shared OG image (same asset /konsultasi uses — keeps social cards consistent). */
export const OG_IMAGE =
  "https://github.com/user-attachments/assets/79b22a6a-f341-40f6-ac74-27c6af123b7e";
