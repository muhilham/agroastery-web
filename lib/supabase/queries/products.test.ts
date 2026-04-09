import { describe, it, expect } from 'vitest';
import { deriveCategoriesFromProducts } from './products';
import type { SupabaseProduct } from '@/types/product';

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
    expect(deriveCategoriesFromProducts([])).toEqual([]);
  });

  it('returns unique category names sorted alphabetically', () => {
    const products = [makeProduct(['Roasted for Filter', 'AG Signature Blend'])];
    expect(deriveCategoriesFromProducts(products)).toEqual([
      'AG Signature Blend',
      'Roasted for Filter',
    ]);
  });

  it('deduplicates category names across multiple products', () => {
    const products = [
      makeProduct(['Roasted for Filter']),
      makeProduct(['Roasted for Filter', 'Fine Robusta']),
    ];
    expect(deriveCategoriesFromProducts(products)).toEqual([
      'Fine Robusta',
      'Roasted for Filter',
    ]);
  });

  it('ignores empty strings in category_ids', () => {
    const products = [makeProduct(['', 'Roasted for Filter', ''])];
    expect(deriveCategoriesFromProducts(products)).toEqual(['Roasted for Filter']);
  });

  it('returns empty array when all products have empty category_ids', () => {
    const products = [makeProduct([]), makeProduct([])];
    expect(deriveCategoriesFromProducts(products)).toEqual([]);
  });
});
