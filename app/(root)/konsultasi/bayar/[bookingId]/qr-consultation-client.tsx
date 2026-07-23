"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";

interface Props {
  bookingId: string;
  amount: number;
  qrString: string;
  qrExpiresAt: string;
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

export default function QrConsultationClient({
  bookingId,
  amount,
  qrString: initialQrString,
  qrExpiresAt: initialQrExpiresAt,
}: Props) {
  const router = useRouter();
  const [qrString, setQrString] = useState(initialQrString);
  const [qrExpiresAt, setQrExpiresAt] = useState(initialQrExpiresAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const secondsLeft = useCountdown(qrExpiresAt);
  const isExpired = secondsLeft === 0;

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/consultations/${bookingId}/status`);
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "confirmed") {
          clearInterval(pollingRef.current!);
          router.push(`/konsultasi/sukses?booking=${bookingId}`);
        } else if (status === "expired" || status === "cancelled") {
          clearInterval(pollingRef.current!);
        }
      } catch {
        // network error — keep polling
      }
    }, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [bookingId, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/consultations/refresh-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefreshError(data.error ?? "Gagal memperbarui QR");
        return;
      }
      setQrString(data.qrString ?? "");
      setQrExpiresAt(data.qrExpiresAt);
    } catch {
      setRefreshError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsRefreshing(false);
    }
  }, [bookingId]);

  const handleSimulate = useCallback(async () => {
    setIsSimulating(true);
    try {
      await fetch("/api/dev/simulate-consultation-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
    } finally {
      setIsSimulating(false);
    }
  }, [bookingId]);

  return (
    <div className="max-w-sm w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-primary mb-1">Scan QR untuk Membayar</h1>
        <p className="text-secondary text-sm">
          Konsultasi Kopi &middot; {numberToIdr({ nominal: amount })}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
        {qrString ? (
          <div className={`relative transition-opacity duration-300 ${isExpired ? "opacity-30" : "opacity-100"}`}>
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
          onClick={handleRefresh}
          disabled={isRefreshing || secondsLeft >= 30}
          variant="outline"
          className={`w-full transition-opacity duration-300 ${secondsLeft >= 30 ? "opacity-30" : "opacity-100"}`}
        >
          {isRefreshing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {isRefreshing ? "Memperbarui..." : "Perbarui QR"}
        </Button>

        {refreshError && <p className="text-destructive text-sm text-center">{refreshError}</p>}

        <p className="text-xs text-secondary text-center">
          Mendukung QRIS — GoPay, OVO, Dana, dan semua bank
        </p>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="text-xs px-3 py-1.5 rounded border border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 font-mono transition-colors"
          >
            {isSimulating ? "Simulating..." : "[DEV] Simulate Payment"}
          </button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-secondary">Menunggu konfirmasi pembayaran...</p>
      </div>
    </div>
  );
}
