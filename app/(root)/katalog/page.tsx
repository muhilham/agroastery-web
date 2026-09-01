import Categories from "@/components/categories";
import Navigation from "@/components/navigation";
import ProductGrid from "@/components/product-grid";
import { Aside } from "@/components/ui/aside";
import { Footer } from "@/components/ui/footer";
import { getProducts, deriveCategoriesFromProducts } from "@/lib/supabase/queries/products";
import SearchBar from "./SearchBar";
import Filters from "./Filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katalog | Agroastery",
  description: "Jelajahi koleksi kopi spesialti pilihan — biji kopi terbaik dari seluruh Indonesia",
};

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
}) {
  const params = await searchParams;
  const category = params.category ? decodeURIComponent(params.category) : undefined;
  const search = params.search ? params.search.toLowerCase() : undefined;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const inStock = params.inStock === "true";

  const allProducts = await getProducts();
  const categories = deriveCategoriesFromProducts(allProducts);

  let filtered = allProducts;
  if (category) {
    filtered = filtered.filter((p) => p.category_ids.includes(category));
  }
  if (search) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(search) ||
      (p.description ?? "").toLowerCase().includes(search) ||
      (p.short_description ?? "").toLowerCase().includes(search)
    );
  }
  if (minPrice !== undefined && !isNaN(minPrice)) {
    filtered = filtered.filter((p) =>
      p.product_variants.some(
        (v) => v.is_active && (v.discounted_price ?? v.price) >= minPrice
      )
    );
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    filtered = filtered.filter((p) =>
      p.product_variants.some(
        (v) => v.is_active && (v.discounted_price ?? v.price) <= maxPrice
      )
    );
  }
  if (inStock) {
    filtered = filtered.filter((p) =>
      p.product_variants.some((v) => v.is_active && v.stock_quantity > 0)
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 tablet:px-10 desktop:px-20">
        <Categories categories={categories} activeCategoryId={category ?? null} />
        <div className="flex justify-between w-full">
          <Aside categories={categories} activeCategoryId={category ?? null} />
          <div className="flex-1 min-w-0">
            <div className="px-6 pb-4 space-y-3">
              <SearchBar />
              <Filters />
            </div>
            <ProductGrid supabaseProducts={filtered} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
