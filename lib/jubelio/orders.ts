import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  fetchJubelioItemBySku,
  createJubelioSalesOrder,
  convertJubelioToInvoicePayment,
  fetchJubelioSalesOrderByRefNo,
  type JubelioSalesOrderPayload,
  type JubelioSalesOrderItem,
} from "./client";
import { sendJubelioSyncNotification } from "@/lib/telegram/notify";

// Hardcoded per project convention (AG KEMANG - Packing)
const JUBELIO_LOCATION_ID = -1;
// Source: 524289 = webstore channel in Jubelio
const JUBELIO_SOURCE = 524289;
// Store ID for AGRoastery webstore
const JUBELIO_STORE_ID = "127657";

/**
 * Fetch an e-commerce order + its items from Supabase.
 */
async function getEcomOrderWithItems(orderId: string) {
  const admin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await admin
    .from("ecom_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const { data: items, error: itemsError } = await admin
    .from("ecom_order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) {
    throw new Error(`Failed to fetch order items: ${itemsError.message}`);
  }

  return { order, items: items ?? [] };
}

/**
 * Build a Jubelio Sales Order payload from an e-commerce order.
 */
function buildJubelioPayload(
  order: Record<string, unknown>,
  items: Array<Record<string, unknown>>,
  jubelioItemMap: Map<string, { item_id: number; item_code: string; item_name: string }>
): JubelioSalesOrderPayload {
  const shippingAddress = (order.shipping_address ?? {}) as Record<string, unknown>;

  const jubelioItems: JubelioSalesOrderItem[] = items.map((item) => {
    const sku = item.sku as string;
    const jubelioItem = jubelioItemMap.get(sku);
    if (!jubelioItem) {
      throw new Error(`SKU not found in Jubelio: ${sku}`);
    }

    const qty = (item.quantity as number) ?? 0;
    const price = (item.unit_price as number) ?? 0;
    const amount = price * qty;

    return {
      salesorder_detail_id: 0,
      item_id: jubelioItem.item_id,
      description: `${item.product_name as string} ${item.variant_description as string}`.trim(),
      tax_id: 1, // Default tax ID (adjust if needed)
      price,
      unit: "Pcs",
      qty_in_base: qty,
      disc: 0,
      disc_amount: 0,
      tax_amount: 0,
      amount,
      location_id: JUBELIO_LOCATION_ID,
    };
  });

  const subtotal = (order.subtotal as number) ?? 0;
  const shippingCost = (order.shipping_cost as number) ?? 0;
  const grandTotal = (order.total as number) ?? 0;

  return {
    salesorder_id: 0,
    salesorder_no: "[auto]",
    contact_id: -1, // -1 = generic customer (Pelanggan Umum) in Jubelio
    customer_name: (order.customer_name as string) ?? "Pelanggan Umum",
    transaction_date: new Date().toISOString(),
    sub_total: subtotal,
    total_disc: 0,
    total_tax: 0,
    grand_total: grandTotal,
    location_id: JUBELIO_LOCATION_ID,
    source: JUBELIO_SOURCE,
    add_fee: 0,
    add_disc: 0,
    service_fee: 0,
    items: jubelioItems,
    ref_no: (order.order_number as string) ?? "",
    note: (order.notes as string) ?? undefined,
    shipping_cost: shippingCost,
    shipping_full_name: (shippingAddress.recipient_name as string) ?? (order.customer_name as string) ?? undefined,
    shipping_phone: (shippingAddress.phone as string) ?? (order.customer_phone as string) ?? undefined,
    shipping_address: (shippingAddress.address_line as string) ?? undefined,
    shipping_post_code: (shippingAddress.postal_code as string) ?? undefined,
    shipping_country: "Indonesia",
    is_paid: true,
    payment_method: (order.xendit_payment_method as string) ?? "QRIS",
    store_id: JUBELIO_STORE_ID,
  };
}

/**
 * Create a Jubelio Sales Order + Invoice from an e-commerce order.
 * This function is idempotent — if both jubelio_salesorder_id and jubelio_invoice_no
 * are already set, it skips. If only the SO ID is set (invoice step previously failed),
 * it resumes from the invoice conversion step.
 * All errors are thrown so the caller can decide what to do (log / alert).
 */
export async function createJubelioOrderFromEcom(orderId: string): Promise<void> {
  const admin = createSupabaseAdminClient();

  // Idempotency guard (best-effort, not atomic — see comment below)
  const { data: existing } = await admin
    .from("ecom_orders")
    .select("jubelio_salesorder_id, jubelio_invoice_no, order_number")
    .eq("id", orderId)
    .single();

  // NOTE: This read-check-write is not atomic. In the extremely unlikely event that
  // two webhook requests for the same order fire simultaneously, both could pass
  // this guard before either writes the SO ID, resulting in a duplicate Sales Order.
  // Pivot webhooks do not typically retry overlappingly, making the window very small.
  // If duplicates occur, ops must cancel the duplicate in Jubelio dashboard.
  if (existing?.jubelio_salesorder_id && existing?.jubelio_invoice_no) {
    console.log(
      `[Jubelio] Order ${existing.order_number} already synced (SO ${existing.jubelio_salesorder_id}, INV ${existing.jubelio_invoice_no})`
    );
    return;
  }

  let salesorderId: number;

  if (existing?.jubelio_salesorder_id && !existing?.jubelio_invoice_no) {
    // Previous run created SO but failed on invoice conversion — resume from there.
    salesorderId = existing.jubelio_salesorder_id;
  } else {
    // Full flow: fetch order, build payload, create SO
    const { order, items } = await getEcomOrderWithItems(orderId);

    if (items.length === 0) {
      throw new Error("No items in order");
    }

    // Lookup each SKU in Jubelio (parallelized)
    const skuLookups = await Promise.all(
      items.map(async (item) => {
        const sku = item.sku as string | null;
        if (!sku) {
          throw new Error(`Order item missing SKU: ${item.id}`);
        }

        const jubelioItem = await fetchJubelioItemBySku(sku);
        if (!jubelioItem) {
          throw new Error(
            `SKU not found in Jubelio: ${sku}. ` +
            `If it is a test product, add the SKU to UNSYNCABLE_SKUS in lib/jubelio/client.ts.`
          );
        }

        return { sku, jubelioItem };
      })
    );

    const jubelioItemMap = new Map(
      skuLookups.map(({ sku, jubelioItem }) => [sku, jubelioItem])
    );

    // Build payload
    const payload = buildJubelioPayload(order, items, jubelioItemMap);

    // Create Sales Order (with recovery for race-condition duplicates)
    try {
      salesorderId = await createJubelioSalesOrder(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes("Pesanan sudah dipakai") ||
        message.includes("sudah dipakai di transaksi lain")
      ) {
        console.warn(
          `[Jubelio] SO creation failed due to duplicate ref_no for ${order.order_number}, searching for existing SO...`
        );
        const existingSo = await fetchJubelioSalesOrderByRefNo(
          order.order_number as string
        );
        if (existingSo) {
          console.log(
            `[Jubelio] Found existing SO ${existingSo.salesorder_id} for ${order.order_number}, recovering...`
          );
          salesorderId = existingSo.salesorder_id;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // Persist SO ID immediately (before invoice conversion) to prevent duplicate SOs on retry
    const { error: updateError } = await admin
      .from("ecom_orders")
      .update({ jubelio_salesorder_id: salesorderId })
      .eq("id", orderId);

    if (updateError) {
      throw new Error(
        `Jubelio SO created (${salesorderId}) but failed to persist on ecom_orders: ${updateError.message}`
      );
    }
  }

  // Convert to Invoice + Payment
  const invoiceNo = await convertJubelioToInvoicePayment(salesorderId);

  // Persist invoice number so future retries know both steps succeeded
  const { error: invoiceUpdateError } = await admin
    .from("ecom_orders")
    .update({ jubelio_invoice_no: invoiceNo })
    .eq("id", orderId);

  if (invoiceUpdateError) {
    throw new Error(
      `Jubelio invoice created (${invoiceNo}) but failed to persist on ecom_orders: ${invoiceUpdateError.message}`
    );
  }

  console.log(`[Jubelio] Order ${existing?.order_number ?? orderId} synced (SO ${salesorderId}, INV ${invoiceNo})`);

  // Notify Telegram with Jubelio link
  sendJubelioSyncNotification({
    orderId,
    orderNumber: existing?.order_number ?? orderId,
    jubelioSalesorderId: salesorderId,
    jubelioInvoiceNo: invoiceNo,
  }).catch((err) => {
    console.error("[Jubelio] Failed to send Telegram sync notification:", err);
  });
}
