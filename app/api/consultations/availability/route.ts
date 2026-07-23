import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { generateConsultationAvailability } from "@/lib/consultations/availability";
import { CONSULTATION_WINDOW_WEEKS } from "@/lib/consultations/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const todayWib = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const max = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  max.setDate(max.getDate() + CONSULTATION_WINDOW_WEEKS * 7);
  const maxWib = max.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("booking_date, time_slot")
    .in("status", ["pending_payment", "confirmed"])
    .gte("booking_date", todayWib)
    .lte("booking_date", maxWib);

  if (error) {
    console.error("[consultations/availability] DB error:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }

  const dates = generateConsultationAvailability(
    now,
    (data ?? []).map((b) => ({
      booking_date: String(b.booking_date),
      time_slot: String(b.time_slot),
    }))
  );

  return NextResponse.json({ dates });
}
