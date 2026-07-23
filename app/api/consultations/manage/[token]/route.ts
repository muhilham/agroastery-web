import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("id, name, email, phone, purpose, booking_date, time_slot, status, notes, created_at")
    .eq("manage_token", token)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ booking: data });
}
