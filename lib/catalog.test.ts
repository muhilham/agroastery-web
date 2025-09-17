import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadCategories, loadRawProducts, adaptProduct, slugify } from './catalog';
import type { TCategory } from '@/types/categories';

// Mock local JSON data
const mockLocalCategories = [{ category_id: 'local-1', category_name: 'Local Category' }];
const mockLocalProducts = [
  {
    title: 'Local Coffee',
    description: 'A local coffee blend.',
    category_ids: ['local-1'],
    images: [{ image: 'https://example.com/local.jpg' }],
    variants: [{ weight: '250g', price: 100000, sku: 'local-sku', quantity: 10 }],
  },
];

vi.mock('@/data/categories.json', () => ({ default: mockLocalCategories }));
vi.mock('@/data/products.json', () => ({ default: mockLocalProducts }));

describe('Hybrid Catalog Loader', () => {
  const mockCdnCategories = [{ category_id: 'cdn-1', category_name: 'CDN Category' }];
  const mockCdnProducts = [
    {
      title: 'CDN Coffee',
      description: 'A CDN coffee blend.',
      category_ids: ['cdn-1'],
      images: [{ image: 'https://example.com/cdn.jpg' }],
      variants: [
        { weight: '200g', price: 80000, sku: 'cdn-sku-1' },
        { weight: '1000g', price: 350000, sku: 'cdn-sku-2', quantity: 50 },
      ],
    },
  ];

  const fetchSpy = vi.spyOn(global, 'fetch');
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('slugify', () => {
    it('should correctly slugify strings', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('  Test with spaces  ')).toBe('test-with-spaces');
    });
  });

  describe('With CATALOG_SOURCE=cdn', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_CATALOG_SOURCE', 'cdn');
    });

    it('should fetch and return categories from CDN if successful', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(mockCdnCategories)));
      const categories = await loadCategories();
      expect(categories).toEqual(mockCdnCategories);
      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3000/api/catalog/categories.json', expect.any(Object));
    });

    it('should fall back to local categories if CDN fetch fails', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 500 }));
      const categories = await loadCategories();
      expect(categories).toEqual(mockLocalCategories);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('CDN fetch failed'));
    });

    it('should fall back to local products if CDN data is invalid', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ invalid: 'data' })));
      const products = await loadRawProducts();
      expect(products).toEqual(mockLocalProducts);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('CDN data validation failed'));
    });
  });

  describe('With CATALOG_SOURCE=local', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_CATALOG_SOURCE', 'local');
    });

    it('should return local categories without fetching from CDN', async () => {
      const categories = await loadCategories();
      expect(categories).toEqual(mockLocalCategories);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return local products without fetching from CDN', async () => {
      const products = await loadRawProducts();
      expect(products).toEqual(mockLocalProducts);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('adaptProduct', () => {
    it('should correctly adapt raw product data to the TProduct shape', () => {
      const rawProduct = mockCdnProducts[0];
      const categoryMap: Record<string, TCategory> = { 'cdn-1': mockCdnCategories[0] };
      const adapted = adaptProduct(rawProduct, categoryMap);

      expect(adapted.slug).toBe('cdn-coffee');
      expect(adapted.size).toEqual(['200g', '1000g']);
      expect(adapted.priceBySize).toEqual({ '200g': 80000, '1000g': 350000 });
      expect(adapted.minPrice).toBe(80000);
      expect(adapted.price).toBe(80000);
      expect(adapted.category).toEqual([mockCdnCategories[0]]);
      expect(adapted.variants[0].quantity).toBe(999); // Default quantity
      expect(adapted.variants[1].quantity).toBe(50); // Provided quantity
    });
  });
});
