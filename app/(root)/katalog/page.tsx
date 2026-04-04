import Categories from "@/components/categories";
import Navigation from "@/components/navigation";
import ProductGrid from "@/components/product-grid";
import { Aside } from "@/components/ui/aside";
import { Footer } from "@/components/ui/footer";
import { getProducts, deriveCategoriesFromProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const allProducts = await getProducts();
  const categories = deriveCategoriesFromProducts(allProducts);
  const filteredProducts = category
    ? allProducts.filter((p) => p.category_ids.includes(category))
    : allProducts;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 tablet:px-10 desktop:px-20">
        <Categories categories={categories} activeCategoryId={category ?? null} />
        <div className="flex justify-between w-full">
          <Aside categories={categories} activeCategoryId={category ?? null} />
          <ProductGrid supabaseProducts={filteredProducts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
