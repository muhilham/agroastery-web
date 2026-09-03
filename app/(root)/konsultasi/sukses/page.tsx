import Link from "next/link";
import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";
import { ADDRESS } from "@/constant/resource-and-link";
import ConsultationTracking from "./ConsultationTracking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking Konsultasi Terkonfirmasi — Agroastery",
  description:
    "Slot konsultasi kopi kamu sudah terkonfirmasi. Siap datang ke roastery Agroastery di Jakarta Selatan — cek detail jadwal dan kelola booking di sini.",
  robots: { index: false, follow: false },
};

/** Format a WIB datetime as basic UTC (YYYYMMDDTHHMMSSZ) for calendar links. */
function toUtcStamp(dateStr: string, timeStr: string, addHours = 0): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  // WIB is UTC+7 — shift back to UTC, then apply session length.
  const utc = new Date(Date.UTC(y, m - 1, d, hh - 7 + addHours, mm));
  return utc.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function calendarLinks(dateStr: string, timeStr: string) {
  const start = toUtcStamp(dateStr, timeStr);
  const end = toUtcStamp(dateStr, timeStr, 2);
  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    "Konsultasi Kopi Agroastery"
  )}&dates=${start}/${end}&location=${encodeURIComponent(
    `Agroastery Private Bar, ${ADDRESS}`
  )}&details=${encodeURIComponent("Sesi konsultasi kopi 2 jam di roastery Agroastery.")}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agroastery//Konsultasi//ID",
    "BEGIN:VEVENT",
    `UID:konsultasi-${dateStr}-${timeStr.replace(":", "")}@agroastery.com`,
    `DTSTAMP:${toUtcStamp(dateStr, timeStr)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "SUMMARY:Konsultasi Kopi Agroastery",
    `LOCATION:Agroastery Private Bar\\, ${ADDRESS.replace(/,/g, "\\,")}`,
    "DESCRIPTION:Sesi konsultasi kopi 2 jam di roastery Agroastery.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return { gcal, ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}

type Props = { searchParams: Promise<{ booking?: string }> };

export default async function KonsultasiSuccessPage({ searchParams }: Props) {
  const { booking: bookingId } = await searchParams;

  let booking: {
    booking_date: string;
    time_slot: string;
    manage_token: string;
    status: string;
    amount: number;
  } | null = null;

  if (bookingId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("consultation_bookings")
      .select("booking_date, time_slot, manage_token, status, amount")
      .eq("id", bookingId)
      .single();
    booking = data;
  }

  const dateLabel = booking ? formatBookingDateId(booking.booking_date) : "";
  const waUrl = booking
    ? buildWhatsAppLink(
        `Halo, saya sudah booking konsultasi tanggal ${dateLabel} jam ${booking.time_slot}. Saya mau koordinasi bahan.`
      )
    : "#";

  const shouldTrackBooking = !!booking && booking.status === "confirmed" && !!bookingId;
  const calendar = booking ? calendarLinks(booking.booking_date, booking.time_slot) : null;

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {shouldTrackBooking && (
        <ConsultationTracking bookingId={bookingId as string} value={booking!.amount} />
      )}
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-primary mb-2">Sampai ketemu, ya!</h1>
          <p className="text-secondary text-sm mb-6">
            Pembayaran berhasil dan slot konsultasi kamu sudah kami catat. Tim kami
            siap menyambut kamu di roastery — detail booking dan link untuk mengelola
            jadwal sudah dikirim ke email kamu. Jangan lupa mampir lebih awal kalau
            mau lihat proses roastingnya.
          </p>

          {booking && (
            <div className="rounded-xl border border-white/15 p-4 mb-6 text-left">
              <p className="text-sm text-white/60">
                <span className="text-secondary">Tanggal:</span> {dateLabel}
              </p>
              <p className="text-sm text-white/60 mt-1">
                <span className="text-secondary">Waktu:</span> {booking.time_slot} WIB (2 jam)
              </p>
              <p className="text-sm text-white/60 mt-1">
                <span className="text-secondary">Lokasi:</span> Agroastery Private Bar
              </p>
              <p className="text-xs text-secondary leading-relaxed mt-0.5">{ADDRESS}</p>
            </div>
          )}

          {calendar && (
            <div className="flex items-center justify-center gap-4 mb-6 -mt-3">
              <a
                href={calendar.gcal}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline underline-offset-4"
              >
                + Google Calendar
              </a>
              <a
                href={calendar.ics}
                download={`konsultasi-agroastery-${booking!.booking_date}.ics`}
                className="text-sm text-secondary underline underline-offset-4 hover:text-primary"
              >
                Unduh .ics
              </a>
            </div>
          )}

          {booking && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block mb-3">
              <Button className="w-full">Koordinasi bahan via WhatsApp</Button>
            </a>
          )}

          {booking && (
            <Link
              href={`/konsultasi/manage/${booking.manage_token}`}
              className="text-sm text-secondary underline-offset-4 hover:underline"
            >
              Kelola booking (ubah jadwal / batalkan)
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
