import type { TCategory } from '@/types/categories';
import type { TProduct, TProductBase, TVariant } from '@/types/product';
import categoriesData from '@/data/categories.json';
import productsData from '@/data/products.json';

export const slugify = (slug: string) =>
  slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

export function loadCategories(): { CATEGORY: TCategory[]; CATEGORY_BY_ID: Record<string, TCategory> } {
  const CATEGORY: TCategory[] = categoriesData;
  const CATEGORY_BY_ID: Record<string, TCategory> = Object.fromEntries(
    CATEGORY.map((c) => [c.category_id, c])
  );
  return { CATEGORY, CATEGORY_BY_ID };
}

function adaptProduct(product: TProductBase, CATEGORY_BY_ID: Record<string, TCategory>): TProduct {
  const slug = slugify(product.title);

  const priceBySize = Object.fromEntries(
    product.variants.map(variant => [variant.weight, variant.price])
  );

  const minPrice = Math.min(...Object.values(priceBySize));

  const variants = product.variants.map(variant => ({
    ...variant,
    sku: variant.sku || `${slug}-${variant.weight}`,
    quantity: variant.quantity === undefined ? 999 : variant.quantity,
  }));

  return {
    ...product,
    slug,
    category: product.category_ids.map((id) => CATEGORY_BY_ID[id]).filter(Boolean),
    priceBySize,
    minPrice,
    price: minPrice,
    variants,
    size: product.variants.map(v => v.weight),
  };
}

export function loadProducts(CATEGORY_BY_ID: Record<string, TCategory>): TProduct[] {
  return (productsData as TProductBase[]).map(p => adaptProduct(p, CATEGORY_BY_ID));
}
