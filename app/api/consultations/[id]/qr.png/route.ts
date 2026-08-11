import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("consultation_bookings")
    .select("id, pivot_qr_string")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Consultation booking not found" },
      { status: 404 }
    );
  }

  const qrString = data.pivot_qr_string;
  if (!qrString) {
    return NextResponse.json(
      { error: "QR string not available for this booking" },
      { status: 400 }
    );
  }

  try {
    const buffer = await QRCode.toBuffer(qrString, {
      width: 512,
      margin: 4,
      type: "png",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qris-konsultasi-${id}.png"`,
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate QR image" },
      { status: 500 }
    );
  }
}
