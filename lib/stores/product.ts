import { PRODUCT_LIST } from "@/constant/product/product-list";
import { atom, computed } from "nanostores";
import { $selectedCategoryId } from "./category";

const PRODUCT_BY_SLUG = Object.fromEntries(
  PRODUCT_LIST.map((p) => [p.slug, p] as const),
);

export const $selectedProductSlug = atom<string | null>(null);

export const $productDetailStore = computed($selectedProductSlug, (slug) => {
  if (!slug) return null;
  return PRODUCT_BY_SLUG[slug] ?? null;
});

export const $filteredProducts = computed($selectedCategoryId, (catId) => {
  if (!catId) return PRODUCT_LIST;
  return PRODUCT_LIST.filter((p) =>
    p.category?.some((c) => c.category_id === catId),
  );
});

export const selectProductBySlug = (slug: string) => {
  $selectedProductSlug.set(slug);
};

export const clearSelectedProduct = () => {
  $selectedProductSlug.set(null);
};
