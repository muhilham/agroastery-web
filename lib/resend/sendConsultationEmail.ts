import { Resend } from "resend";
import * as React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ConsultationBookingEmail } from "./templates/ConsultationBooking";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatBookingDateId } from "@/lib/consultations/format";

type Variant = "confirmed" | "rescheduled" | "cancelled";

async function send(bookingId: string, variant: Variant): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[sendConsultationEmail] RESEND_API_KEY not set — skipping");
      return;
    }

    const admin = createSupabaseAdminClient();
    const { data: booking, error } = await admin
      .from("consultation_bookings")
      .select("id, name, email, booking_date, time_slot, manage_token")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error(`[sendConsultationEmail] booking not found: ${bookingId}`, error);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    const dateLabel = formatBookingDateId(String(booking.booking_date));
    const timeSlot = String(booking.time_slot);
    const manageUrl = `${appUrl}/konsultasi/manage/${booking.manage_token}`;
    const whatsappUrl = buildWhatsAppLink(
      `Halo, saya sudah booking konsultasi tanggal ${dateLabel} jam ${timeSlot}. Saya mau koordinasi bahan.`
    );

    const subject =
      variant === "confirmed"
        ? "Konsultasi kamu terkonfirmasi — Agroastery"
        : variant === "rescheduled"
          ? "Jadwal konsultasi diperbarui — Agroastery"
          : "Konsultasi dibatalkan — Agroastery";

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: sendError } = await resend.emails.send({
      from: "Agroastery <order@agroastery.com>",
      to: booking.email as string,
      subject,
      react: React.createElement(ConsultationBookingEmail, {
        customerName: booking.name as string,
        bookingDate: dateLabel,
        timeSlot,
        manageUrl,
        whatsappUrl,
        variant,
      }),
    });

    if (sendError) {
      console.error("[sendConsultationEmail] resend error:", sendError);
    }
  } catch (err) {
    console.error("[sendConsultationEmail] unexpected error:", err);
  }
}

export function sendConsultationConfirmationEmail(bookingId: string): Promise<void> {
  return send(bookingId, "confirmed");
}

export function sendConsultationRescheduledEmail(bookingId: string): Promise<void> {
  return send(bookingId, "rescheduled");
}

export function sendConsultationCancelledEmail(bookingId: string): Promise<void> {
  return send(bookingId, "cancelled");
}
