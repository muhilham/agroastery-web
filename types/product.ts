export type TVariant = { 
  weight: string; 
  price: number; 
  sku: string; 
  quantity: number 
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
