import { createSupabaseAdminClient } from "@/lib/supabase/server";

export interface StockItem {
  variantId: string;
  quantity: number;
}

export interface DbVariant {
  id: string;
  product_id: string | null;
  sku: string | null;
  price: number | null;
  ship_weight_grams: number | null;
  stock_quantity: number | null;
  is_active: boolean | null;
}

export function validateStockAvailability(
  items: StockItem[],
  variantMap: Map<string, DbVariant>
): { valid: true } | { valid: false; error: string; code: string } {
  for (const item of items) {
    const dbVariant = variantMap.get(item.variantId);
    if (!dbVariant || !dbVariant.is_active) {
      return { valid: false, error: "Produk tidak tersedia", code: "VARIANT_UNAVAILABLE" };
    }
    if ((dbVariant.stock_quantity ?? 0) < item.quantity) {
      return { valid: false, error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" };
    }
  }
  return { valid: true };
}

export async function decrementStock(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  items: StockItem[]
): Promise<{ success: true } | { success: false; error: unknown }> {
  const { data: stockDecremented, error: stockError } = await admin.rpc(
    "ecom_decrement_stock_multi",
    {
      p_items: items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    }
  );

  if (stockError || !stockDecremented) {
    return { success: false, error: stockError };
  }

  return { success: true };
}
