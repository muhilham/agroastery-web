"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const status = searchParams.get("status");
  const isPending = status === "pending";

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">

          {/* Icon — zoom-in on load */}
          <div className="animate-in zoom-in-50 fade-in duration-500 mb-6">
            {isPending ? (
              <div className="w-20 h-20 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto">
                <svg
                  className="w-9 h-9 text-yellow-400 animate-spin [animation-duration:3s]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <svg
                  className="w-9 h-9 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </div>

          {/* Heading — slide up after icon */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            <h1 className="text-2xl font-semibold text-primary mb-3 tracking-wide">
              {isPending ? "Menunggu Pembayaran" : "Pesanan Diterima!"}
            </h1>
            <p className="text-secondary text-sm leading-relaxed mb-2">
              {isPending
                ? "Pembayaran kamu sedang diproses. Kami akan mengirim konfirmasi setelah pembayaran diterima."
                : "Terima kasih sudah memesan dari Agroastery."}
            </p>
            {!isPending && (
              <p className="text-primary/50 text-xs tracking-widest uppercase mt-3">
                Kopi dalam perjalanan ke tanganmu
              </p>
            )}
          </div>

          {/* Buttons — slide up last */}
          <div
            className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3 mt-8"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            {orderId && (
              <Link href={`/orders/${orderId}`}>
                <Button className="w-full" variant="outline">
                  Lihat Detail Pesanan
                </Button>
              </Link>
            )}
            <Link href="/katalog">
              <Button className="w-full">Lanjut Belanja</Button>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-background" />}>
      <SuccessContent />
    </Suspense>
  );
}
