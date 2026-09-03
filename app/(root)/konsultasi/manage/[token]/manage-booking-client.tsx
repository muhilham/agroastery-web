"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";

interface Booking {
  id: string;
  name: string;
  purpose: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  notes: string | null;
}

interface SlotAvailability {
  time: string;
  available: boolean;
}

interface DateAvailability {
  date: string;
  slots: SlotAvailability[];
}

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function ManageBookingClient({
  token,
  initialBooking,
}: {
  token: string;
  initialBooking: Booking | null;
}) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [dates, setDates] = useState<DateAvailability[]>([]);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!showReschedule) return;
    fetch("/api/consultations/availability")
      .then((r) => r.json())
      .then((j) => setDates(j.dates ?? []))
      .catch(() => {});
  }, [showReschedule]);

  const handleReschedule = useCallback(async () => {
    if (!newDate || !newSlot) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/manage/${token}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_date: newDate, time_slot: newSlot }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal mengubah jadwal");
        return;
      }
      setBooking((b) => b && { ...b, bookingDate: newDate, timeSlot: newSlot });
      setShowReschedule(false);
      setNewDate(null);
      setNewSlot(null);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }, [token, newDate, newSlot]);

  const handleCancel = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultations/manage/${token}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal membatalkan booking");
        return;
      }
      setBooking((b) => b && { ...b, status: "cancelled" });
      setShowCancelConfirm(false);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsBusy(false);
    }
  }, [token]);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-xl font-semibold text-primary mb-2">Booking tidak ditemukan</h1>
        <p className="text-secondary text-sm mb-6">Link mungkin sudah tidak valid.</p>
        <Link href="/konsultasi" className="text-primary underline underline-offset-4 text-sm">
          Buat booking baru
        </Link>
      </div>
    );
  }

  const dateLabel = formatBookingDateId(booking.bookingDate);
  const isUpcoming = booking.status === "confirmed" && booking.bookingDate > new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const waUrl = buildWhatsAppLink(
    `Halo, saya mau tanya soal booking konsultasi saya (tanggal ${dateLabel} jam ${booking.timeSlot})`
  );

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-primary mb-4">Kelola Booking</h1>

      <div className="rounded-xl border border-white/15 p-4 mb-4">
        <p className="text-sm"><span className="text-secondary">Nama:</span> {booking.name}</p>
        <p className="text-sm mt-1"><span className="text-secondary">Tanggal:</span> {dateLabel}</p>
        <p className="text-sm mt-1"><span className="text-secondary">Waktu:</span> {booking.timeSlot} WIB</p>
        <p className="text-sm mt-1">
          <span className="text-secondary">Status:</span>{" "}
          {booking.status === "confirmed" ? "Terkonfirmasi" : booking.status === "cancelled" ? "Dibatalkan" : booking.status}
        </p>
      </div>

      {booking.status === "cancelled" && (
        <div className="text-center py-4">
          <p className="text-secondary text-sm mb-4">Booking ini telah dibatalkan. Refund diproses manual oleh tim kami.</p>
          <Link href="/konsultasi" className="text-primary underline underline-offset-4 text-sm">Booking lagi</Link>
        </div>
      )}

      {isUpcoming && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowReschedule((v) => !v)}>Ubah Jadwal</Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(true)}>Batalkan</Button>
        </div>
      )}

      {showReschedule && (
        <div className="rounded-xl border border-white/15 p-4 mb-4">
          <h2 className="text-sm font-medium mb-3">Pilih jadwal baru</h2>
          <p className="hidden sm:block text-[11px] text-secondary mb-1">Geser untuk lihat tanggal lain →</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-fade-mobile pb-2 mb-3">
            {dates.map((d) => {
              const [y, m, dd] = d.date.split("-").map(Number);
              const weekday = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
              const allTaken = d.slots.every((s) => !s.available);
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={allTaken}
                  onClick={() => { setNewDate(d.date); setNewSlot(null); }}
                  className={`flex flex-col items-center min-w-14 rounded-lg border px-3 py-2 text-sm
                    ${newDate === d.date ? "border-primary bg-primary/10 text-primary" : "border-white/15"}
                    ${allTaken ? "opacity-30" : ""}`}
                >
                  <span className="text-xs">{DAY_SHORT[weekday]}</span>
                  <span className="font-semibold">{dd}</span>
                </button>
              );
            })}
          </div>
          {newDate && (
            <div className="flex gap-2 mb-3">
              {dates.find((d) => d.date === newDate)?.slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setNewSlot(s.time)}
                  className={`rounded-lg border px-4 py-2 text-sm
                    ${newSlot === s.time ? "border-primary bg-primary/10 text-primary" : "border-white/15"}
                    ${!s.available ? "opacity-30 line-through" : ""}`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <Button onClick={handleReschedule} disabled={!newDate || !newSlot || isBusy} className="w-full">
            {isBusy ? "Menyimpan..." : "Simpan Jadwal Baru"}
          </Button>
        </div>
      )}

      {showCancelConfirm && (
        <div className="rounded-xl border border-destructive/40 p-4 mb-4">
          <p className="text-sm mb-3">Yakin mau membatalkan booking ini? Refund akan diproses manual oleh tim kami via WhatsApp.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={isBusy}>Kembali</Button>
            <Button className="flex-1" onClick={handleCancel} disabled={isBusy}>
              {isBusy ? "Membatalkan..." : "Ya, Batalkan"}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline underline-offset-4">
        Butuh bantuan? Chat kami
      </a>
    </div>
  );
}
