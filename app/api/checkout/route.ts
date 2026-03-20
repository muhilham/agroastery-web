import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createXenditInvoice } from "@/lib/xendit/client";
import { sendOrderNotification } from "@/lib/telegram/notify";

const CheckoutItemSchema = z.object({
  variantId: z.string().uuid(),
  productName: z.string().min(1),
  variantDescription: z.string(),
  unitPrice: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
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
  items: z.array(CheckoutItemSchema).min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(1),
  shippingAddress: ShippingAddressSchema,
  shippingCourier: z.string().optional(),
  shippingService: z.string().optional(),
  shippingCost: z.number().int().nonnegative().default(0),
  shippingEtd: z.string().optional(),
  notes: z.string().optional(),
});

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
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

    // Validate prices server-side — never trust client-sent prices
    const variantIds = data.items.map((i) => i.variantId);
    const { data: dbVariants, error: variantsError } = await admin
      .from("product_variants")
      .select("id, price, ship_weight_grams, stock_quantity, is_active")
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

    // Calculate totals using server-side prices
    const subtotal = data.items.reduce((sum, item) => {
      const dbVariant = variantMap.get(item.variantId)!;
      return sum + dbVariant.price * item.quantity;
    }, 0);
    const total = subtotal + data.shippingCost;

    // Build items with server-side prices (override client-sent unitPrice/shipWeightGrams)
    const verifiedItems = data.items.map((item) => {
      const dbVariant = variantMap.get(item.variantId)!;
      return { ...item, unitPrice: dbVariant.price, shipWeightGrams: dbVariant.ship_weight_grams };
    });

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create ecom_order
    const { data: order, error: orderError } = await admin
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

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order", code: "DB_ERROR" },
        { status: 500 }
      );
    }

    // Create ecom_order_items using server-verified prices
    const orderItems = verifiedItems.map((item) => ({
      order_id: order.id,
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
      // Roll back: delete the order so we don't have an order with no items
      await admin.from("ecom_orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to create order items", code: "DB_ERROR" }, { status: 500 });
    }

    // Create Xendit invoice
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agroastery.com";
    const xenditInvoice = await createXenditInvoice({
      externalId: order.id,
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

    // Update order with Xendit invoice ID
    await admin
      .from("ecom_orders")
      .update({ xendit_invoice_id: xenditInvoice.id })
      .eq("id", order.id);

    // Notify Telegram group (fire-and-forget — never blocks the response)
    sendOrderNotification({
      orderId: order.id,
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
