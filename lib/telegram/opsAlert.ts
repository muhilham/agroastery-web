import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpsAlertParams = {
  orderId: string;
  orderNumber: string;
  issue: string;
  action?: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeMarkdown(text: string): string {
  return text.replace(/([_\*\[\]()~`])/g, "\\$1");
}

async function sendTelegramMessage(text: string): Promise<string | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadIdRaw = process.env.TELEGRAM_PRODUCTION_THREAD_ID;
  const threadId =
    threadIdRaw && /^\d+$/.test(threadIdRaw) ? Number.parseInt(threadIdRaw, 10) : undefined;

  if (!botToken || !chatId) {
    return "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured";
  }

  const escapedText = escapeMarkdown(text);
  const basePayload = threadId
    ? { chat_id: chatId, message_thread_id: threadId }
    : { chat_id: chatId };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...basePayload, text: escapedText, parse_mode: "Markdown" }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (body.includes("parse entities") || body.includes("Bad Request")) {
        const plainRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...basePayload, text }),
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

async function logOpsNotification({
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
      channel: "ops",
      order_id: orderId,
      order_number: orderNumber,
      status,
      error: error ?? null,
    });
  } catch (err) {
    console.error("Failed to log ops notification:", err);
  }
}

// ─── Ops Alert ────────────────────────────────────────────────────────────────

export async function sendOpsAlert(params: OpsAlertParams): Promise<void> {
  const lines = [
    `⚠️ *Ops Alert*`,
    ``,
    `*No\. Pesanan:* \`${params.orderNumber}\``,
    `*Masalah:* ${params.issue}`,
    params.action ? `*Tindakan:* ${params.action}` : null,
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");

  const sendError = await sendTelegramMessage(text);
  const skipped = sendError?.includes("not configured");

  await logOpsNotification({
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    status: skipped ? "skipped" : sendError ? "failed" : "sent",
    error: skipped ? undefined : sendError ?? undefined,
  });

  if (sendError && !skipped) {
    console.error("Telegram ops alert failed:", sendError);
  }
}
