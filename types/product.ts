// ============================================================
// Supabase-based types
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
  discounted_price?: number;
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
  is_global: boolean;
  is_global_discountable: boolean;
  product_options: SupabaseProductOption[];
  product_variants: SupabaseProductVariant[];
};
