import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrisPaymentSession } from "@/lib/pivot/client";

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
      .select("id, status, booking_date, time_slot, amount, name, email, phone")
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

    const suffix = Date.now().toString(36);
    const session = await createQrisPaymentSession(
      {
        orderId: booking.id as string,
        orderNumber: `KONSULTASI-${booking.booking_date}-${booking.time_slot}`,
        total: booking.amount as number,
        customerName: booking.name as string,
        customerEmail: booking.email as string,
        customerPhone: booking.phone as string,
      },
      suffix
    );

    await supabase
      .from("consultation_bookings")
      .update({
        pivot_payment_session_id: session.paymentSessionId,
        pivot_qr_string: session.qrString,
        pivot_qr_url: session.qrUrl,
        pivot_qr_expires_at: session.qrExpiresAt,
      })
      .eq("id", bookingId);

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
