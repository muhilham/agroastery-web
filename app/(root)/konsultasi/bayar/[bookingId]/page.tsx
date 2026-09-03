import { notFound, redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import QrConsultationClient from "./qr-consultation-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pembayaran Konsultasi — Agroastery",
  description:
    "Selesaikan pembayaran sesi konsultasi kopi 2 jam di roastery Agroastery, Jakarta Selatan, lewat QRIS.",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ bookingId: string }> };

export default async function ConsultationPaymentPage({ params }: Props) {
  const { bookingId } = await params;
  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from("consultation_bookings")
    .select("id, status, amount, pivot_qr_string, pivot_qr_expires_at")
    .eq("id", bookingId)
    .single();

  if (!booking) notFound();

  if (booking.status === "confirmed") {
    redirect(`/konsultasi/sukses?booking=${bookingId}`);
  }

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <QrConsultationClient
          bookingId={booking.id as string}
          amount={booking.amount as number}
          qrString={(booking.pivot_qr_string as string) ?? ""}
          qrExpiresAt={(booking.pivot_qr_expires_at as string) ?? new Date().toISOString()}
        />
      </main>
    </div>
  );
}
