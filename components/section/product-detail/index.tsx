"use client";
import EmblaCarousel from "@/components/carousel";
import { Footer } from "@/components/ui/footer";
import { EmblaOptionsType } from "embla-carousel";
import { Fragment, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useStore } from "@nanostores/react";
import { $productDetailStore, selectProductBySlug } from "@/lib/stores/product";
import { numberToIdr } from "@/lib/numberToIdr";
import Navigation from "@/components/navigation";
import { FloatingCheckoutButton } from "@/components/mobile-checkout-form";
import PurchaseDialog from "@/components/purchase-dialog";

const ProductDetailPage = ({ slug }: { slug: string }) => {
  const OPTIONS: EmblaOptionsType = {};

  useEffect(() => {
    selectProductBySlug(slug);
  }, [slug]);

  const product = useStore($productDetailStore);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedGrind, setSelectedGrind] = useState<string>("");
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.size?.[0] ?? "");
    setSelectedGrind(product.grindSize?.[0] ?? "");
    setQty(0);
  }, [product?.slug]);

  if (!product) {
    return (
      <main className="pt-20 px-6 text-primary min-h-svh w-full flex flex-col items-center justify-center">
        Produk tidak ditemukan.
      </main>
    );
  }

  const unitPrice =
    product.priceBySize?.[selectedSize] ??
    product.priceBySize?.[product.size?.[0] ?? ""] ??
    product.price ??
    0;

  const titleLine = `${product.title} | Kopi ${product.coffeType?.[0] ?? ""} - ${selectedSize || product.size?.[0] || ""}, ${selectedGrind || product.grindSize?.[0] || ""}`;
  const subtotal = unitPrice * qty;

  return (
    <Fragment>
      <Navigation />
      <main className="pt-20 mx-auto desktop:pt-32 w-full desktop:px-20 relative desktop:flex desktop:flex-row min-h-screen">
        <EmblaCarousel
          images={product.images}
          options={OPTIONS}
          fallbackAlt={product.title}
        />

        <section className="flex-1">
          <div className="px-6 mb-10 flex desktop:flex-col flex-col-reverse gap-1 mt-2">
            <h1 className="text-primary tablet:text-lg desktop:text-2xl tracking-widest font-normal uppercase">
              {titleLine}
            </h1>
            <div className="desktop:text-2xl font-extrabold tablet:text-lg text-secondary mb-2">
              {numberToIdr({ nominal: unitPrice })}
            </div>
          </div>

          {/* Pilih ukuran */}
          <div className="px-6 mb-3">
            <div className="text-base font-bold text-secondary">
              Pilih ukuran :
            </div>
            <div className="inline-flex gap-2 items-center mt-2">
              {product.size?.map((sz) => {
                const active = selectedSize === sz;
                return (
                  <Badge
                    key={sz}
                    variant={active ? "active" : "outline"}
                    onClick={() => setSelectedSize(sz)}
                    className="cursor-pointer select-none"
                    aria-pressed={active}
                    role="button"
                  >
                    {sz}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Pilih grind level */}
          <div className="px-6 mb-3">
            <div className="text-base font-bold text-secondary">
              Pilih grind level :
            </div>
            <div className="inline-flex gap-2 items-center mt-2">
              {product.grindSize?.map((gl) => {
                const active = selectedGrind === gl;
                return (
                  <Badge
                    key={gl}
                    variant={active ? "active" : "outline"}
                    onClick={() => setSelectedGrind(gl)}
                    className="cursor-pointer select-none"
                    aria-pressed={active}
                    role="button"
                  >
                    {gl}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Kategori */}
          <div className="px-6 mb-3">
            <div className="text-base font-normal text-secondary mb-2">
              Kategori :
            </div>
            <label className="text-primary underline underline-offset-3 text-base font-thin">
              {Array.isArray(product.category)
                ? product.category.map((c) => c.category_name).join(", ")
                : "Full Arabika"}
            </label>
          </div>

          {/* Deskripsi */}
          <div className="px-6 pb-10">
            <div className="text-base font-bold text-primary mb-2">
              Deskripsi :
            </div>

            <div
              className="text-secondary text-base tracking-wide"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </section>

        {/* Sidebar */}
        <div className="bg-[#242424] p-4 h-fit rounded-xl space-y-5 w-72 desktop:block hidden">
          <div className="text-secondary text-base font-bold">Atur jumlah</div>
          <div className="text-secondary text-sm">
            {selectedSize || product.size?.[0]},{" "}
            {selectedGrind || product.grindSize?.[0]}
          </div>
          <div className="inline-flex items-center gap-4">
            <button
              className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(0, q - 1))}
              disabled={qty === 0}
              aria-label="Kurangi jumlah"
            >
              <Minus />
            </button>
            <div className="font-semibold text-secondary text-base min-w-8 text-center">
              {qty}
            </div>
            <button
              className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Tambah jumlah"
            >
              <Plus />
            </button>
          </div>

          <div className="inline-flex items-center justify-between w-full">
            <div className="text-sm text-primary font-normal">Subtotal</div>
            <div className="text-sm text-primary font-normal">
              {numberToIdr({ nominal: subtotal })}
            </div>
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

          <PurchaseDialog
            slug={product.slug}
            size={selectedSize || product.size?.[0] || ""}
            grind={selectedGrind || product.grindSize?.[0] || ""}
            qty={qty}
            onQtyChange={setQty}
          />
        </div>

        {/* Mobile floating checkout (passes dynamic pricing + options) */}
        <FloatingCheckoutButton
          slug={product.slug}
          selectedSize={selectedSize}
          selectedGrind={selectedGrind}
          qty={qty}
          imageSrc={product.images?.[0]?.image}
          unitPrice={unitPrice}
          priceBySize={product.priceBySize}
          sizeOptions={product.size}
          grindOptions={product.grindSize}
          variantText={`${selectedSize}, ${selectedGrind}`}
          productSlug={product?.slug}
        />
      </main>
      <Footer />
    </Fragment>
  );
};

export default ProductDetailPage;
