import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderNotificationParams = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  items: { productName: string; variantDescription: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: { address_line: string; postal_code?: string | null };
  shippingCourier?: string | null;
  shippingService?: string | null;
};

type PaymentNotificationParams = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  paymentMethod?: string | null;
  total: number;
  paidAt: string; // ISO string
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function logNotification({
  type,
  orderId,
  orderNumber,
  message,
  status,
  error,
}: {
  type: string;
  orderId: string;
  orderNumber: string;
  message: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("ecom_notification_logs").insert({
      type,
      channel: "telegram",
      order_id: orderId,
      order_number: orderNumber,
      message,
      status,
      error: error ?? null,
    });
  } catch (err) {
    console.error("Failed to log notification:", err);
  }
}

/** Send text to the configured Telegram group. Returns error string on failure, null on success. */
async function sendTelegramMessage(text: string): Promise<string | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured";
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });

    if (!res.ok) {
      const body = await res.text();
      return `Telegram API error ${res.status}: ${body}`;
    }

    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

// ─── Order created ────────────────────────────────────────────────────────────

export async function sendOrderNotification(params: OrderNotificationParams): Promise<void> {
  const itemLines = params.items
    .map(
      (i) =>
        `  • ${i.productName} (${i.variantDescription}) ×${i.quantity} — ${formatIdr(i.unitPrice * i.quantity)}`
    )
    .join("\n");

  const courier =
    params.shippingCourier && params.shippingService
      ? `${params.shippingCourier.toUpperCase()} ${params.shippingService}`
      : params.shippingCourier?.toUpperCase() ?? "—";

  const text = [
    `🛍 *Pesanan Baru!*`,
    ``,
    `*No. Pesanan:* \`${params.orderNumber}\``,
    `*Pelanggan:* ${params.customerName}`,
    `*HP:* ${params.customerPhone}`,
    params.customerEmail ? `*Email:* ${params.customerEmail}` : null,
    ``,
    `*Produk:*`,
    itemLines,
    ``,
    `*Alamat:* ${params.shippingAddress.address_line}${params.shippingAddress.postal_code ? `, ${params.shippingAddress.postal_code}` : ""}`,
    `*Kurir:* ${courier}`,
    ``,
    `*Subtotal:* ${formatIdr(params.subtotal)}`,
    `*Ongkir:* ${formatIdr(params.shippingCost)}`,
    `*Total:* *${formatIdr(params.total)}*`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const sendError = await sendTelegramMessage(text);
  const skipped = sendError?.includes("not configured");

  await logNotification({
    type: "order_created",
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    message: text,
    status: skipped ? "skipped" : sendError ? "failed" : "sent",
    error: skipped ? undefined : sendError ?? undefined,
  });

  if (sendError && !skipped) {
    console.error("Telegram order notification failed:", sendError);
  }
}

// ─── Payment confirmed ────────────────────────────────────────────────────────

export async function sendPaymentNotification(params: PaymentNotificationParams): Promise<void> {
  const paidDate = new Date(params.paidAt).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = [
    `✅ *Pembayaran Diterima!*`,
    ``,
    `*No. Pesanan:* \`${params.orderNumber}\``,
    `*Pelanggan:* ${params.customerName}`,
    `*HP:* ${params.customerPhone}`,
    params.paymentMethod ? `*Metode:* ${params.paymentMethod}` : null,
    `*Total:* *${formatIdr(params.total)}*`,
    `*Waktu:* ${paidDate} WIB`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const sendError = await sendTelegramMessage(text);
  const skipped = sendError?.includes("not configured");

  await logNotification({
    type: "payment_confirmed",
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    message: text,
    status: skipped ? "skipped" : sendError ? "failed" : "sent",
    error: skipped ? undefined : sendError ?? undefined,
  });

  if (sendError && !skipped) {
    console.error("Telegram payment notification failed:", sendError);
  }
}
