export type TProductBase = {
  title: string;
  description: string;
  grindSize: string[];
  size: string[];
  coffeType: string[];
  category_ids: string[];
  images: { image: string }[];
  shortDescription?: string;
  price?: number;
  priceBySize?: Record<string, number>;
};

export type TProduct = Omit<TProductBase, "category_ids"> & {
  slug: string;
  category: { category_id: string; category_name: string }[];
  priceBySize: Record<string, number>;
  minPrice: number;
  price: number;
};
