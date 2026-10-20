"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { numberToIdr } from "@/lib/numberToIdr";
import { useCart } from "@/lib/hooks/useCart";
import { clearPendingOrder, loadPendingOrder } from "@/lib/pending-order";
import { QRIS_REFRESH_AT_SECONDS } from "@/lib/pivot/qris-timing";
import { RefreshCw, Loader2, Camera, Download } from "lucide-react";

interface Props {
  orderId: string;
  orderNumber: string;
  total: number;
  qrString: string; // raw EMVCO QRIS string
  qrExpiresAt: string | null; // ISO 8601
  /** #226 P1c: true only when a payment-link email was actually sent to
   *  customer_email. Copy must not promise an email that never arrived
   *  (logged-in checkout allows empty email). */
  hasPaymentEmail: boolean;
}

/**
 * Issue #187: a QRIS payment can settle after the Pivot session reports the
 * order expired. Keep polling for this window before showing the dead state.
 */
const POLL_GRACE_MS = 10 * 60 * 1000;

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
  hasPaymentEmail,
}: Props) {
  const { clearCart } = useCart();
  const [qrString, setQrString] = useState(initialQrString);
  const [qrExpiresAt, setQrExpiresAt] = useState(initialQrExpiresAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

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
  const [totalSeconds, setTotalSeconds] = useState(() => {
    const t = new Date(initialQrExpiresAt ?? "").getTime();
    return Number.isFinite(t) ? Math.max(1, Math.floor((t - Date.now()) / 1000)) : 1;
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graceDeadlineRef = useRef<number | null>(null);
  const [inGracePeriod, setInGracePeriod] = useState(false);
  const [graceEnded, setGraceEnded] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(false);
  const autoFailuresRef = useRef(0);
  const autoExpiryRef = useRef<string | null | undefined>(undefined);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          // #226 P1a: this order is paid — drop the same-browser recovery
          // pointer when (and only when) it points at THIS order. An
          // unconditional clear would also wipe the pointer of a NEWER
          // unpaid order (checkout B, then pay A via email in the same
          // browser), silently killing B's recovery banner.
          const pointer = loadPendingOrder();
          if (pointer && pointer.orderId === orderId) clearPendingOrder();
          // Hard navigation: SPA router.push renders /checkout/success
          // without order params, so PurchaseTracking never mounts with data
          // and the GA4 purchase event never fires (issue #186).
          window.location.href = `/checkout/success?order=${orderId}`;
        } else if (payment_status === "expired" || payment_status === "cancelled") {
          if (graceDeadlineRef.current === null) {
            graceDeadlineRef.current = Date.now() + POLL_GRACE_MS;
            setInGracePeriod(true);
          }
          if (Date.now() >= graceDeadlineRef.current) {
            clearInterval(pollingRef.current!);
            setInGracePeriod(false);
            setGraceEnded(true);
          }
        } else if (graceDeadlineRef.current !== null) {
          // Status came back alive again (e.g. QR refreshed) — leave the grace window.
          graceDeadlineRef.current = null;
          setInGracePeriod(false);
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, clearCart]);

  const handleRefresh = useCallback(async (): Promise<"success" | "hold" | "failure"> => {
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
        // 409: payment landed (or state changed) under us — reload to the
        // authoritative page instead of retrying a doomed refresh.
        if (data.code === "STATE_CHANGED") {
          window.location.reload();
          return "hold";
        }
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
  }, [orderId]);

  // #231 A3: the acquirer layer (BRI switch) evidently stops honoring a
  // dynamic QRIS RRN long before the Pivot session's 60-min expiryAt, and the
  // old design only regenerated at countdown-zero — minutes after the QR had
  // gone unpayable. Proactively regenerate once the displayed QR enters the
  // safety horizon, so an on-page customer always scans a young RRN.
  const needsFreshQr = secondsLeft <= QRIS_REFRESH_AT_SECONDS;

  useEffect(() => {
    if (!needsFreshQr || autoExpiryRef.current === qrExpiresAt || !qrString) return;
    autoExpiryRef.current = qrExpiresAt;
    autoFailuresRef.current = 0;
    let cancelled = false;
    const retry = async () => {
      const result = await handleRefresh();
      if (cancelled) return;
      if (result === "success") {
        setRefreshNotice(true);
        return;
      }
      if (result === "hold") return;
      autoFailuresRef.current += 1;
      // 3 total attempts: initial + 2 backoff retries, then leave manual state.
      if (autoFailuresRef.current < 3) {
        const delays = [5000, 15000];
        autoRetryTimerRef.current = setTimeout(retry, delays[autoFailuresRef.current - 1]);
      }
    };
    void retry();
    return () => {
      cancelled = true;
      if (autoRetryTimerRef.current) clearTimeout(autoRetryTimerRef.current);
    };
  }, [needsFreshQr, qrExpiresAt, qrString, handleRefresh]);

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
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm font-medium text-amber-800 leading-snug">
                    Screenshot QR ini, lalu scan di aplikasi pembayaran
                  </p>
                </div>
                <a
                  href={`/api/orders/${orderId}/qr.png`}
                  download
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </a>
                {/* #226 P1c: tell the customer how to get back if they leave.
                    Conditional: a logged-in checkout can complete with an
                    empty email, and promising "cek email" then would lie. */}
                <p className="text-xs text-gray-500 text-center leading-relaxed" data-testid="recovery-copy">
                  {hasPaymentEmail
                    ? "Tutup halaman ini tidak apa-apa — tautan pembayaran juga dikirim ke email Anda, dan QR diperbarui otomatis selama pesanan aktif."
                    : "Tutup halaman ini tidak apa-apa — kembali ke halaman Checkout dan banner “Lanjut bayar” akan membawa Anda ke QR ini, selama pesanan aktif."}
                </p>
              </>
            )}

            {(!isExpired || inGracePeriod) && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="relative w-3 h-3">
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Memantau pembayaran...</span>
              </div>
            )}

            {inGracePeriod && (
              <div
                data-testid="payment-grace-notice"
                className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center"
              >
                <p className="text-sm font-medium text-amber-800 leading-snug">
                  Menunggu pembayaran — payment masih bisa masuk
                </p>
              </div>
            )}

            {graceEnded && (
              <div
                data-testid="payment-cancelled-notice"
                className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-center"
              >
                <p className="text-sm font-medium text-red-700 leading-snug">
                  Pembayaran kedaluwarsa. Silakan pesan ulang.
                </p>
                {/* #231 A4: the notice said "pesan ulang" but gave no way to do
                    it. Cart is only cleared on PAID (line above), so the items
                    are still here — offer an explicit one-click reorder path. */}
                <Link
                  href="/cart"
                  data-testid="reorder-cta"
                  className="mt-2 inline-flex items-center justify-center w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Pesan ulang dari keranjang
                </Link>
              </div>
            )}

            {refreshNotice && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center">
                <p className="text-sm font-medium text-green-800">QR baru dibuat — silakan scan kembali</p>
                <button className="text-xs text-green-700 underline" onClick={() => setRefreshNotice(false)}>Tutup</button>
              </div>
            )}

            {!isExpired && (
              <CountdownRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
            )}

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="w-full transition-opacity duration-300"
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
