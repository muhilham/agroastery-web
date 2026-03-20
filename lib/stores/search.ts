import { atom, computed } from "nanostores";
import type { SupabaseProduct } from "@/types/product";
import { getProductImageUrl, getMinPrice } from "@/lib/supabase/queries/productUtils";

export const $searchQuery = atom<string>("");

/** Supabase products cache — populated by catalog page or on first search */
export const $supabaseProducts = atom<SupabaseProduct[]>([]);
let fetchPromise: Promise<void> | null = null;

export async function ensureProductsLoaded() {
  if ($supabaseProducts.get().length > 0) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/products")
    .then((res) => (res.ok ? res.json() : { data: [] }))
    .then((json) => {
      $supabaseProducts.set(json.data ?? []);
    })
    .catch(() => {
      // Silently fail — search will show no results
    });

  return fetchPromise;
}

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .trim();

export type SearchResult = {
  slug: string;
  name: string;
  shortDescription: string | null;
  imageUrl: string;
  minPrice: number;
};

export const $searchResults = computed(
  [$searchQuery, $supabaseProducts],
  (q, products): SearchResult[] => {
    const qNorm = normalize(q);
    if (!qNorm) return [];

    return products
      .filter((p) => {
        const bits: string[] = [
          p.name,
          p.description ?? "",
          p.short_description ?? "",
        ];
        return normalize(bits.join(" ")).includes(qNorm);
      })
      .slice(0, 25)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        shortDescription: p.short_description,
        imageUrl: getProductImageUrl(p),
        minPrice: getMinPrice(p.product_variants),
      }));
  },
);

export const setSearchQuery = (q: string) => {
  $searchQuery.set(q ?? "");
  ensureProductsLoaded();
};
export const clearSearch = () => $searchQuery.set("");
