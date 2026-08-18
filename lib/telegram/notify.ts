import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildPaymentWhatsAppLink } from "@/lib/whatsapp";

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

/**
 * @property shippingAddressPhone - Fallback when customerPhone unavailable.
 *   Populated by pivot webhook (Task 4).
 * @property items - Order line items for WhatsApp message body.
 *   Populated by pivot webhook from ecom_order_items (Task 4).
 */
type PaymentNotificationParams = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddressPhone?: string | null;
  paymentMethod?: string | null;
  total: number;
  paidAt: string; // ISO string
  items?: { productName: string; quantity: number }[];
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
  orderId,
  orderNumber,
  status,
  error,
}: {
  orderId: string;
  orderNumber: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("notification_logs").insert({
      channel: "telegram",
      order_id: orderId,
      order_number: orderNumber,
      status,
      error: error ?? null,
    });
  } catch (err) {
    console.error("Failed to log notification:", err);
  }
}

/**
 * Escape special Markdown characters for Telegram.
 * In MarkdownV2 mode, these chars need escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * We use the legacy Markdown mode which only needs: _ * [ ] ( ) ~ `
 */
function escapeMarkdown(text: string): string {
  // Escape characters that have special meaning in Markdown
  return text.replace(/([_*\[\]()~`])/g, '\\$1');
}

/** Send text to the configured Telegram group. Returns error string on failure, null on success. */
async function sendTelegramMessage(text: string): Promise<string | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadIdRaw = process.env.TELEGRAM_PRODUCTION_THREAD_ID;
  const threadId =
    threadIdRaw && /^\d+$/.test(threadIdRaw) ? Number.parseInt(threadIdRaw, 10) : undefined;

  if (!botToken || !chatId) {
    return "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured";
  }

  // Escape markdown special characters to prevent parsing errors
  const escapedText = escapeMarkdown(text);
  const basePayload = threadId ? { chat_id: chatId, message_thread_id: threadId } : { chat_id: chatId };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...basePayload, text: escapedText, parse_mode: "Markdown" }),
    });

    if (!res.ok) {
      const body = await res.text();
      // If Markdown parsing fails, retry without parse_mode as plain text
      if (body.includes("parse entities") || body.includes("Bad Request")) {
        const plainRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, text }), // unescaped, no parse_mode
        });
        if (!plainRes.ok) {
          const plainBody = await plainRes.text();
          return `Telegram API error ${plainRes.status}: ${plainBody}`;
        }
        return null;
      }
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
    params.shippingCourier === "pickup"
      ? "Ambil Sendiri"
      : params.shippingCourier && params.shippingService
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
    orderId: params.orderId,
    orderNumber: params.orderNumber,
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

  let text = [
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

  // Alert detection: ops convention — paymentMethod prefixed with ⚠️ means
  // manual/alert message, skip wa.me link for those.
  const isAlert = params.paymentMethod?.startsWith("⚠️");
  if (!isAlert) {
    const targetPhone = params.customerPhone || params.shippingAddressPhone || "";
    const waLink = buildPaymentWhatsAppLink({
      phone: targetPhone,
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      orderId: params.orderId,
      items: params.items ?? [],
      total: params.total,
    });
    if (waLink) {
      text += "\n\nWA: " + waLink;
    }
  }

  const sendError = await sendTelegramMessage(text);
  const skipped = sendError?.includes("not configured");

  await logNotification({
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    status: skipped ? "skipped" : sendError ? "failed" : "sent",
    error: skipped ? undefined : sendError ?? undefined,
  });

  if (sendError && !skipped) {
    console.error("Telegram payment notification failed:", sendError);
  }
}

// ─── Jubelio sync success ───────────────────────────────────────────────────────

type JubelioSyncNotificationParams = {
  orderId: string;
  orderNumber: string;
  jubelioSalesorderId: number;
  jubelioInvoiceNo: string | null;
};

export async function sendJubelioSyncNotification(params: JubelioSyncNotificationParams): Promise<void> {
  const jubelioUrl = `https://v2.jubelio.com/sales/transactions/orders/detail/${params.jubelioSalesorderId}`;

  const text = [
    `✅ *Pesanan Tersinkron ke Jubelio*`,
    ``,
    `*No. Pesanan (Web):* \`${params.orderNumber}\``,
    `*No. Pesanan (Jubelio):* SO-${params.jubelioSalesorderId}`,
    params.jubelioInvoiceNo ? `*No. Invoice:* ${params.jubelioInvoiceNo}` : null,
    `*Link:* ${jubelioUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const sendError = await sendTelegramMessage(text);
  const skipped = sendError?.includes("not configured");

  await logNotification({
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    status: skipped ? "skipped" : sendError ? "failed" : "sent",
    error: skipped ? undefined : sendError ?? undefined,
  });

  if (sendError && !skipped) {
    console.error("Telegram Jubelio sync notification failed:", sendError);
  }
}
