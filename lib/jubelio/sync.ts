import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  fetchAllJubelioProducts,
  fetchJubelioProductDetail,
  type JubelioProductGroup,
  type JubelioVariant,
} from "./client";

// SKU prefixes to skip (packaging, add-ons, non-product items)
const SKIP_SKU_PREFIXES = ["PS-NBK-", "PS-ADD_", "PJ-NBK-"];
const SKIP_NAME_KEYWORDS = [
  "kardus", "pouch", "sticker", "sleeve", "ongkos", "kertas",
  "bubble wrap", "gas ", "roti ", "mineral", "buku", "paper filter",
  "kopi susu agroastery", "kopi seduh manual event",
];

// Minimum retail price to be considered an ecom product (IDR)
const MIN_RETAIL_PRICE = 15_000;

// Grind suffix → display label mapping
const GRIND_SUFFIX_MAP: Record<string, string> = {
  V_BEA: "Beans",
  V_COA: "Coarse",
  V_FIN: "Fine",
  V_MED: "Medium",
};

export type SyncResult = {
  synced: number;
  skipped: number;
  errors: string[];
};

function isEcomProduct(group: JubelioProductGroup): boolean {
  const nameLower = group.item_name.toLowerCase();

  // Skip by name keyword
  if (SKIP_NAME_KEYWORDS.some((kw) => nameLower.includes(kw))) return false;

  // Skip if ALL variants have non-retail SKU prefix
  const hasNonProductSku = group.variants.every((v) =>
    SKIP_SKU_PREFIXES.some((prefix) => v.item_code.startsWith(prefix))
  );
  if (hasNonProductSku) return false;

  // Must have at least one variant with a real retail price
  const hasRetailPrice = group.variants.some((v) => {
    const price = parseFloat(String(v.sell_price ?? 0));
    return price >= MIN_RETAIL_PRICE;
  });

  return hasRetailPrice;
}

function generateSlug(name: string, suffix?: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return suffix ? `${base}-${suffix}` : base;
}

function detectGrindFromSku(sku: string): string | null {
  for (const [suffix, label] of Object.entries(GRIND_SUFFIX_MAP)) {
    if (sku.includes(`_${suffix}`) || sku.endsWith(`-${suffix}`)) return label;
  }
  return null;
}

function parsePrice(raw: number | string | null): number {
  if (raw === null || raw === undefined) return 0;
  return Math.round(parseFloat(String(raw)));
}

async function upsertProduct(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  name: string,
  slug: string
): Promise<string | null> {
  // Check if product with this slug already exists
  const { data: existing } = await supabase
    .from("products")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return existing.id as string;

  // Insert new product (base_price and unit are required by the shared ops schema)
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      base_price: 0,
      unit: "pcs",
      is_active: true,
      is_global: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Insert product "${name}": ${error.message}`);
  return data.id as string;
}

async function upsertVariantWithGrind(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  productId: string,
  variants: JubelioVariant[],
  shipWeightGrams: number
): Promise<void> {
  // Collect all unique grind values from these variants
  const grindValues = [
    ...new Set(
      variants
        .map((v) => detectGrindFromSku(v.item_code))
        .filter((g): g is string => g !== null)
    ),
  ];

  const hasGrindOptions = grindValues.length > 0;
  let optionId: string | null = null;
  const optionValueMap: Record<string, string> = {}; // grindLabel → optionValueId

  if (hasGrindOptions) {
    // Upsert the "Grind" option
    const { data: existingOpt } = await supabase
      .from("product_options")
      .select("id")
      .eq("product_id", productId)
      .eq("name", "Grind")
      .maybeSingle();

    if (existingOpt) {
      optionId = existingOpt.id as string;
    } else {
      const { data: newOpt, error } = await supabase
        .from("product_options")
        .insert({ product_id: productId, name: "Grind", display_order: 0 })
        .select("id")
        .single();
      if (error) throw new Error(`Insert option: ${error.message}`);
      optionId = newOpt.id as string;
    }

    // Upsert each option value
    for (let i = 0; i < grindValues.length; i++) {
      const value = grindValues[i];
      const { data: existingVal } = await supabase
        .from("product_option_values")
        .select("id")
        .eq("option_id", optionId)
        .eq("value", value)
        .maybeSingle();

      if (existingVal) {
        optionValueMap[value] = existingVal.id as string;
      } else {
        const { data: newVal, error } = await supabase
          .from("product_option_values")
          .insert({ option_id: optionId, value, display_order: i })
          .select("id")
          .single();
        if (error) throw new Error(`Insert option value "${value}": ${error.message}`);
        optionValueMap[value] = newVal.id as string;
      }
    }
  }

  // Upsert each variant
  for (const v of variants) {
    const price = parsePrice(v.sell_price);
    const stockQty = v.available_qty ?? 0;

    const { data: existingVariant } = await supabase
      .from("product_variants")
      .select("id")
      .eq("sku", v.item_code)
      .maybeSingle();

    let variantId: string;

    if (existingVariant) {
      // Update stock and price
      await supabase
        .from("product_variants")
        .update({ price, stock_quantity: Math.max(0, stockQty), ship_weight_grams: shipWeightGrams })
        .eq("id", existingVariant.id);
      variantId = existingVariant.id as string;
    } else {
      const { data: newVariant, error } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          sku: v.item_code,
          price,
          stock_quantity: Math.max(0, stockQty),
          ship_weight_grams: shipWeightGrams,
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Insert variant "${v.item_code}": ${error.message}`);
      variantId = newVariant.id as string;
    }

    // Link variant to grind option value if applicable
    if (hasGrindOptions && optionId) {
      const grindLabel = detectGrindFromSku(v.item_code);
      if (grindLabel && optionValueMap[grindLabel]) {
        await supabase
          .from("product_variant_option_values")
          .upsert(
            { variant_id: variantId, option_value_id: optionValueMap[grindLabel] },
            { onConflict: "variant_id,option_value_id", ignoreDuplicates: true }
          );
      }
    }
  }
}

export async function syncJubelioProducts(): Promise<SyncResult> {
  const supabase = createSupabaseAdminClient();
  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  const allProducts = await fetchAllJubelioProducts();
  const ecomProducts = allProducts.filter(isEcomProduct);

  console.log(`[Jubelio Sync] Total: ${allProducts.length}, Ecom-relevant: ${ecomProducts.length}`);

  // Track used slugs in this run to handle duplicates within Jubelio
  const usedSlugs = new Set<string>();

  for (const group of ecomProducts) {
    try {
      // Fetch group detail for package_weight
      const detail = await fetchJubelioProductDetail(group.item_group_id);
      const packageWeightGrams = Math.round(parseFloat(detail.package_weight ?? "150") * 1.3); // +30% packaging

      // Generate unique slug
      let slug = generateSlug(group.item_name);
      let slugSuffix = 2;
      while (usedSlugs.has(slug)) {
        slug = generateSlug(group.item_name, slugSuffix++);
      }
      usedSlugs.add(slug);

      const productId = await upsertProduct(supabase, group.item_name, slug);
      if (!productId) throw new Error("upsertProduct returned null");

      await upsertVariantWithGrind(supabase, productId, group.variants, packageWeightGrams);

      result.synced++;
      console.log(`[Jubelio Sync] ✓ ${group.item_name} (${group.variants.length} variant(s))`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${group.item_name}: ${msg}`);
      console.error(`[Jubelio Sync] ✗ ${group.item_name}: ${msg}`);
    }
  }

  result.skipped = allProducts.length - ecomProducts.length;
  return result;
}
