import type { SupabaseProduct, SupabaseProductVariant } from "@/types/product";

/**
 * Given selected option value IDs, find the matching variant.
 * Pure function — safe to import in client components.
 */
export function findMatchingVariant(
  variants: SupabaseProductVariant[],
  selectedOptionValueIds: string[]
): SupabaseProductVariant | null {
  const selectedSet = new Set(selectedOptionValueIds);
  return (
    variants.find((variant) => {
      const variantValueIds = variant.product_variant_option_values.map(
        (v) => v.option_value_id
      );
      return (
        selectedOptionValueIds.length === variantValueIds.length &&
        variantValueIds.every((id) => selectedSet.has(id))
      );
    }) ?? null
  );
}

/**
 * Get minimum price across all active variants.
 * Uses discounted_price if available, otherwise falls back to price.
 * Pure function — safe to import in client components.
 */
export function getMinPrice(variants: SupabaseProductVariant[]): number {
  const activePrices = variants.filter((v) => v.is_active).map((v) => v.discounted_price ?? v.price);
  return activePrices.length > 0 ? Math.min(...activePrices) : 0;
}

/**
 * Get minimum original price across all active variants (ignores discounts).
 * Pure function — safe to import in client components.
 */
export function getMinOriginalPrice(variants: SupabaseProductVariant[]): number {
  const activePrices = variants.filter((v) => v.is_active).map((v) => v.price);
  return activePrices.length > 0 ? Math.min(...activePrices) : 0;
}

/**
 * Check if any active variant has a discount applied.
 * Pure function — safe to import in client components.
 */
export function hasAnyDiscount(variants: SupabaseProductVariant[]): boolean {
  return variants.some((v) => v.is_active && v.discounted_price !== undefined);
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

/**
 * Get the first image URL from a variant, falling back to the product.
 * Pure function — safe to import in client components.
 */
export function getVariantImageUrl(
  variant: SupabaseProductVariant,
  product: SupabaseProduct
): string {
  if (variant.images && variant.images.length > 0) return variant.images[0].url;
  return getProductImageUrl(product);
}
