import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { SupabaseProduct } from "@/types/product";
import type { ProductDiscount, GlobalDiscount } from "@/types/discount";
import { getActiveGlobalDiscounts, getActiveProductDiscounts, getActiveProductDiscountsByProductId } from "./discounts";
import { calculateDiscountedPrice } from "@/lib/utils/discount";

export type { SupabaseProduct, SupabaseProductOption, SupabaseProductVariant, SupabaseOptionValue } from "@/types/product";
export { findMatchingVariant, getMinPrice, getMinOriginalPrice, hasAnyDiscount, getProductImageUrl } from "./productUtils";

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
  is_global,
  is_global_discountable,
  product_options (
    id, name, display_order,
    product_option_values (id, value, display_order)
  ),
  product_variants (
    id, sku, price, compare_at_price, stock_quantity, ship_weight_grams, is_active,
    product_variant_option_values (option_value_id)
  )
`;

function enrichProductWithDiscounts(
  product: SupabaseProduct,
  productDiscounts: ProductDiscount[],
  globalDiscounts: GlobalDiscount[]
): SupabaseProduct {
  const applicableProductDiscounts = productDiscounts.filter(
    (d) => d.product_id === product.id
  );
  // Use is_global_discountable if set, otherwise fall back to is_global for backwards compatibility
  const isDiscountable = product.is_global_discountable ?? product.is_global;
  const applicableGlobalDiscounts = isDiscountable ? globalDiscounts : [];

  return {
    ...product,
    product_variants: product.product_variants.map((variant) => {
      const { discountedPrice } = calculateDiscountedPrice(
        variant.price,
        applicableProductDiscounts,
        applicableGlobalDiscounts
      );
      return {
        ...variant,
        discounted_price: discountedPrice !== variant.price ? discountedPrice : undefined,
      };
    }),
  };
}

export async function getProducts(): Promise<SupabaseProduct[]> {
  const supabase = createSupabaseAdminClient();

  const [productsResult, globalDiscounts, productDiscounts] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .not("slug", "is", null)
      .order("name"),
    getActiveGlobalDiscounts(),
    getActiveProductDiscounts(),
  ]);

  if (productsResult.error) {
    console.error("getProducts error:", productsResult.error);
    return [];
  }

  const products = (productsResult.data ?? []) as unknown as SupabaseProduct[];
  return products
    .filter((p) => p.product_variants?.some((v) => v.is_active))
    .map((p) => enrichProductWithDiscounts(p, productDiscounts, globalDiscounts));
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

  const product = data as unknown as SupabaseProduct;
  const [globalDiscounts, productDiscounts] = await Promise.all([
    getActiveGlobalDiscounts(),
    getActiveProductDiscountsByProductId(product.id),
  ]);

  return enrichProductWithDiscounts(product, productDiscounts, globalDiscounts);
}

export function deriveCategoriesFromProducts(products: SupabaseProduct[]): string[] {
  const seen = new Set<string>();
  for (const p of products) {
    for (const cat of p.category_ids) {
      if (cat) seen.add(cat);
    }
  }
  return [...seen].sort();
}
