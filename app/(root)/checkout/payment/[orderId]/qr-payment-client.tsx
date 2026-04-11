"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";
import { useCart } from "@/lib/hooks/useCart";
import { RefreshCw, Loader2 } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
  total: number;
  qrUrl: string;
  qrExpiresAt: string; // ISO 8601
}

function useCountdown(expiresAtIso: string) {
  const getSecondsLeft = () =>
    Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000));

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);

  useEffect(() => {
    const id = setInterval(() => {
      const s = getSecondsLeft();
      setSecondsLeft(s);
      if (s === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAtIso]);

  return secondsLeft;
}

export default function QrPaymentClient({
  orderId,
  orderNumber,
  total,
  qrUrl: initialQrUrl,
  qrExpiresAt: initialQrExpiresAt,
}: Props) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [qrUrl, setQrUrl] = useState(initialQrUrl);
  const [qrExpiresAt, setQrExpiresAt] = useState(initialQrExpiresAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const secondsLeft = useCountdown(qrExpiresAt);
  const isExpired = secondsLeft === 0;

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Poll order status every 3 seconds
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const { payment_status } = await res.json();
        if (payment_status === "paid") {
          clearInterval(pollingRef.current!);
          clearCart();
          router.push(`/checkout/success?order=${orderId}`);
        } else if (payment_status === "expired" || payment_status === "cancelled") {
          clearInterval(pollingRef.current!);
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, clearCart, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/checkout/refresh-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefreshError(data.error ?? "Gagal memperbarui QR");
        return;
      }
      setQrUrl(data.qrUrl);
      setQrExpiresAt(data.qrExpiresAt);
    } catch {
      setRefreshError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsRefreshing(false);
    }
  }, [orderId]);

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-primary mb-1">Scan QR untuk Membayar</h1>
            <p className="text-secondary text-sm">
              Pesanan #{orderNumber} &middot; {numberToIdr({ nominal: total })}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            {qrUrl ? (
              <div className="relative w-56 h-56">
                <Image
                  src={qrUrl}
                  alt="QRIS payment code"
                  fill
                  className={`object-contain ${isExpired ? "opacity-30" : ""}`}
                  unoptimized // external URL from Pivot
                />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">QR Kedaluwarsa</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
              </div>
            )}

            {!isExpired && (
              <p className="text-sm text-secondary">
                Berlaku {formatCountdown(secondsLeft)}
              </p>
            )}

            {(isExpired || secondsLeft < 30) && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="w-full"
              >
                {isRefreshing ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isRefreshing ? "Memperbarui..." : "Perbarui QR"}
              </Button>
            )}

            {refreshError && (
              <p className="text-destructive text-sm text-center">{refreshError}</p>
            )}

            <p className="text-xs text-secondary text-center">
              Gunakan aplikasi perbankan atau dompet digital yang mendukung QRIS
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-secondary mb-3">
              Menunggu konfirmasi pembayaran...
            </p>
            <Link href="/checkout" className="text-sm text-secondary underline-offset-4 hover:underline">
              Batalkan dan kembali ke checkout
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
