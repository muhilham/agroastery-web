import { loadProducts, slugify } from '@/lib/catalog';
import { CATEGORY_BY_ID } from '../category';

const PRODUCT_LIST = loadProducts(CATEGORY_BY_ID);

export { PRODUCT_LIST, slugify };
