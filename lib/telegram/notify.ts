type OrderNotificationParams = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  items: { productName: string; variantDescription: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    address_line: string;
    postal_code?: string | null;
  };
  shippingCourier?: string | null;
  shippingService?: string | null;
};

function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export async function sendOrderNotification(params: OrderNotificationParams): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
    return;
  }

  const itemLines = params.items
    .map((i) => `  • ${i.productName} (${i.variantDescription}) ×${i.quantity} — ${formatIdr(i.unitPrice * i.quantity)}`)
    .join("\n");

  const courier = params.shippingCourier && params.shippingService
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

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Telegram notification failed (${res.status}):`, body);
    }
  } catch (err) {
    // Never let a notification failure break the order flow
    console.error("Telegram notification error:", err);
  }
}
