import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { RescheduleSchema } from "@/lib/consultations/schema";
import { sendConsultationRescheduledEmail } from "@/lib/resend/sendConsultationEmail";

export const dynamic = "force-dynamic";

function todayWib(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .select("id, status, booking_date")
    .eq("manage_token", token)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Hanya booking terkonfirmasi yang bisa diubah jadwalnya" },
      { status: 400 }
    );
  }

  if ((booking.booking_date as string) <= todayWib()) {
    return NextResponse.json(
      { error: "Booking sudah lewat dan tidak dapat diubah" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("consultation_bookings")
    .update({
      booking_date: parsed.data.booking_date,
      time_slot: parsed.data.time_slot,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id as string);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "Slot ini baru saja dipesan. Pilih waktu lain.", code: "SLOT_TAKEN" },
        { status: 409 }
      );
    }
    console.error("[consultations/reschedule] update error:", updateError);
    return NextResponse.json({ error: "Gagal mengubah jadwal" }, { status: 500 });
  }

  sendConsultationRescheduledEmail(booking.id as string).catch((err) =>
    console.error("[consultations/reschedule] email failed:", err)
  );

  return NextResponse.json({ ok: true });
}
