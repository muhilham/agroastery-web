import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createXenditInvoice } from "@/lib/xendit/client";
import { sendOrderNotification } from "@/lib/telegram/notify";

const CheckoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
  shipWeightGrams: z.number().int().positive(),
});

const ShippingAddressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(1),
  addressLine: z.string().min(1),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1).max(50),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(1),
  shippingAddress: ShippingAddressSchema,
  shippingCourier: z.string().optional(),
  shippingService: z.string().optional(),
  shippingCost: z.number().int().nonnegative().default(0),
  shippingEtd: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const MAX_ORDER_NUMBER_RETRIES = 3;

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AGR-${date}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "VALIDATION_ERROR", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const admin = createSupabaseAdminClient();

    // Get current user (optional — guest checkout supported)
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Guest checkout — no auth
    }

    // Validate prices and stock server-side — never trust client-sent prices
    const variantIds = data.items.map((i) => i.variantId);
    const { data: dbVariants, error: variantsError } = await admin
      .from("product_variants")
      .select("id, product_id, sku, price, ship_weight_grams, stock_quantity, is_active")
      .in("id", variantIds);

    if (variantsError || !dbVariants) {
      return NextResponse.json({ error: "Failed to validate products", code: "DB_ERROR" }, { status: 500 });
    }

    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    // Ensure every requested variant exists, is active, and has stock
    for (const item of data.items) {
      const dbVariant = variantMap.get(item.variantId);
      if (!dbVariant || !dbVariant.is_active) {
        return NextResponse.json({ error: `Produk tidak tersedia`, code: "VARIANT_UNAVAILABLE" }, { status: 400 });
      }
      if (dbVariant.stock_quantity < item.quantity) {
        return NextResponse.json({ error: `Stok tidak cukup`, code: "INSUFFICIENT_STOCK" }, { status: 400 });
      }
    }

    // Fetch product names from DB to avoid trusting client-sent names
    const productIds = [...new Set(dbVariants.map((v) => v.product_id))];
    const { data: dbProducts } = await admin
      .from("products")
      .select("id, name")
      .in("id", productIds);
    const productMap = new Map((dbProducts ?? []).map((p) => [p.id, p.name as string]));

    // Build variant description from DB option values
    const { data: dbOptionValues } = await admin
      .from("product_variant_option_values")
      .select("variant_id, product_option_values(value)")
      .in("variant_id", variantIds);
    const variantDescriptionMap = new Map<string, string>();
    if (dbOptionValues) {
      const grouped = new Map<string, string[]>();
      for (const row of dbOptionValues) {
        const vals = grouped.get(row.variant_id as string) ?? [];
        const optVal = row.product_option_values as unknown as { value: string } | null;
        if (optVal?.value) vals.push(optVal.value);
        grouped.set(row.variant_id as string, vals);
      }
      for (const [vid, vals] of grouped) {
        variantDescriptionMap.set(vid, vals.join(", "));
      }
    }

    // Calculate totals using server-side prices
    const subtotal = data.items.reduce((sum, item) => {
      const dbVariant = variantMap.get(item.variantId)!;
      return sum + dbVariant.price * item.quantity;
    }, 0);

    // Server-side shipping cost verification: re-calculate total weight and validate
    // that client-sent shipping cost is non-negative (Biteship re-verification would
    // require caching the rate quote; for now we validate the cost is reasonable)
    const totalShipWeight = data.items.reduce((sum, item) => {
      const dbVariant = variantMap.get(item.variantId)!;
      return sum + dbVariant.ship_weight_grams * item.quantity;
    }, 0);

    // Reject if shipping cost is 0 but items need shipping and a courier is specified
    if (data.shippingCost === 0 && data.shippingCourier && totalShipWeight > 0) {
      return NextResponse.json(
        { error: "Ongkos kirim tidak valid", code: "INVALID_SHIPPING_COST" },
        { status: 400 }
      );
    }

    const total = subtotal + data.shippingCost;

    // Build items with server-side prices and names
    const verifiedItems = data.items.map((item) => {
      const dbVariant = variantMap.get(item.variantId)!;
      const productName = productMap.get(dbVariant.product_id as string) ?? "Unknown Product";
      const variantDescription = variantDescriptionMap.get(item.variantId) ?? "";
      return {
        variantId: item.variantId,
        productName,
        variantDescription,
        unitPrice: dbVariant.price as number,
        quantity: item.quantity,
        shipWeightGrams: dbVariant.ship_weight_grams as number,
      };
    });

    // Atomically decrement stock for all variants
    for (const item of data.items) {
      const { data: updated, error: stockError } = await admin.rpc("ecom_decrement_stock", {
        p_variant_id: item.variantId,
        p_quantity: item.quantity,
      });

      // If the RPC doesn't exist yet, fall back to a conditional update
      if (stockError?.code === "42883") {
        // Function not found — use conditional UPDATE as fallback
        const { data: updateResult, error: updateError } = await admin
          .from("product_variants")
          .update({ stock_quantity: variantMap.get(item.variantId)!.stock_quantity - item.quantity })
          .eq("id", item.variantId)
          .gte("stock_quantity", item.quantity)
          .select("id")
          .single();

        if (updateError || !updateResult) {
          return NextResponse.json(
            { error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" },
            { status: 409 }
          );
        }
      } else if (stockError) {
        return NextResponse.json(
          { error: "Gagal memproses stok", code: "STOCK_ERROR" },
          { status: 500 }
        );
      } else if (updated === false) {
        // RPC returned false — insufficient stock
        return NextResponse.json(
          { error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" },
          { status: 409 }
        );
      }
    }

    // Generate order number with retry for uniqueness
    let orderNumber = "";
    let order: Record<string, unknown> | null = null;
    let orderError: unknown = null;

    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_RETRIES; attempt++) {
      orderNumber = generateOrderNumber();

      const result = await admin
        .from("ecom_orders")
        .insert({
          user_id: userId,
          order_number: orderNumber,
          status: "pending_payment",
          customer_name: data.customerName,
          customer_email: data.customerEmail || null,
          customer_phone: data.customerPhone,
          shipping_address: {
            recipient_name: data.shippingAddress.recipientName,
            phone: data.shippingAddress.phone,
            address_line: data.shippingAddress.addressLine,
            postal_code: data.shippingAddress.postalCode ?? null,
            latitude: data.shippingAddress.latitude ?? null,
            longitude: data.shippingAddress.longitude ?? null,
          },
          shipping_courier: data.shippingCourier ?? null,
          shipping_service: data.shippingService ?? null,
          shipping_cost: data.shippingCost,
          shipping_etd: data.shippingEtd ?? null,
          payment_status: "unpaid",
          subtotal,
          total,
          notes: data.notes ?? null,
        })
        .select()
        .single();

      if (!result.error) {
        order = result.data;
        break;
      }

      // If it's a unique constraint violation on order_number, retry
      if (result.error.code === "23505" && result.error.message?.includes("order_number")) {
        orderError = result.error;
        continue;
      }

      // Other error — don't retry
      console.error("Order creation error:", result.error);
      // Restore stock on failure
      await restoreStock(admin, data.items);
      return NextResponse.json(
        { error: "Failed to create order", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    if (!order) {
      console.error("Order number collision after retries:", orderError);
      await restoreStock(admin, data.items);
      return NextResponse.json(
        { error: "Failed to create order", code: "ORDER_NUMBER_COLLISION" },
        { status: 500 }
      );
    }

    // Create ecom_order_items using server-verified prices and names
    const orderItems = verifiedItems.map((item) => ({
      order_id: order!.id as string,
      variant_id: item.variantId,
      product_name: item.productName,
      variant_description: item.variantDescription,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.unitPrice * item.quantity,
      ship_weight_grams: item.shipWeightGrams,
    }));

    const { error: itemsError } = await admin
      .from("ecom_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      await admin.from("ecom_orders").delete().eq("id", order.id as string);
      await restoreStock(admin, data.items);
      return NextResponse.json({ error: "Failed to create order items", code: "DB_ERROR" }, { status: 500 });
    }

    // Create Xendit invoice
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    let xenditInvoice;
    try {
      xenditInvoice = await createXenditInvoice({
        externalId: order.id as string,
        amount: total,
        payerEmail: data.customerEmail || undefined,
        description: `Pesanan ${orderNumber} - Agroastery`,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        successRedirectUrl: `${appUrl}/checkout/success?order=${order.id}`,
        failureRedirectUrl: `${appUrl}/checkout?error=payment_failed`,
        items: verifiedItems.map((item) => ({
          name: `${item.productName} - ${item.variantDescription}`,
          quantity: item.quantity,
          price: item.unitPrice,
          category: "Coffee",
        })),
        invoiceDuration: 86400, // 24 hours
      });
    } catch (xenditError) {
      console.error("Xendit invoice creation error:", xenditError);
      // Clean up order and restore stock
      await admin.from("ecom_order_items").delete().eq("order_id", order.id as string);
      await admin.from("ecom_orders").delete().eq("id", order.id as string);
      await restoreStock(admin, data.items);
      return NextResponse.json(
        { error: "Gagal membuat invoice pembayaran", code: "PAYMENT_ERROR" },
        { status: 500 }
      );
    }

    // Update order with Xendit invoice ID
    await admin
      .from("ecom_orders")
      .update({ xendit_invoice_id: xenditInvoice.id })
      .eq("id", order.id as string);

    // Notify Telegram group (fire-and-forget — never blocks the response)
    sendOrderNotification({
      orderId: order.id as string,
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      items: verifiedItems.map((item) => ({
        productName: item.productName,
        variantDescription: item.variantDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal,
      shippingCost: data.shippingCost,
      total,
      shippingAddress: {
        address_line: data.shippingAddress.addressLine,
        postal_code: data.shippingAddress.postalCode ?? null,
      },
      shippingCourier: data.shippingCourier ?? null,
      shippingService: data.shippingService ?? null,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      invoiceUrl: xenditInvoice.invoice_url,
      invoiceId: xenditInvoice.id,
      total,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/** Restore stock for all items (best-effort, used during rollback) */
async function restoreStock(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  items: { variantId: string; quantity: number }[]
) {
  for (const item of items) {
    try {
      // Use raw SQL via rpc if available, otherwise increment manually
      const { data: current } = await admin
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variantId)
        .single();
      if (current) {
        await admin
          .from("product_variants")
          .update({ stock_quantity: (current.stock_quantity as number) + item.quantity })
          .eq("id", item.variantId);
      }
    } catch (e) {
      console.error("Failed to restore stock for variant:", item.variantId, e);
    }
  }
}
