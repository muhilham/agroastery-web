"use client";
import { useCart } from "@/lib/hooks/useCart";
import { numberToIdr } from "@/lib/numberToIdr";
import Navigation from "@/components/navigation";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity } = useCart();

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="pt-24 pb-32 px-4 tablet:px-10 desktop:px-20 flex-1">
        <h1 className="text-2xl font-semibold text-primary mb-8 tracking-widest uppercase">
          Keranjang
        </h1>

        {cartCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <ShoppingBag className="w-16 h-16 text-white/20" />
            <div>
              <p className="text-primary text-lg mb-2">Keranjang kamu kosong</p>
              <p className="text-secondary text-sm">Tambahkan produk untuk mulai belanja</p>
            </div>
            <Link href="/katalog">
              <Button>Lihat Produk</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col desktop:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-white/10"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-[#2a2a2a]">
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/placeholder.png";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="text-primary font-medium text-sm hover:underline line-clamp-2"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-secondary text-xs mt-0.5">
                      {item.variantDescription}
                    </p>
                    <p className="text-primary text-sm font-semibold mt-1">
                      {numberToIdr({ nominal: item.unitPrice })}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        className="rounded-full w-7 h-7 flex items-center justify-center border border-white/20 text-primary disabled:opacity-40 hover:border-white/40"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Kurangi"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-primary text-sm font-medium min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        className="rounded-full w-7 h-7 flex items-center justify-center border border-white/20 text-primary hover:border-white/40"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Tambah"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-secondary text-xs ml-2">
                        Subtotal: {numberToIdr({ nominal: item.unitPrice * item.quantity })}
                      </span>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="text-white/30 hover:text-red-400 transition-colors self-start"
                    aria-label="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="desktop:w-80 shrink-0">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 sticky top-24">
                <h2 className="text-primary font-semibold text-lg mb-4">
                  Ringkasan Pesanan
                </h2>

                <div className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.variantId} className="flex justify-between text-sm">
                      <span className="text-secondary line-clamp-1 flex-1 mr-2">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="text-primary shrink-0">
                        {numberToIdr({ nominal: item.unitPrice * item.quantity })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 mb-6">
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
                  <Button className="w-full">
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
