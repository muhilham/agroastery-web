import { describe, it, expect } from 'vitest';
import { deriveCategoriesFromProducts } from './products';
import type { SupabaseProduct } from '@/types/product';
import type { TCategory } from '@/types/categories';

const ALL_CATEGORIES: TCategory[] = [
  { category_id: '1', category_name: 'Kopi Susu' },
  { category_id: '2', category_name: 'AG Signature' },
  { category_id: '3', category_name: 'Full Arabica' },
];

function makeProduct(category_ids: string[]): SupabaseProduct {
  return {
    id: 'test-id',
    name: 'Test Product',
    slug: 'test-product',
    description: null,
    short_description: null,
    category_ids,
    images: [],
    image_url: null,
    is_active: true,
    product_options: [],
    product_variants: [],
  };
}

describe('deriveCategoriesFromProducts', () => {
  it('returns empty array when no products', () => {
    const result = deriveCategoriesFromProducts([], ALL_CATEGORIES);
    expect(result).toEqual([]);
  });

  it('returns only categories that appear in at least one product', () => {
    const products = [makeProduct(['1', '3'])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1', '3']);
  });

  it('preserves the order defined in allCategories, not the order in products', () => {
    const products = [makeProduct(['3', '1'])]; // reversed order in product
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1', '3']); // still in allCategories order
  });

  it('deduplicates category_ids across multiple products', () => {
    const products = [makeProduct(['1', '2']), makeProduct(['1', '3'])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1', '2', '3']);
  });

  it('ignores category_ids that do not exist in allCategories', () => {
    const products = [makeProduct(['1', 'unknown-id'])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result.map((c) => c.category_id)).toEqual(['1']);
  });

  it('returns empty array when products have empty category_ids', () => {
    const products = [makeProduct([]), makeProduct([])];
    const result = deriveCategoriesFromProducts(products, ALL_CATEGORIES);
    expect(result).toEqual([]);
  });
});
