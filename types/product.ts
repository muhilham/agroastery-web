export type TVariant = {
  /** Display label shown to user (e.g., "150g", "1kg") */
  weight: string;
  /** Price in IDR for this variant */
  price: number;
  sku: string;
  quantity: number;
  /** Real shipping mass in grams (includes packaging, etc.). Used for courier pricing. */
  shipWeightGrams: number;
};

export type TProductBase = {
  title: string;
  description: string;
  grindSize: string[];
  coffeType: string[];
  category_ids: string[];
  images: { image: string }[];
  shortDescription?: string;
  variants: TVariant[];
};

export type TProduct = Omit<TProductBase, "category_ids"> & {
  slug: string;
  category: { category_id: string; category_name: string }[];
  priceBySize: Record<string, number>;
  minPrice: number;
  price: number;
  size: string[];
};

// ============================================================
// Supabase-based types (Phase 2+)
// ============================================================

export type SupabaseOptionValue = {
  id: string;
  value: string;
  display_order: number;
};

export type SupabaseProductOption = {
  id: string;
  name: string;
  display_order: number;
  product_option_values: SupabaseOptionValue[];
};

export type SupabaseProductVariant = {
  id: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  ship_weight_grams: number;
  is_active: boolean;
  product_variant_option_values: { option_value_id: string }[];
};

export type SupabaseProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_ids: string[];
  images: { url: string; alt?: string; sort_order?: number }[];
  image_url: string | null;
  is_active: boolean;
  product_options: SupabaseProductOption[];
  product_variants: SupabaseProductVariant[];
};
