"use client";
import EmblaCarousel from "@/components/carousel";
import { Footer } from "@/components/ui/footer";
import Navigation from "@/components/ui/navigation";
import { EmblaOptionsType } from "embla-carousel";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { FloatingButton } from "@/components/ui/floating-button";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useStore } from "@nanostores/react";
import { $productDetailStore } from "@/lib/stores/product";
import { numberToIdr } from "@/lib/numberToIdr";
export default function Page() {
  const OPTIONS: EmblaOptionsType = {};
  const SLIDE_COUNT = 4;
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys());
  const productsDetail = useStore($productDetailStore);

  return (
    <Fragment>
      <Navigation />
      <main className="pt-20 mx-auto desktop:pt-32 w-full desktop:px-20 relative desktop:flex desktop:flex-row min-h-screen">
        <EmblaCarousel slides={SLIDES} options={OPTIONS} />
        <section className="flex-1">
          <div className="px-6 mb-10 flex desktop:flex-col flex-col-reverse gap-1 mt-2">
            <h1 className="text-primary tablet:text-lg desktop:text-2xl tracking-widest font-normal uppercase">
              {productsDetail.title} | KOPI ARABIKA | FRESHROASTED - 100G, BEANS
            </h1>
            <div className="desktop:text-2xl font-extrabold tablet:text-lg text-secondary mb-2">
              {numberToIdr({ nominal: productsDetail.price })}
            </div>
          </div>
          <div className="px-6 mb-3">
            <div className="text-base font-bold text-secondary">
              Pilih ukuran :
            </div>
            <div className="inline-flex  gap-2 items-center mt-2">
              <Badge variant="active">100g</Badge>
              <Badge variant="outline">100g</Badge>
              <Badge variant="outline">100g</Badge>
            </div>
          </div>
          <div className="px-6 mb-3">
            <div className="text-base font-bold text-secondary">
              Pilih grind level :
            </div>
            <div className="inline-flex gap-2 items-center mt-2">
              <Badge variant="outline">Beans</Badge>
              <Badge variant="outline">Grind Fine</Badge>
              <Badge variant="outline">Grind Medium</Badge>
            </div>
          </div>
          <div className="px-6 mb-3">
            <div className="text-base font-normal text-secondary mb-2">
              Kategori :
            </div>
            <label className="text-primary underline underline-offset-3 text-base font-thin">
              Full Arabika
            </label>
          </div>
          <div className="px-6 pb-10">
            <div className="text-base font-bold text-primary mb-2">
              Deskripsi :
            </div>
            <p className="text-secondary text-base tracking-wide">
              STANDARD GAYOCrafting The Finest Standard CoffeeOriginWih Ilang,
              AcehProcessSemi-Washed
            </p>
          </div>
        </section>
        <div className="bg-[#242424] p-4 h-fit rounded-xl space-y-5 w-72 desktop:block hidden">
          <div className="text-secondary text-base font-bold">Atur jumlah</div>
          <div className="text-secondary text-sm">1kg, Beans</div>
          <div className="inline-flex items-center gap-4">
            <button className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold">
              <Minus />
            </button>
            <div className="font-semibold text-secondary text-base">100</div>
            <button className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold">
              <Plus />
            </button>
          </div>
          <div className="inline-flex items-center justify-between w-full">
            <div className="text-sm text-primary font-normal">Subtotal</div>
            <div className="text-sm text-primary font-normal">Rp12.000.000</div>
          </div>
          <div className="inline-flex items-center w-full gap-4">
            <Button variant="outline" size="icon" className="w-full h-10 px-4">
              <Image
                src="/assets/tokopedia.svg"
                width={24}
                height={24}
                alt="tokopedia"
              />
            </Button>
            <Button variant="outline" size="icon" className="w-full h-10 px-4">
              <Image
                src="/assets/shoppe.svg"
                width={24}
                height={24}
                alt="tokopedia"
              />
            </Button>
          </div>
          <Button>Beli Langsung</Button>
        </div>
        <FloatingButton />
      </main>
      <Footer />
    </Fragment>
  );
}
