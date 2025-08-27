import { atom, computed } from "nanostores";
import { PRODUCT_LIST } from "@/constant/product/product-list";
import { $selectedCategoryId } from "@/lib/stores/category";
import type { TProduct } from "@/types/product";

export const $searchQuery = atom<string>("");

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .trim();

function productMatchesQuery(p: TProduct, qNorm: string): boolean {
  const bits: string[] = [
    p.title,
    p.description,
    ...(p.size ?? []),
    ...(p.grindSize ?? []),
    ...(p.coffeType ?? []),
    ...(Array.isArray(p.category)
      ? p.category.map((c) => c.category_name)
      : []),
  ];
  return normalize(bits.join(" ")).includes(qNorm);
}

function productMatchesCategory(p: TProduct, catId: string | null): boolean {
  if (!catId) return true;
  return Array.isArray(p.category)
    ? p.category.some((c) => c.category_id === catId)
    : true;
}

export const $searchResults = computed(
  [$searchQuery, $selectedCategoryId],
  (q, catId) => {
    const qNorm = normalize(q);
    if (!qNorm) return [];
    return PRODUCT_LIST.filter((p) => productMatchesCategory(p, catId))
      .filter((p) => productMatchesQuery(p, qNorm))
      .slice(0, 25);
  },
);

export const setSearchQuery = (q: string) => $searchQuery.set(q ?? "");
export const clearSearch = () => $searchQuery.set("");
