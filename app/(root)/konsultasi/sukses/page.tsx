import Link from "next/link";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ booking?: string }> };

export default async function KonsultasiSuccessPage({ searchParams }: Props) {
  const { booking: bookingId } = await searchParams;

  let booking: {
    booking_date: string;
    time_slot: string;
    manage_token: string;
    status: string;
  } | null = null;

  if (bookingId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("consultation_bookings")
      .select("booking_date, time_slot, manage_token, status")
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

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-9 h-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-primary mb-2">Pembayaran berhasil</h1>
          <p className="text-secondary text-sm mb-6">
            Slot konsultasi kamu sudah terkonfirmasi. Detail booking dan link
            untuk mengelola jadwal telah dikirim ke email kamu.
          </p>

          {booking && (
            <div className="rounded-xl border border-white/15 p-4 mb-6 text-left">
              <p className="text-sm text-foreground">
                <span className="text-secondary">Tanggal:</span> {dateLabel}
              </p>
              <p className="text-sm text-foreground mt-1">
                <span className="text-secondary">Waktu:</span> {booking.time_slot} WIB (2 jam)
              </p>
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
