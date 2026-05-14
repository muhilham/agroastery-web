import { ProductCard } from "@/components/ui/product-card";
import { getMinPrice, getMinOriginalPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import { stripHtml } from "@/lib/utils";
import type { SupabaseProduct } from "@/types/product";

interface ProductGridProps {
  supabaseProducts: SupabaseProduct[];
}

export default function ProductGrid({ supabaseProducts }: ProductGridProps) {
  return (
    <div className="px-6 pb-6 grid gap-4 grid-cols-2 tablet:grid-cols-3 tablet:pl-6 tablet:pr-0 desktop:pr-0 desktop:pl-6 desktop:grid-cols-4">
      {supabaseProducts.length === 0 ? (
        <div className="col-span-full text-secondary text-center py-12">
          Produk tidak ditemukan
        </div>
      ) : (
        supabaseProducts.map((item) => {
          const minPrice = getMinPrice(item.product_variants);
          const minOriginalPrice = getMinOriginalPrice(item.product_variants);
          return (
            <ProductCard
              key={item.slug}
              productSlug={item.slug}
              productTitle={item.name}
              productDescription={stripHtml(item.short_description ?? item.description ?? "")}
              productImage={getProductImageUrl(item)}
              productPrice={minPrice}
              originalPrice={minOriginalPrice > minPrice ? minOriginalPrice : undefined}
            />
          );
        })
      )}
    </div>
  );
}
