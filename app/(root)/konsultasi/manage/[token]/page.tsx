import Navigation from "@/components/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import ManageBookingClient from "./manage-booking-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola Booking Konsultasi — Agroastery",
  description:
    "Ubah jadwal atau batalkan booking konsultasi kopi kamu di roastery Agroastery, Jakarta Selatan.",
  // Private per-user tokenized page — never indexable.
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

export default async function ManageBookingPage({ params }: Props) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();

  const { data: booking } = await admin
    .from("consultation_bookings")
    .select("id, name, purpose, booking_date, time_slot, status, notes")
    .eq("manage_token", token)
    .single();

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-12">
        <ManageBookingClient
          token={token}
          initialBooking={
            booking
              ? {
                  id: booking.id as string,
                  name: booking.name as string,
                  purpose: booking.purpose as string,
                  bookingDate: String(booking.booking_date),
                  timeSlot: String(booking.time_slot),
                  status: booking.status as string,
                  notes: (booking.notes as string | null) ?? null,
                }
              : null
          }
        />
      </main>
    </div>
  );
}
