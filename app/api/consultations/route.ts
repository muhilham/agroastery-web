import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { CreateBookingSchema } from "@/lib/consultations/schema";
import {
  CONSULTATION_FEE_IDR,
  formatConsultationOrderNumber,
} from "@/lib/consultations/constants";
import { createQrisPaymentSession } from "@/lib/pivot/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  let userId: string | null = null;
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    userId = user?.id ?? null;
  } catch { userId = null; }

  const supabase = createSupabaseAdminClient();

  const { data: booking, error: insertError } = await supabase
    .from("consultation_bookings")
    .insert({
      user_id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      purpose: input.purpose,
      booking_date: input.booking_date,
      time_slot: input.time_slot,
      notes: input.notes ?? null,
      amount: CONSULTATION_FEE_IDR,
      status: "pending_payment",
    })
    .select("id, manage_token")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Slot ini baru saja dipesan. Silakan pilih waktu lain.", code: "SLOT_TAKEN" },
        { status: 409 }
      );
    }
    console.error("[consultations] insert error:", insertError);
    return NextResponse.json({ error: "Gagal membuat booking" }, { status: 500 });
  }

  try {
    const session = await createQrisPaymentSession({
      orderId: booking.id as string,
      orderNumber: formatConsultationOrderNumber(input.booking_date, input.time_slot),
      total: CONSULTATION_FEE_IDR,
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
    });

    await supabase
      .from("consultation_bookings")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_string: session.qrString,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", booking.id as string);

    return NextResponse.json({
      bookingId: booking.id,
      qrString: session.qrString,
      qrUrl: session.qrUrl,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (err) {
    console.error("[consultations] Pivot session failed:", err);
    await supabase.from("consultation_bookings").delete().eq("id", booking.id as string);
    return NextResponse.json(
      { error: "Gagal membuat sesi pembayaran. Coba lagi." },
      { status: 500 }
    );
  }
}
