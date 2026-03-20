"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle, Clock } from "lucide-react";
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
        <div className="max-w-md w-full text-center py-16">
          {isPending ? (
            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          ) : (
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          )}

          <h1 className="text-2xl font-semibold text-primary mb-3">
            {isPending ? "Menunggu Pembayaran" : "Pesanan Berhasil!"}
          </h1>

          <p className="text-secondary mb-8">
            {isPending
              ? "Pembayaran kamu sedang diproses. Kami akan mengirim konfirmasi setelah pembayaran diterima."
              : "Terima kasih! Pesananmu telah diterima dan akan segera diproses."}
          </p>

          <div className="space-y-3">
            {orderId && (
              <Link href={`/orders/${orderId}`}>
                <Button className="w-full" variant="outline">
                  Lihat Detail Pesanan
                </Button>
              </Link>
            )}
            <Link href="/katalog">
              <Button className="w-full">
                Lanjut Belanja
              </Button>
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
