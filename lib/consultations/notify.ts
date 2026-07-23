/** Telegram notifications for consultation bookings (fire-and-forget). */

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = () => process.env.TELEGRAM_CHAT_ID ?? "";

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function sendTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID(), text }),
    }
  );
  if (!res.ok) {
    console.error("[consultations/notify] telegram send failed:", res.status);
  }
}

export interface BookingAlertParams {
  name: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
  purpose: string;
  notes: string | null;
  amount: number;
}

export async function sendConsultationBookingAlert(p: BookingAlertParams): Promise<void> {
  const purposeLabel =
    p.purpose === "custom_blending" ? "Cari blend untuk menu" : "Coba produk AGR";
  await sendTelegram(
    [
      "🗓 KONSULTASI BARU (LUNAS)",
      `${p.name} — ${p.phone}`,
      `Tanggal: ${p.bookingDate} jam ${p.timeSlot} WIB`,
      `Tujuan: ${purposeLabel}`,
      p.notes ? `Catatan: ${p.notes}` : null,
      `Fee: ${formatIdr(p.amount)}`,
      "👉 Follow-up bahan via WhatsApp",
    ]
      .filter(Boolean)
      .join("\n")
  );
}

export interface CancelAlertParams {
  name: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
  amount: number;
}

export async function sendConsultationCancelAlert(p: CancelAlertParams): Promise<void> {
  await sendTelegram(
    [
      "⚠️ KONSULTASI DIBATALKAN — PERLU REFUND MANUAL",
      `${p.name} — ${p.phone}`,
      `Tanggal: ${p.bookingDate} jam ${p.timeSlot} WIB`,
      `Refund: ${formatIdr(p.amount)}`,
    ].join("\n")
  );
}

export interface ConflictAlertParams {
  bookingId: string;
  name: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
}

export async function sendConsultationConflictAlert(p: ConflictAlertParams): Promise<void> {
  await sendTelegram(
    [
      "🚨 KONFLIK SLOT KONSULTASI",
      `Booking ${p.bookingId} (${p.name} — ${p.phone}) dibayar SETELAH expired,`,
      `tapi slot ${p.bookingDate} jam ${p.timeSlot} WIB sudah terisi.`,
      "👉 Hubungi customer untuk reschedule/refund manual.",
    ].join("\n")
  );
}
