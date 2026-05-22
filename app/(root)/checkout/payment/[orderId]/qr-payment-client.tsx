"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";
import { useCart } from "@/lib/hooks/useCart";
import { RefreshCw, Loader2, Download } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
  total: number;
  qrString: string; // raw EMVCO QRIS string
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

function CountdownRing({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);
  const color =
    secondsLeft > 60 ? "#86efac" : secondsLeft > 20 ? "#fde047" : "#f87171";
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="64" height="64" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
        />
      </svg>
      <span className="text-xs font-mono font-semibold tabular-nums" style={{ color }}>
        {mm}:{ss}
      </span>
    </div>
  );
}

export default function QrPaymentClient({
  orderId,
  orderNumber,
  total,
  qrString: initialQrString,
  qrExpiresAt: initialQrExpiresAt,
}: Props) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [qrString, setQrString] = useState(initialQrString);
  const [qrExpiresAt, setQrExpiresAt] = useState(initialQrExpiresAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2; // retina scale for crisp image
      canvas.height = img.height * 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const a = document.createElement("a");
      a.download = `qris-${orderNumber}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }, [orderNumber]);

  const handleSimulate = useCallback(async () => {
    setIsSimulating(true);
    setSimulateError(null);
    try {
      const res = await fetch("/api/dev/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSimulateError(data.error ?? "Gagal simulate pembayaran");
      }
      // On success, the polling loop detects payment_status "paid" and redirects
    } catch {
      setSimulateError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSimulating(false);
    }
  }, [orderId]);
  const [totalSeconds, setTotalSeconds] = useState(() =>
    Math.max(1, Math.floor((new Date(initialQrExpiresAt).getTime() - Date.now()) / 1000))
  );
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const secondsLeft = useCountdown(qrExpiresAt);
  const isExpired = secondsLeft === 0;

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
      setQrString(data.qrString ?? "");
      setQrExpiresAt(data.qrExpiresAt);
      setTotalSeconds(
        Math.max(1, Math.floor((new Date(data.qrExpiresAt).getTime() - Date.now()) / 1000))
      );
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

          {/* Payment steps */}
          <div className="grid grid-cols-3 gap-2 my-4">
            {[
              { n: "1", text: "Buka aplikasi bank atau e-wallet" },
              { n: "2", text: "Scan QR code ini" },
              { n: "3", text: "Konfirmasi pembayaran" },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 text-white/60 text-[10px] font-bold flex items-center justify-center">
                  {step.n}
                </div>
                <p className="text-[10px] text-[#CCC4A9]/40 leading-tight">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
            {qrString ? (
              <div ref={qrRef} className={`relative transition-opacity duration-300 ${isExpired ? "opacity-30" : "opacity-100"}`}>
                <QRCode value={qrString} size={224} />
                {isExpired && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="text-sm font-medium text-gray-600">QR Kedaluwarsa</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
              </div>
            )}

            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>

            {!isExpired && (
              <CountdownRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
            )}

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || secondsLeft >= 30}
              variant="outline"
              className={`w-full transition-opacity duration-300 ${
                secondsLeft >= 30 ? "opacity-30" : "opacity-100"
              }`}
            >
              {isRefreshing ? (
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isRefreshing ? "Memperbarui..." : "Perbarui QR"}
            </Button>

            {refreshError && (
              <p className="text-destructive text-sm text-center">{refreshError}</p>
            )}

            <p className="text-xs text-secondary text-center">
              Mendukung QRIS — GoPay, OVO, Dana, dan semua bank
            </p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="text-xs px-3 py-1.5 rounded border border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-colors"
              >
                {isSimulating ? "Simulating..." : "[DEV] Simulate Payment"}
              </button>
              {simulateError && (
                <p className="text-xs text-destructive">{simulateError}</p>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <div className="flex flex-col items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1.2s" }}
                  />
                ))}
              </div>
              <p className="text-xs text-secondary">Menunggu konfirmasi pembayaran...</p>
            </div>
            <Link href="/checkout" className="text-sm text-secondary underline-offset-4 hover:underline">
              Batalkan dan kembali ke checkout
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
