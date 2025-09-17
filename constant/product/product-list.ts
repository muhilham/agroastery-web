import type { TProduct } from '@/types/product';
import { loadRawProducts, adaptProduct, slugify } from '@/lib/catalog';
import { CATEGORY_BY_ID } from '../category';

const rawProducts = await loadRawProducts();

export const PRODUCT_LIST: TProduct[] = rawProducts.map((p) =>
  adaptProduct(p, CATEGORY_BY_ID)
);

// Re-export slugify to maintain the public API of this module
export { slugify };
