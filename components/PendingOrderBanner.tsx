"use client";

// Issue #226 P1a: same-browser recovery banner for an abandoned unpaid order.
// Reads the localStorage pointer written at checkout handoff, verifies against
// the authoritative order status, and offers a one-tap return to the QRIS page.
import { useEffect, useState } from "react";
import Link from "next/link";
import { numberToIdr } from "@/lib/numberToIdr";
import {
  loadPendingOrder,
  clearPendingOrder,
  type PendingOrder,
} from "@/lib/pending-order";

export default function PendingOrderBanner() {
  const [order, setOrder] = useState<PendingOrder | null>(null);

  useEffect(() => {
    const pending = loadPendingOrder();
    if (!pending) return;
    let cancelled = false;
    fetch(`/api/orders/${pending.orderId}/status`)
      .then((res) => {
        if (cancelled) return null;
        // 404 is terminal (order no longer exists) → clear the pointer.
        // Any other !res.ok (500 etc.) throws into the catch below, which
        // deliberately KEEPS the pointer so the next mount retries.
        if (res.status === 404) return { terminal: true as const };
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json().then((data: { payment_status?: string }) => ({
          terminal: data.payment_status !== "pending_payment",
        }));
      })
      .then((result) => {
        if (cancelled || !result) return;
        if (result.terminal) {
          clearPendingOrder();
        } else {
          setOrder(pending);
        }
      })
      .catch(() => {
        // Network/server transient — do NOT clear; retry on next mount.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Renders nothing until the async status check confirms the order is still
  // unpaid — a never-blinking banner is the point (no dead links, no flicker).
  if (!order) return null;

  return (
    <div
      data-testid="pending-order-banner"
      className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-primary text-sm font-semibold">
          Pesanan #{order.orderNumber} belum dibayar
        </p>
        <p className="text-secondary text-xs mt-0.5">
          {numberToIdr({ nominal: order.total })} — QR masih bisa dipakai, cukup lanjutkan pembayaran.
        </p>
      </div>
      <Link
        href={`/checkout/payment/${order.orderId}`}
        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
      >
        Lanjut bayar
      </Link>
    </div>
  );
}
