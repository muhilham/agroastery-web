"use client";
import EmblaCarousel from "@/components/carousel";
import { Footer } from "@/components/ui/footer";
import { EmblaOptionsType } from "embla-carousel";
import { Fragment, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { numberToIdr } from "@/lib/numberToIdr";
import Navigation from "@/components/navigation";
import { useRouter } from "next/navigation";

import type { SupabaseProduct, SupabaseProductVariant } from "@/types/product";
import { findMatchingVariant, getMinPrice, getProductImageUrl } from "@/lib/supabase/queries/productUtils";
import { useCart } from "@/lib/hooks/useCart";

type Props = {
  product: SupabaseProduct;
};

const SupabaseProductDetail = ({ product }: Props) => {
  const router = useRouter();
  const OPTIONS: EmblaOptionsType = {};
  const { addToCart } = useCart();

  // Sort options by display_order
  const sortedOptions = [...product.product_options].sort(
    (a, b) => a.display_order - b.display_order
  );

  // State: selected option value per option axis { [optionId]: optionValueId }
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const opt of sortedOptions) {
      const sortedValues = [...opt.product_option_values].sort(
        (a, b) => a.display_order - b.display_order
      );
      if (sortedValues.length > 0) {
        initial[opt.id] = sortedValues[0].id;
      }
    }
    return initial;
  });

  const [qty, setQty] = useState<number>(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear addedToCart timer on unmount
  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  // Reset on product change
  useEffect(() => {
    window.scrollTo(0, 0);
    const initial: Record<string, string> = {};
    for (const opt of sortedOptions) {
      const sortedValues = [...opt.product_option_values].sort(
        (a, b) => a.display_order - b.display_order
      );
      if (sortedValues.length > 0) {
        initial[opt.id] = sortedValues[0].id;
      }
    }
    setSelectedValues(initial);
    setQty(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  // Find the currently selected variant
  const selectedOptionValueIds = Object.values(selectedValues);
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const matchedVariant: SupabaseProductVariant | null =
    sortedOptions.length > 0
      ? findMatchingVariant(activeVariants, selectedOptionValueIds)
      : activeVariants[0] ?? null;

  const unitPrice = matchedVariant?.price ?? getMinPrice(activeVariants);
  const inStock = matchedVariant ? matchedVariant.stock_quantity > 0 : false;
  const subtotal = unitPrice * qty;

  // Build variant description string
  const variantDescription = sortedOptions
    .map((opt) => {
      const valId = selectedValues[opt.id];
      const val = opt.product_option_values.find((v) => v.id === valId);
      return val?.value ?? "";
    })
    .filter(Boolean)
    .join(", ");

  const images = (product.images as { url: string; alt?: string }[] | null) ?? [];
  const carouselImages =
    images.length > 0
      ? images.map((img) => ({ image: img.url }))
      : product.image_url
      ? [{ image: product.image_url }]
      : [];

  function handleAddToCart() {
    if (!matchedVariant || !inStock) return;
    const imageUrl = getProductImageUrl(product);
    addToCart({
      variantId: matchedVariant.id,
      productSlug: product.slug,
      productName: product.name,
      variantDescription,
      unitPrice: matchedVariant.price,
      quantity: qty,
      shipWeightGrams: matchedVariant.ship_weight_grams,
      image: imageUrl,
    });
    setAddedToCart(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleCheckout() {
    handleAddToCart();
    router.push("/cart");
  }

  return (
    <Fragment>
      <Navigation />
      <main className="pt-20 mx-auto desktop:pt-32 w-full desktop:px-20 relative desktop:flex desktop:flex-row min-h-screen pb-24 desktop:pb-0">
        <EmblaCarousel
          images={carouselImages}
          options={OPTIONS}
          fallbackAlt={product.name}
        />

        <section className="flex-1">
          <div className="px-4 tablet:px-6 mb-8 flex flex-col gap-1 mt-2">
            <div className="text-lg tablet:text-xl desktop:text-2xl font-extrabold text-secondary">
              {numberToIdr({ nominal: unitPrice })}
            </div>
            <h1 className="text-primary text-sm tablet:text-base desktop:text-2xl tracking-widest font-normal uppercase leading-snug">
              {product.name}
              {variantDescription ? ` | ${variantDescription}` : ""}
            </h1>
          </div>

          {/* Option selectors */}
          {sortedOptions.map((opt) => {
            const sortedValues = [...opt.product_option_values].sort(
              (a, b) => a.display_order - b.display_order
            );
            return (
              <div key={opt.id} className="px-4 tablet:px-6 mb-4">
                <div className="text-sm tablet:text-base font-bold text-secondary">
                  Pilih {opt.name} :
                </div>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  {sortedValues.map((val) => {
                    const active = selectedValues[opt.id] === val.id;
                    return (
                      <Badge
                        key={val.id}
                        variant={active ? "active" : "outline"}
                        onClick={() =>
                          setSelectedValues((prev) => ({
                            ...prev,
                            [opt.id]: val.id,
                          }))
                        }
                        className="cursor-pointer select-none"
                        aria-pressed={active}
                        role="button"
                      >
                        {val.value}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Stock status */}
          {matchedVariant && (
            <div className="px-4 tablet:px-6 mb-3">
              <span
                className={`text-sm ${
                  inStock ? "text-green-400" : "text-red-400"
                }`}
              >
                {inStock ? "Stok tersedia" : "Stok habis"}
              </span>
            </div>
          )}
          {!matchedVariant && sortedOptions.length > 0 && (
            <div className="px-4 tablet:px-6 mb-3">
              <span className="text-sm text-red-400">
                Kombinasi varian tidak tersedia
              </span>
            </div>
          )}

          {/* Deskripsi */}
          <div className="px-4 tablet:px-6 pb-10">
            <div className="text-base font-bold text-primary mb-2">
              Deskripsi :
            </div>
            <div
              className="rich-text text-secondary text-base tracking-wide"
              dangerouslySetInnerHTML={{ __html: product.description ?? "" }}
            />
          </div>
        </section>

        {/* Desktop Sidebar */}
        <div className="bg-[#242424] p-4 h-fit rounded-xl space-y-5 w-72 desktop:block hidden">
          <div className="text-secondary text-base font-bold">Atur jumlah</div>
          {variantDescription && (
            <div className="text-secondary text-sm">{variantDescription}</div>
          )}
          <div className="inline-flex items-center gap-4">
            <button
              className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold disabled:opacity-40"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Kurangi jumlah"
            >
              <Minus />
            </button>
            <div className="font-semibold text-secondary text-base min-w-8 text-center">
              {qty}
            </div>
            <button
              className="rounded-full p-1 flex flex-col items-center border border-primary w-8 h-8 text-secondary font-extrabold disabled:opacity-40"
              onClick={() => setQty((q) => q + 1)}
              disabled={matchedVariant ? qty >= matchedVariant.stock_quantity : false}
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

          {/* Add to Cart button */}
          <Button
            className="w-full flex items-center gap-2"
            disabled={!matchedVariant || !inStock}
            onClick={handleAddToCart}
            variant="outline"
          >
            <ShoppingCart className="w-4 h-4" />
            {addedToCart ? "Ditambahkan!" : "Tambah ke Keranjang"}
          </Button>

          {/* Buy Now button */}
          <Button
            className="w-full"
            disabled={!matchedVariant || !inStock}
            onClick={handleCheckout}
          >
            Beli Sekarang
          </Button>
        </div>

        {/* Mobile floating bar */}
        <div className="fixed bottom-0 w-full left-0 desktop:hidden bg-black/95 backdrop-blur-sm flex gap-2 z-40 px-4 pb-safe-bottom items-center py-3 border-t border-white/10"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <Button
            className="flex-1 h-11 flex items-center gap-1.5 text-sm"
            disabled={!matchedVariant || !inStock}
            onClick={handleAddToCart}
            variant="outline"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">{addedToCart ? "Ditambahkan!" : "Keranjang"}</span>
          </Button>
          <Button
            className="flex-1 h-11 text-sm"
            disabled={!matchedVariant || !inStock}
            onClick={handleCheckout}
          >
            Beli
          </Button>
        </div>
      </main>
      <Footer />
    </Fragment>
  );
};

export default SupabaseProductDetail;
