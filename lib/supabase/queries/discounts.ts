import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { GlobalDiscount, ProductDiscount } from "@/types/discount";

export async function getActiveGlobalDiscounts(): Promise<GlobalDiscount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("global_discounts")
    .select("id, name, type, value, is_active")
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getActiveGlobalDiscounts error:", error);
    return [];
  }

  return (data ?? []) as GlobalDiscount[];
}

export async function getActiveProductDiscounts(): Promise<ProductDiscount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_discounts")
    .select("id, product_id, name, type, value, is_active")
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getActiveProductDiscounts error:", error);
    return [];
  }

  return (data ?? []) as ProductDiscount[];
}

export async function getActiveProductDiscountsByProductId(
  productId: string
): Promise<ProductDiscount[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_discounts")
    .select("id, product_id, name, type, value, is_active")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getActiveProductDiscountsByProductId error:", error);
    return [];
  }

  return (data ?? []) as ProductDiscount[];
}
