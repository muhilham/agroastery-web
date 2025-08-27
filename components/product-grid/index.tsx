"use client";
import { useStore } from "@nanostores/react";
import { $filteredProducts } from "@/lib/stores/product";
import { ProductCard } from "@/components/ui/product-card";

export default function ProductGrid() {
  const products = useStore($filteredProducts);

  return (
    <div className="px-6 pb-6 grid gap-4 grid-cols-2 tablet:grid-cols-3 tablet:pl-6 tablet:pr-0 desktop:pr-0 desktop:pl-6 desktop:grid-cols-4">
      {products.length === 0 ? (
        <div className="col-span-full text-secondary text-center py-12">
          Produk tidak ditemukan
        </div>
      ) : (
        products.map((item) => (
          <ProductCard
            key={item.slug}
            productSlug={item.slug}
            productTitle={item.title}
            productDescription={item.description}
            productImage={item.images?.[0]?.image ?? "/assets/placeholder.png"}
            productPrice={item.price}
          />
        ))
      )}
    </div>
  );
}
