import type { SupabaseProduct, SupabaseProductVariant } from "@/types/product";

/**
 * Given selected option value IDs, find the matching variant.
 * Pure function — safe to import in client components.
 */
export function findMatchingVariant(
  variants: SupabaseProductVariant[],
  selectedOptionValueIds: string[]
): SupabaseProductVariant | null {
  return (
    variants.find((variant) => {
      const variantValueIds = variant.product_variant_option_values.map(
        (v) => v.option_value_id
      );
      return (
        selectedOptionValueIds.length === variantValueIds.length &&
        selectedOptionValueIds.every((id) => variantValueIds.includes(id))
      );
    }) ?? null
  );
}

/**
 * Get minimum price across all active variants.
 * Pure function — safe to import in client components.
 */
export function getMinPrice(variants: SupabaseProductVariant[]): number {
  const activePrices = variants.filter((v) => v.is_active).map((v) => v.price);
  return activePrices.length > 0 ? Math.min(...activePrices) : 0;
}

/**
 * Get the first image URL from the product.
 * Pure function — safe to import in client components.
 */
export function getProductImageUrl(product: SupabaseProduct): string {
  const images = product.images as { url: string }[] | null;
  if (images && images.length > 0) return images[0].url;
  return product.image_url ?? "/assets/placeholder.png";
}
