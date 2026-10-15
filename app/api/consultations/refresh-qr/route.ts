import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrisPaymentSession, QRIS_MAX_HOLD_MINUTES } from "@/lib/pivot/client";
import { formatConsultationOrderNumber } from "@/lib/consultations/constants";

const RefreshSchema = z.object({ bookingId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RefreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { bookingId } = parsed.data;
    const supabase = createSupabaseAdminClient();

    const { data: booking, error } = await supabase
      .from("consultation_bookings")
      .select("id, status, created_at, booking_date, time_slot, amount, name, email, phone")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Booking tidak menunggu pembayaran" },
        { status: 400 }
      );
    }

    if (Date.now() - new Date(booking.created_at as string).getTime() > QRIS_MAX_HOLD_MINUTES * 60_000) {
      // Atomic lock: only expire if still awaiting payment (late-confirmed
      // bookings must never be overwritten).
      const { data: locked } = await supabase
        .from("consultation_bookings")
        .update({ status: "expired" })
        .eq("id", bookingId)
        .eq("status", "pending_payment")
        .select("id")
        .maybeSingle();
      if (!locked) {
        return NextResponse.json(
          { error: "Status booking berubah. Muat ulang halaman.", code: "STATE_CHANGED" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Batas waktu pemesanan telah terlewati. Silakan pesan ulang.", code: "HOLD_EXPIRED" },
        { status: 410 }
      );
    }

    const suffix = Date.now().toString(36);
    const session = await createQrisPaymentSession(
      {
        orderId: booking.id as string,
        orderNumber: formatConsultationOrderNumber(
          booking.booking_date as string,
          booking.time_slot as string
        ),
        total: booking.amount as number,
        customerName: booking.name as string,
        customerEmail: booking.email as string,
        customerPhone: booking.phone as string,
      },
      suffix
    );

    const { error: updateError } = await supabase
      .from("consultation_bookings")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_string: session.qrString,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", bookingId);
    if (updateError) throw updateError;

    return NextResponse.json({
      qrUrl: session.qrUrl,
      qrString: session.qrString,
      qrExpiresAt: session.qrExpiresAt,
    });
  } catch (error) {
    console.error("[consultations/refresh-qr] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
