import type { TCategory } from '@/types/categories';
import { loadCategories } from '@/lib/catalog';

export const CATEGORY: TCategory[] = await loadCategories();

export const CATEGORY_BY_ID: Record<string, TCategory> = Object.fromEntries(
  CATEGORY.map((c) => [c.category_id, c])
);
