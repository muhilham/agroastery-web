import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendConsultationCancelAlert } from "@/lib/consultations/notify";
import { sendConsultationCancelledEmail } from "@/lib/resend/sendConsultationEmail";

export const dynamic = "force-dynamic";

function todayWib(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .select("id, status, booking_date, time_slot, name, phone, email, amount")
    .eq("manage_token", token)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ ok: true });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking tidak dapat dibatalkan" }, { status: 400 });
  }

  if ((booking.booking_date as string) <= todayWib()) {
    return NextResponse.json({ error: "Booking sudah lewat dan tidak dapat dibatalkan" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("consultation_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id as string)
    .eq("status", "confirmed");

  if (updateError) {
    console.error("[consultations/cancel] update error:", updateError);
    return NextResponse.json({ error: "Gagal membatalkan booking" }, { status: 500 });
  }

  sendConsultationCancelAlert({
    name: booking.name as string,
    phone: booking.phone as string,
    bookingDate: booking.booking_date as string,
    timeSlot: booking.time_slot as string,
    amount: booking.amount as number,
  }).catch((err) => console.error("[consultations/cancel] telegram failed:", err));

  sendConsultationCancelledEmail(booking.id as string).catch((err) =>
    console.error("[consultations/cancel] email failed:", err)
  );

  return NextResponse.json({ ok: true });
}
