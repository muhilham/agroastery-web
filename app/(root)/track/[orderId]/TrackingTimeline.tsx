"use client";
import { useEffect, useState } from "react";

interface TrackingEvent {
  note: string;
  status: string;
  updated_at: string;
}

interface TrackingData {
  dispatched: boolean;
  status: string;
  waybill_id?: string;
  courier?: string;
  link?: string | null;
  history?: TrackingEvent[];
}

type State =
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "loaded"; data: TrackingData };

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingTimeline({ orderId }: { orderId: string }) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${orderId}/tracking`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not ok");
        const data = (await res.json()) as TrackingData;
        if (!cancelled) setState({ phase: "loaded", data });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "error" });
      });
    return () => { cancelled = true; };
  }, [orderId]);

  if (state.phase === "loading") {
    return (
      <div className="space-y-2 mt-2">
        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <p className="text-xs text-secondary mt-2">
        Tidak dapat memuat info pengiriman
      </p>
    );
  }

  const { data } = state;

  if (!data.dispatched) {
    return (
      <p className="text-sm text-secondary mt-2">
        Pesanan sedang disiapkan untuk dikirim
      </p>
    );
  }

  const history = data.history ?? [];

  return (
    <div className="mt-3">
      {/* Resi chip */}
      {data.waybill_id && (
        <div className="flex items-center justify-between bg-cyan-400/5 border border-cyan-400/15 rounded-lg px-3 py-2 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/60">
              No. Resi
            </p>
            <p className="text-sm font-bold text-cyan-400 font-mono">
              {data.waybill_id}
            </p>
          </div>
          {data.courier && (
            <span className="text-xs text-cyan-400/50 font-medium uppercase">
              {data.courier}
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-3">
        Riwayat Pengiriman
      </p>
      {history.length === 0 ? (
        <p className="text-sm text-secondary">Menunggu update dari kurir</p>
      ) : (
        <div className="relative pl-5">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-white/[0.07]" />
          {history.map((event, i) => (
            <div key={i} className="relative mb-4 last:mb-0">
              <div
                className={`absolute left-[-14px] top-[5px] w-2 h-2 rounded-full border-[1.5px] ${
                  i === 0
                    ? "bg-cyan-400 border-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"
                    : "bg-transparent border-white/20"
                }`}
              />
              <p className={`text-sm leading-snug ${i === 0 ? "text-primary font-medium" : "text-secondary"}`}>
                {event.note}
              </p>
              <p className="text-[10px] text-secondary/50 mt-0.5">
                {formatEventTime(event.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
