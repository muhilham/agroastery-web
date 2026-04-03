import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { SupabaseProduct } from "@/types/product";
import { CATEGORY } from "@/constant/category";
import type { TCategory } from "@/types/categories";
export type { SupabaseProduct, SupabaseProductOption, SupabaseProductVariant, SupabaseOptionValue } from "@/types/product";
export { findMatchingVariant, getMinPrice, getProductImageUrl } from "./productUtils";

const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  short_description,
  category_ids,
  images,
  image_url,
  is_active,
  product_options (
    id, name, display_order,
    product_option_values (id, value, display_order)
  ),
  product_variants (
    id, sku, price, compare_at_price, stock_quantity, ship_weight_grams, is_active,
    product_variant_option_values (option_value_id)
  )
`;

export async function getProducts(): Promise<SupabaseProduct[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .not("slug", "is", null)
    .order("name");

  if (error) {
    console.error("getProducts error:", error);
    return [];
  }

  // Filter out products without any active variants (can't be purchased)
  const products = (data ?? []) as unknown as SupabaseProduct[];
  return products.filter((p) => p.product_variants?.some((v) => v.is_active));
}

export async function getProductBySlug(slug: string): Promise<SupabaseProduct | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("getProductBySlug error:", error);
    }
    return null;
  }

  return data as unknown as SupabaseProduct;
}

export function deriveCategoriesFromProducts(
  products: SupabaseProduct[],
  allCategories: TCategory[] = CATEGORY
): TCategory[] {
  const seenIds = new Set<string>();
  for (const p of products) {
    for (const id of p.category_ids) {
      seenIds.add(id);
    }
  }
  return allCategories.filter((c) => seenIds.has(c.category_id));
}
