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
