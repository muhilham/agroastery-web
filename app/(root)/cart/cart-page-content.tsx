"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/hooks/useCart";
import { numberToIdr } from "@/lib/numberToIdr";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { COFFEE_BLUR_DATA_URL } from "@/lib/blurDataUrl";
import { Minus, Plus, Trash2, ShoppingBag, LoaderCircle } from "lucide-react";

function CartImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 64px, 80px"
      placeholder="blur"
      blurDataURL={COFFEE_BLUR_DATA_URL}
      onError={() => setImgSrc("/assets/placeholder.png")}
    />
  );
}

export default function CartPageContent() {
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity } = useCart();
  const [mounted, setMounted] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-svh flex flex-col bg-background">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <LoaderCircle className="animate-spin w-8 h-8 text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-20 pb-24 px-4 tablet:px-10 desktop:px-20 flex-1">
        <h1 className="text-xl tablet:text-2xl font-semibold text-primary mb-6 tracking-widest uppercase mt-4">
          Keranjang
        </h1>

        {cartCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
            <ShoppingBag className="w-14 h-14 text-white/20" />
            <div>
              <p className="text-primary text-base mb-2">Keranjang kamu kosong</p>
              <p className="text-secondary text-sm">Tambahkan produk untuk mulai belanja</p>
            </div>
            <Link href="/katalog">
              <Button className="h-12 px-6">Lihat Produk</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col desktop:flex-row gap-6 desktop:gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3 p-3 tablet:p-4 rounded-xl bg-[#1a1a1a] border border-white/10"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 tablet:w-20 tablet:h-20 shrink-0 rounded-lg overflow-hidden bg-[#2a2a2a]">
                    <CartImage src={item.image} alt={item.productName} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="text-primary font-medium text-sm hover:underline line-clamp-2 leading-snug"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-secondary text-xs mt-0.5 line-clamp-1">
                      {item.variantDescription}
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <p className="text-primary text-sm font-semibold">
                        {numberToIdr({ nominal: item.unitPrice })}
                      </p>
                      {item.originalPrice > item.unitPrice && (
                        <p className="text-xs text-gray-400 line-through">
                          {numberToIdr({ nominal: item.originalPrice })}
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="rounded-full w-8 h-8 flex items-center justify-center border border-white/20 text-primary disabled:opacity-40 active:bg-white/10"
                        onClick={async () => {
                          setUpdatingItems((prev) => new Set(prev).add(item.variantId));
                          updateQuantity(item.variantId, item.quantity - 1);
                          setTimeout(() => {
                            setUpdatingItems((prev) => {
                              const next = new Set(prev);
                              next.delete(item.variantId);
                              return next;
                            });
                          }, 100);
                        }}
                        disabled={item.quantity <= 1 || updatingItems.has(item.variantId)}
                        aria-label="Kurangi"
                      >
                        {updatingItems.has(item.variantId) ? (
                          <LoaderCircle className="animate-spin w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-primary text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="rounded-full w-8 h-8 flex items-center justify-center border border-white/20 text-primary disabled:opacity-40 active:bg-white/10"
                        onClick={async () => {
                          setUpdatingItems((prev) => new Set(prev).add(item.variantId));
                          updateQuantity(item.variantId, item.quantity + 1);
                          setTimeout(() => {
                            setUpdatingItems((prev) => {
                              const next = new Set(prev);
                              next.delete(item.variantId);
                              return next;
                            });
                          }, 100);
                        }}
                        disabled={item.quantity >= 100 || updatingItems.has(item.variantId)}
                        aria-label="Tambah"
                      >
                        {updatingItems.has(item.variantId) ? (
                          <LoaderCircle className="animate-spin w-3 h-3" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-secondary text-xs ml-1 truncate">
                        = {numberToIdr({ nominal: item.unitPrice * item.quantity })}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-white/30 hover:text-red-400 active:text-red-400 transition-colors self-start p-1 -mr-1 -mt-1"
                    aria-label="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary — stacks below on mobile, sidebar on desktop */}
            <div className="desktop:w-80 shrink-0">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 tablet:p-6 desktop:sticky desktop:top-24">
                <h2 className="text-primary font-semibold text-base tablet:text-lg mb-4">
                  Ringkasan Pesanan
                </h2>

                <div className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.variantId} className="flex justify-between text-sm gap-2">
                      <span className="text-secondary line-clamp-1 flex-1">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="text-primary shrink-0">
                        {numberToIdr({ nominal: item.unitPrice * item.quantity })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 mb-5">
                  <div className="flex justify-between">
                    <span className="text-primary font-semibold">Total</span>
                    <span className="text-primary font-semibold">
                      {numberToIdr({ nominal: cartTotal })}
                    </span>
                  </div>
                  <p className="text-secondary text-xs mt-1">
                    Belum termasuk ongkos kirim
                  </p>
                </div>

                <Link href="/checkout">
                  <Button className="w-full h-12 text-base">
                    Lanjut ke Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
