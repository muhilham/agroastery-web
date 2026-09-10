/**
 * Instagram/Meta shopping signals for product pages (issue: IG product-tag flow).
 *
 * Meta's crawler (MetaExternalAgent) reads Open Graph `product:` namespace
 * tags to build/refresh catalog entries, alongside JSON-LD. Next 16's
 * metadata API has no 'product' og:type, so these are emitted as raw <meta>
 * tags (React hoists them into <head>).
 *
 * Field mapping for catalog parity:
 *  - retailer_item_id  = variant SKU when present (catalog item id)
 *  - item_group_id     = product id (groups variants under one product)
 *  - price/availability = the selected (or cheapest) variant, matching what
 *    the shopper sees on landing
 */
import { findMatchingVariant } from "@/lib/supabase/queries/productUtils";
import type { SupabaseProduct, SupabaseProductVariant } from "@/types/product";

export type MetaProductTags = {
  property: string;
  content: string;
}[];

export function buildMetaProductTags(input: {
  productId: string;
  sku: string | null;
  price: number;
  inStock: boolean;
  brand?: string;
}): MetaProductTags {
  return [
    { property: "og:type", content: "product" },
    { property: "product:retailer_item_id", content: input.sku ?? input.productId },
    { property: "product:item_group_id", content: input.productId },
    { property: "product:price:amount", content: String(input.price) },
    { property: "product:price:currency", content: "IDR" },
    { property: "product:availability", content: input.inStock ? "in stock" : "out of stock" },
    { property: "product:condition", content: "new" },
    { property: "product:brand", content: input.brand ?? "Agroastery" },
    { property: "og:locale:alternate", content: "en_US" },
  ];
}

/**
 * Resolve an initial variant selection (?variant=<id> deep link, used by
 * Instagram product tags so buyers land on the exact tagged size/grind).
 * Returns the {optionId: optionValueId} map the detail form expects, or
 * null when the id is missing/inactive (caller falls back to defaults).
 */
export function resolveInitialSelection(
  product: {
    product_options: { id: string; product_option_values: { id: string }[] }[];
    product_variants: {
      id: string;
      is_active: boolean;
      product_variant_option_values: { option_value_id: string }[];
    }[];
  },
  variantId: string | undefined | null
): Record<string, string> | null {
  if (!variantId) return null;
  const variant = product.product_variants.find(
    (v) => v.id === variantId && v.is_active
  );
  if (!variant) return null;

  const valueIds = new Set(
    variant.product_variant_option_values.map((v) => v.option_value_id)
  );
  const selection: Record<string, string> = {};
  for (const option of product.product_options) {
    const hit = option.product_option_values.find((val) => valueIds.has(val.id));
    if (!hit) return null; // variant spans an option this product doesn't have
    selection[option.id] = hit.id;
  }
  return Object.keys(selection).length > 0 ? selection : null;
}

/**
 * The variant the detail form displays on load: the ?variant= deep link when
 * valid, else the selection of each option's first value by display_order —
 * mirroring SupabaseProductDetail's default-state + findMatchingVariant
 * lookup exactly. The OG product tags must describe THIS variant, or Meta's
 * crawler and the shopper see different price/SKU/stock.
 * Returns null when no variant matches (the form then shows no add-to-cart,
 * and tags report out of stock).
 */
export function resolveShownVariant(
  product: SupabaseProduct,
  variantId: string | undefined | null
): SupabaseProductVariant | null {
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  if (activeVariants.length === 0) return null;
  const selection =
    resolveInitialSelection(product, variantId) ?? defaultSelection(product);
  if (!selection) {
    // option-less product: the form shows the first active variant
    return activeVariants[0] ?? null;
  }
  return findMatchingVariant(activeVariants, Object.values(selection));
}

function defaultSelection(
  product: SupabaseProduct
): Record<string, string> | null {
  const selection: Record<string, string> = {};
  for (const option of product.product_options) {
    const first = [...option.product_option_values].sort(
      (a, b) => a.display_order - b.display_order
    )[0];
    if (first) selection[option.id] = first.id;
  }
  return Object.keys(selection).length > 0 ? selection : null;
}
