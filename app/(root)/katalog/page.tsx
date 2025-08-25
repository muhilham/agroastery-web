import Categories from "@/components/categories";
import { Aside } from "@/components/ui/aside";
import { Footer } from "@/components/ui/footer";
import Navigation from "@/components/ui/navigation";
import { ProductCard } from "@/components/ui/product-card";

import { Fragment } from "react";
export default function Page() {
  return (
    <Fragment>
      <Navigation />
      <main className="pt-20 tablet:px-10 desktop:px-20">
        <Categories />
        <div className="flex justify-between w-full">
          <Aside />
          <div className="px-6 pb-6 grid gap-4 grid-cols-2 tablet:grid-cols-3 tablet:pl-6 tablet:pr-0 desktop:pr-0 desktop:pl-6  desktop:grid-cols-4">
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="STANDARD GAYO ARABICA KACO BENER DAH PANJANGNYA NAMA INI"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="BLEND KOPI SUSU EKONOMIS"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="Blen Gayo"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="Blen Gayo"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="STANDARD GAYO ARABICA KACO BENER DAH PANJANGNYA NAMA INI"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="BLEND KOPI SUSU EKONOMIS"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="Blen Gayo"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
            <ProductCard
              productDescription="Arabica semi-washed dari 1600 mdpl, ideal"
              productTitle="Blen Gayo"
              productImage="/assets/coffe/blend-gayo.png"
              productPrice={10000}
            />
          </div>
        </div>
      </main>
      <Footer />
    </Fragment>
  );
}
