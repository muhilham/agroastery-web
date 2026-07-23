import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { simulatePayment } from "@/lib/pivot/client";

const SimulateSchema = z.object({ bookingId: z.string().uuid() });

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = SimulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { bookingId } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: booking, error } = await supabase
    .from("consultation_bookings")
    .select("pivot_payment_session_id, status")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "confirmed") {
    return NextResponse.json({ error: "Booking already paid" }, { status: 409 });
  }

  if (!booking.pivot_payment_session_id) {
    return NextResponse.json(
      { error: "No Pivot payment session on this booking" },
      { status: 422 }
    );
  }

  try {
    await simulatePayment(booking.pivot_payment_session_id as string);
  } catch (err) {
    console.error("[dev/simulate-consultation-payment] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  return NextResponse.json({ simulated: true });
}
