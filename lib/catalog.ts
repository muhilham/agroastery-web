import { z } from 'zod';
import type { TCategory } from '@/types/categories';
import type { TProduct, TProductBase, TVariant } from '@/types/product';
import categoriesJson from '@/data/categories.json';
import productsJson from '@/data/products.json';
import { CategoriesSchema, ProductsSchema as RawProductsSchema, ProductSchema as RawProductSchema } from './schemas';
import { slugify } from './utils';

// Re-export for external use
export { slugify };
import { applyPackaging, parseWeightToGrams } from './utils/weight';

// Environment variables
const USE_CDN = process.env.NEXT_PUBLIC_CATALOG_SOURCE === 'cdn';

// When using the CDN, we proxy requests through our own API to avoid CORS issues.
const getBaseUrl = () => {
  if (!USE_CDN) return ''; // Not using CDN, so no base URL needed.

  // If running on the server, we need an absolute URL.
  if (typeof window === 'undefined') {
    return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/catalog`;
  }

  // If running in the browser, a relative URL is sufficient.
  return '/api/catalog';
};

const BASE = getBaseUrl();

async function fetchJson<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.warn(`CDN fetch failed for ${path}: status ${res.status}`);
      return null;
    }
    const data = await res.json();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      console.warn(`CDN data validation failed for ${path}:`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.warn(`CDN request error for ${path}:`, error);
    return null;
  }
}

export async function loadCategories(): Promise<TCategory[]> {
  if (USE_CDN) {
    const cdnData = await fetchJson('categories.json', CategoriesSchema);
    if (cdnData) return cdnData;
    console.warn('Falling back to local categories.json');
  }
  return CategoriesSchema.parse(categoriesJson);
}

export async function loadRawProducts(): Promise<z.infer<typeof RawProductsSchema>> {
  if (USE_CDN) {
    const cdnData = await fetchJson('products.json', RawProductsSchema);
    if (cdnData) return cdnData;
    console.warn('Falling back to local products.json');
  }
  return RawProductsSchema.parse(productsJson);
}

export function adaptProduct(product: z.infer<typeof RawProductSchema>, CATEGORY_BY_ID: Record<string, TCategory>): TProduct {
  const slug = slugify(product.title);

  const variants: TVariant[] = (product.variants ?? []).map((v) => {
    const legacyGrams = parseWeightToGrams(v.weight);
    const variant = v as { weight: string; price: number; sku: string; quantity: number; shipWeightGrams?: number };
    const ship = typeof variant.shipWeightGrams === 'number' && variant.shipWeightGrams > 0
      ? variant.shipWeightGrams
      : applyPackaging(legacyGrams);
    return {
      weight: v.weight,
      price: v.price,
      sku: v.sku ?? `${slugify(product.title)}-${v.weight}`,
      quantity: v.quantity ?? 999,
      shipWeightGrams: ship,
    };
  });

  const priceBySize = Object.fromEntries(
    variants.map(variant => [variant.weight, variant.price])
  );

  const minPrice = Math.min(...Object.values(priceBySize));

  return {
    ...(product as unknown as TProductBase),
    slug,
    category: product.category_ids.map((id) => CATEGORY_BY_ID[id]).filter(Boolean),
    priceBySize,
    minPrice,
    price: minPrice,
    variants,
    size: product.variants.map(v => v.weight),
  };
}
