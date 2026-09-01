"use client";
import EmblaCarousel from "@/components/carousel";
import { Footer } from "@/components/ui/footer";
import { EmblaOptionsType } from "embla-carousel";
import { Fragment, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { numberToIdr } from "@/lib/numberToIdr";
import { trackViewItem } from "@/lib/analytics/gtag";
import Navigation from "@/components/navigation";
import { useRouter } from "next/navigation";

import type { SupabaseProduct, SupabaseProductVariant } from "@/types/product";
import { findMatchingVariant, getMinPrice, getMinOriginalPrice, getProductImageUrl, getVariantImageUrl } from "@/lib/supabase/queries/productUtils";
import { useCart } from "@/lib/hooks/useCart";

type Props = {
  product: SupabaseProduct;
};

const SupabaseProductDetail = ({ product }: Props) => {
  const router = useRouter();
  const OPTIONS: EmblaOptionsType = {};
  const { addToCart } = useCart();
  const phone = (process.env.NEXT_PUBLIC_AGROASTERY_WA_NUMBER ?? "+628979092726").replace(/^\+/, "");

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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

  const unitPrice = matchedVariant
    ? (matchedVariant.discounted_price ?? matchedVariant.price)
    : getMinPrice(activeVariants);
  const originalPrice = matchedVariant?.price ?? getMinOriginalPrice(activeVariants);
  const hasDiscount = unitPrice < originalPrice;
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

  // Build carousel images — prefer variant-level, fall back to product-level
  const variantImages = matchedVariant?.images ?? [];
  const carouselImages =
    variantImages.length > 0
      ? variantImages.map((img) => ({ image: img.url }))
      : (product.images as { url: string; alt?: string }[] | null)?.length
      ? (product.images as { url: string; alt?: string }[]).map((img) => ({ image: img.url }))
      : product.image_url
      ? [{ image: product.image_url }]
      : [];

  function handleAddToCart() {
    if (!matchedVariant || !inStock || isAddingToCart) return;
    setIsAddingToCart(true);
    const imageUrl = getVariantImageUrl(matchedVariant, product);
    addToCart({
      variantId: matchedVariant.id,
      productSlug: product.slug,
      productName: product.name,
      variantDescription,
      unitPrice: matchedVariant.discounted_price ?? matchedVariant.price,
      originalPrice: matchedVariant.price,
      quantity: qty,
      shipWeightGrams: matchedVariant.ship_weight_grams,
      image: imageUrl,
    });
    setAddedToCart(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => {
      setAddedToCart(false);
      setIsAddingToCart(false);
    }, 2000);
  }

  function handleCheckout() {
    handleAddToCart();
    router.push("/cart");
  }

  const trackedViewItemSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!matchedVariant) return;
    if (trackedViewItemSlugRef.current === product.slug) return;
    trackedViewItemSlugRef.current = product.slug;
    trackViewItem({
      itemId: matchedVariant.id,
      itemName: product.name,
      price: matchedVariant.discounted_price ?? matchedVariant.price,
    });
  }, [product.slug, product.name, matchedVariant]);

  return (
    <Fragment>
      <Navigation />
      <main className="pt-20 mx-auto desktop:pt-32 w-full desktop:px-20 relative desktop:flex desktop:flex-row min-h-screen pb-24 desktop:pb-0">
        <EmblaCarousel
          key={matchedVariant?.id ?? product.slug}
          images={carouselImages}
          options={OPTIONS}
          fallbackAlt={product.name}
        />

        <section className="flex-1 min-w-0">
          <div className="px-4 tablet:px-6 mb-8 flex flex-col gap-1 mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg tablet:text-xl desktop:text-2xl font-extrabold text-secondary">
                {numberToIdr({ nominal: unitPrice })}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {numberToIdr({ nominal: originalPrice })}
                </span>
              )}
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
            disabled={!matchedVariant || !inStock || isAddingToCart}
            onClick={handleAddToCart}
            variant="outline"
          >
            {isAddingToCart ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {isAddingToCart ? "Menambahkan..." : addedToCart ? "Ditambahkan!" : "Tambah ke Keranjang"}
          </Button>

          {/* Buy Now button */}
          <Button
            className="w-full"
            disabled={!matchedVariant || !inStock || isAddingToCart}
            onClick={handleCheckout}
          >
            {isAddingToCart ? "Menambahkan..." : "Beli Sekarang"}
          </Button>

          {/* WhatsApp inquiry link */}
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(`Halo Agroastery, saya mau tanya tentang ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-[#25D366] hover:text-green-400 transition-colors mt-2"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Tanya via WhatsApp
          </a>
        </div>

        {/* Mobile floating bar */}
        <div className="fixed bottom-0 w-full left-0 desktop:hidden bg-black/95 backdrop-blur-sm flex gap-2 z-40 px-4 pb-safe-bottom items-center py-3 border-t border-white/10"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <Button
            className="flex-1 h-11 flex items-center gap-1.5 text-sm"
            disabled={!matchedVariant || !inStock || isAddingToCart}
            onClick={handleAddToCart}
            variant="outline"
          >
            {isAddingToCart ? (
              <LoaderCircle className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">
              {isAddingToCart ? "Menambahkan..." : addedToCart ? "Ditambahkan!" : "Keranjang"}
            </span>
          </Button>
          <Button
            className="flex-1 h-11 text-sm"
            disabled={!matchedVariant || !inStock || isAddingToCart}
            onClick={handleCheckout}
          >
            {isAddingToCart ? "Menambahkan..." : "Beli"}
          </Button>
        </div>
      </main>
      <Footer />
    </Fragment>
  );
};

export default SupabaseProductDetail;
