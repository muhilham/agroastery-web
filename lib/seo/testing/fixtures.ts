/**
 * Catalog fixtures for issue #178 content-page tests. Shaped exactly like
 * SupabaseProduct so page tests can feed getProducts() realistically
 * (prices are IDR BIGINT; sizes ride on the Size option values).
 */
import type { SupabaseProduct } from "@/types/product";

function variant(
  id: string,
  price: number,
  valueIds: string[],
  opts: Partial<SupabaseProduct["product_variants"][number]> = {}
) {
  return {
    id,
    sku: null,
    price,
    compare_at_price: null,
    stock_quantity: 10,
    ship_weight_grams: 1000,
    is_active: true,
    images: [],
    product_variant_option_values: valueIds.map((option_value_id) => ({
      option_value_id,
    })),
    ...opts,
  };
}

function product(
  slug: string,
  name: string,
  categories: string[],
  sizePrices: [string, number][],
  grindOption = false
): SupabaseProduct {
  const option_values = sizePrices.map(([value], i) => ({
    id: `${slug}-v${i}`,
    value,
    display_order: i,
  }));
  const product_variants = sizePrices.map(([value, price], i) =>
    variant(`${slug}-var${i}`, price, [option_values[i].id])
  );
  return {
    id: `id-${slug}`,
    name,
    slug,
    description: `<p>${name} — long description for tests.</p>`,
    short_description: "Uji rasa singkat untuk fixture.",
    category_ids: categories,
    images: [],
    image_url: null,
    is_active: true,
    is_global: false,
    is_global_discountable: false,
    total_sold_count: 5,
    product_options: [
      {
        id: `${slug}-opt`,
        name: "Size",
        display_order: 0,
        product_option_values: option_values,
      },
    ],
    product_variants: product_variants as SupabaseProduct["product_variants"],
    ...(grindOption
      ? {
          product_options: [
            ...([
              {
                id: `${slug}-opt`,
                name: "Size",
                display_order: 0,
                product_option_values: option_values,
              },
            ] as SupabaseProduct["product_options"]),
          ],
        }
      : {}),
  } as SupabaseProduct;
}

export const SUSU_5050 = product(
  "biji-kopi-blend-5050-kopi-susu-ekonomis",
  "Biji Kopi Blend 50/50 Kopi Susu Ekonomis",
  ["Kopi Susu Series"],
  [
    ["100gram", 33000],
    ["1Kg", 265000],
  ]
);

export const SUSU_7030 = product(
  "biji-kopi-blend-7030-kopi-susu-ekonomis",
  "Biji Kopi Blend 70/30 Kopi Susu Ekonomis",
  ["Kopi Susu Series"],
  [
    ["100gram", 34000],
    ["1Kg", 295000],
  ]
);

export const ROBUSTA_100 = product(
  "biji-kopi-full-robusta-kopi-susu-ekonomis",
  "Biji Kopi Full Robusta Kopi Susu Ekonomis",
  ["Kopi Susu Series"],
  [["100gram", 29000]]
);

export const FILTER_ETHIOPIA = product(
  "biji-kopi-ethiopia-oromia-roasted-for-filter-by-agroastery-150gr",
  "Biji Kopi Ethiopia Oromia Roasted for Filter by Agroastery 150gr",
  ["Roasted for Filter"],
  [["150gram", 150000]]
);

export const FILTER_BALI = product(
  "biji-kopi-seduh-manual-balipeachh",
  "Biji Kopi Seduh Manual BaliPeachH",
  ["Roasted for Filter"],
  [["100gram", 158000]]
);

export const ARABICA_GAYO = product(
  "biji-kopi-standard-gayo-full-arabica",
  "Biji Kopi Standard Gayo Full Arabica",
  ["Roasted for Filter"],
  [
    ["100gram", 59000],
    ["200gram", 97000],
    ["500gram", 214000],
    ["1Kg", 388000],
  ]
);

/**
 * An arabica+robusta espresso blend — the page's FAQ promises "semua produk
 * di tabel adalah biji kopi arabica", so blends must be excluded from the
 * arabica pricing table (name still matches /arabica/i).
 */
export const ARABICA_ROBUSTA_BLEND = product(
  "house-blend-espresso-arabica-fine-robusta-es46",
  "House Blend Espresso Arabica & Fine Robusta ES46",
  ["Espresso Series"],
  [["1Kg", 285000]]
);

/** A product with no size-parseable variants — must be skipped by pricing. */
export const ARABICA_NO_SIZE = product(
  "espresso-arabica-kintamani-1000ml",
  "Espresso Arabica Kintamani 1000ml (ready to drink)",
  [],
  [["1000ml", 25000]]
);

/**
 * Pure arabica sold only in a 150gr pack — exercises the JSON-LD anchor: the
 * extrapolated bestPerKg (150.000*1000/150=1.000.000) must NOT become the
 * structured-data offer; the real 150.000 purchasable price should.
 */
export const ARABICA_FILTER_150 = product(
  "biji-kopi-arabica-filter-oromia-150gr",
  "Biji Kopi Arabica Oromia Roasted for Filter 150gr",
  ["Roasted for Filter"],
  [["150gram", 150000]]
);

export const UNRELATED = product(
  "tumbler-glass-agroastery",
  "Tumbler Glass Agroastery",
  ["Merch"],
  [["Standar", 79000]]
);

export const FIXTURE_PRODUCTS = [
  SUSU_5050,
  SUSU_7030,
  ROBUSTA_100,
  FILTER_ETHIOPIA,
  FILTER_BALI,
  ARABICA_GAYO,
  ARABICA_NO_SIZE,
  UNRELATED,
];
