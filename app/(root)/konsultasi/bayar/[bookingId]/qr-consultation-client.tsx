"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { RefreshCw, Loader2, Camera, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";

interface Props {
  bookingId: string;
  amount: number;
  qrString: string;
  qrExpiresAt: string | null;
}

function useCountdown(expiresAtIso: string | null) {
  const getSecondsLeft = () => {
    const t = new Date(expiresAtIso ?? "").getTime();
    return Number.isFinite(t) ? Math.max(0, Math.floor((t - Date.now()) / 1000)) : 0;
  };
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
  const [totalSeconds, setTotalSeconds] = useState(() => {
    const t = new Date(initialQrExpiresAt ?? "").getTime();
    return Number.isFinite(t) ? Math.max(1, Math.floor((t - Date.now()) / 1000)) : 1;
  });
  const [refreshNotice, setRefreshNotice] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoFailuresRef = useRef(0);
  const autoExpiryRef = useRef<string | null | undefined>(undefined);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleRefresh = useCallback(async (): Promise<"success" | "hold" | "failure"> => {
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
        return data.code === "HOLD_EXPIRED" ? "hold" : "failure";
      }
      setQrString(data.qrString ?? "");
      setQrExpiresAt(data.qrExpiresAt);
      const t = new Date(data.qrExpiresAt).getTime();
      setTotalSeconds(Number.isFinite(t) ? Math.max(1, Math.floor((t - Date.now()) / 1000)) : 1);
      return "success";
    } catch {
      setRefreshError("Terjadi kesalahan. Coba lagi.");
      return "failure";
    } finally {
      setIsRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!isExpired || autoExpiryRef.current === qrExpiresAt || !qrString) return;
    autoExpiryRef.current = qrExpiresAt;
    autoFailuresRef.current = 0;
    let cancelled = false;
    const retry = async () => {
      const result = await handleRefresh();
      if (cancelled) return;
      if (result === "success") { setRefreshNotice(true); return; }
      if (result === "hold") return;
      autoFailuresRef.current += 1;
      if (autoFailuresRef.current < 3) {
        const delays = [5000, 15000, 45000];
        autoRetryTimerRef.current = setTimeout(retry, delays[autoFailuresRef.current - 1]);
      }
    };
    void retry();
    return () => {
      cancelled = true;
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    };
  }, [isExpired, qrExpiresAt, qrString, handleRefresh]);

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

      {/* Payment method strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <span className="rounded-md border border-white/15 bg-[#242424] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
          QRIS
        </span>
        {["GoPay", "OVO", "DANA", "ShopeePay", "m-banking"].map((m) => (
          <span
            key={m}
            className="rounded-md border border-white/10 bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-white/60"
          >
            {m}
          </span>
        ))}
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

        {qrString && (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 w-full">
              <Camera className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm font-medium text-amber-800 leading-snug">
                Screenshot QR ini, lalu scan di aplikasi pembayaran
              </p>
            </div>
            <a
              href={`/api/consultations/${bookingId}/qr.png`}
              download
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download QR
            </a>
          </>
        )}

        {refreshNotice && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
            <p className="text-sm font-medium text-green-800">QR baru dibuat — silakan scan kembali</p>
            <button className="text-xs text-green-700 underline" onClick={() => setRefreshNotice(false)}>Tutup</button>
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
          Satu QRIS untuk semua — scan lewat GoPay, OVO, DANA, ShopeePay, atau m-banking
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
