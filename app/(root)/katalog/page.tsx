import Categories from "@/components/categories";
import Navigation from "@/components/navigation";
import ProductGrid from "@/components/product-grid";
import { Aside } from "@/components/ui/aside";
import { Footer } from "@/components/ui/footer";

export default function Page() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 tablet:px-10 desktop:px-20">
        <Categories />
        <div className="flex justify-between w-full">
          <Aside />
          <ProductGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
}
