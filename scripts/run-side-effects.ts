import * as fs from "fs";
import * as path from "path";

// Load .env.local manually (dotenv is not installed)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendPaymentNotification } from "@/lib/telegram/notify";
import { createBiteshipDraft } from "@/lib/biteship/createDraft";
import { sendOrderEmail } from "@/lib/resend/sendOrderEmail";
import { createJubelioOrderFromEcom } from "@/lib/jubelio/orders";

/**
 * One-off script to manually run checkout side effects for a paid order.
 * Useful when:
 * - The Pivot webhook couldn't be reached (ngrok offline)
 * - You need to re-run side effects after fixing a bug
 *
 * Usage: npx tsx scripts/run-side-effects.ts
 *
 * ⚠️ Set ORDER_ID below before running.
 */
const ORDER_ID = "SET_ORDER_ID_HERE";

async function main() {
  const supabase = createSupabaseAdminClient();

  const { data: order, error } = await supabase
    .from("ecom_orders")
    .select("id, order_number, customer_name, customer_phone, total, paid_at")
    .eq("id", ORDER_ID)
    .single();

  if (error || !order) {
    console.error("Failed to fetch order:", error);
    process.exit(1);
  }

  const paidAt = order.paid_at ?? new Date().toISOString();

  console.log(`\n🚀 Running side effects for order ${order.order_number} (${ORDER_ID})\n`);

  // 1. Telegram notification
  try {
    await sendPaymentNotification({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      paymentMethod: "QRIS",
      total: order.total,
      paidAt,
    });
    console.log("✅ Telegram notification sent");
  } catch (err) {
    console.error("❌ Telegram failed:", err);
  }

  // 2. Biteship draft
  try {
    await createBiteshipDraft(ORDER_ID);
    console.log("✅ Biteship draft created");
  } catch (err) {
    console.error("❌ Biteship failed:", err);
  }

  // 3. Order email
  try {
    await sendOrderEmail(ORDER_ID);
    console.log("✅ Order email sent");
  } catch (err) {
    console.error("❌ Email failed:", err);
  }

  // 4. Jubelio sync
  try {
    await createJubelioOrderFromEcom(ORDER_ID);
    console.log("✅ Jubelio sync completed");
  } catch (err) {
    console.error("❌ Jubelio failed:", err);
  }

  console.log("\n🏁 Done");
}

main();
