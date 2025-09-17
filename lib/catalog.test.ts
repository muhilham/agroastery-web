import { describe, it, expect } from 'vitest';
import { loadCategories, loadProducts, slugify } from './catalog';

describe('catalog loader', () => {
  it('should slugify strings correctly', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('  With Extra   Spaces  ')).toBe('with-extra-spaces');
    expect(slugify('Special!@#Characters')).toBe('specialcharacters');
  });

  it('should load categories and create a map by ID', () => {
    const { CATEGORY, CATEGORY_BY_ID } = loadCategories();
    expect(CATEGORY.length).toBeGreaterThan(0);
    expect(CATEGORY_BY_ID['1']).toEqual({ category_id: '1', category_name: 'Kopi Susu Ekonomis' });
  });

  it('should load products and adapt them correctly', () => {
    const { CATEGORY_BY_ID } = loadCategories();
    const products = loadProducts(CATEGORY_BY_ID);
    const product = products.find(p => p.title.includes('BALIPEACH'));

    expect(product).toBeDefined();
    if (!product) return;

    expect(product.slug).toBe('biji-kopi-balipeach-roasted-for-filter-by-agroaster');
    expect(product.price).toBe(119000);
    expect(product.minPrice).toBe(119000);
    expect(product.priceBySize).toEqual({ '150g': 119000 });
    expect(product.size).toEqual(['150g']);
    expect(product.category[0]?.category_name).toBe('Filter & Others');
    expect(product.variants[0].sku).toBe('biji-kopi-balipeach-roasted-for-filter-by-agroaster-150g');
    expect(product.variants[0].quantity).toBe(999);
  });

  it('should handle products with multiple variants', () => {
    const { CATEGORY_BY_ID } = loadCategories();
    const products = loadProducts(CATEGORY_BY_ID);
    const product = products.find(p => p.title.includes('ES46 Blend'));

    expect(product).toBeDefined();
    if (!product) return;

    expect(product.price).toBe(58000);
    expect(product.minPrice).toBe(58000);
    expect(product.priceBySize).toEqual({ '1000g': 196000, '200g': 58000, '500g': 114000 });
    expect(product.size).toEqual(['1000g', '200g', '500g']);
  });
});
