import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { createQrisPaymentSession } from "@/lib/pivot/client";
import { sendOrderNotification } from "@/lib/telegram/notify";
import { getActiveGlobalDiscounts, getActiveProductDiscounts } from "@/lib/supabase/queries/discounts";
import { calculateDiscountedPrice } from "@/lib/utils/discount";
import { isShippingCostInvalid } from "@/lib/checkout/validateShippingCost";
import { buildQuoteItems, CHECKOUT_COURIERS_POSTAL, CHECKOUT_COURIERS_GEO } from "@/lib/checkout/shippingQuote";
import { fetchBiteshipRates, findRateMatch } from "@/lib/biteship/rates";
import { validateStockAvailability, decrementStock } from "@/lib/checkout/stockValidation";
import { CheckoutSchema } from "./checkoutSchema";

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

    // Ensure profile row exists for logged-in users (guard against missing DB trigger)
    if (userId) {
      await admin.from("profiles").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
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

    const stockCheck = validateStockAvailability(data.items, variantMap);
    if (!stockCheck.valid) {
      return NextResponse.json({ error: stockCheck.error, code: stockCheck.code }, { status: 400 });
    }

    // Fetch product names and discount eligibility from DB to avoid trusting client-sent names
    const productIds = [...new Set(dbVariants.map((v) => v.product_id).filter((id): id is string => id !== null))];
    const [{ data: dbProducts }, { data: dbOptionValues }, globalDiscounts, allProductDiscounts] = await Promise.all([
      admin
        .from("products")
        .select("id, name, is_global, is_global_discountable")
        .in("id", productIds),
      admin
        .from("product_variant_option_values")
        .select("variant_id, product_option_values(value)")
        .in("variant_id", variantIds),
      getActiveGlobalDiscounts(),
      getActiveProductDiscounts(),
    ]);
    const productMap = new Map((dbProducts ?? []).map((p) => [p.id, p.name as string]));
    const productDiscountableMap = new Map((dbProducts ?? []).map((p) => [p.id, p.is_global_discountable ?? p.is_global ?? false]));

    // Build variant description from DB option values
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

    // Compute discounted prices once per item, reuse for subtotal and verifiedItems
    interface ItemWithDiscount {
      item: typeof data.items[number];
      dbVariant: typeof dbVariants[number];
      productName: string;
      variantDescription: string;
      discountedPrice: number;
      shipWeightGrams: number;
      sku: string | null;
    }

    const itemsWithDiscounts: ItemWithDiscount[] = data.items.map((item) => {
      const dbVariant = variantMap.get(item.variantId)!;
      const productId = dbVariant.product_id as string;
      const productName = productMap.get(productId) ?? "Unknown Product";
      const variantDescription = variantDescriptionMap.get(item.variantId) ?? "";
      const isDiscountable = productDiscountableMap.get(productId) ?? false;

      const applicableProductDiscounts = allProductDiscounts.filter(
        (d) => d.product_id === productId
      );
      const applicableGlobalDiscounts = isDiscountable ? globalDiscounts : [];

      const { discountedPrice } = calculateDiscountedPrice(
        dbVariant.price as number,
        applicableProductDiscounts,
        applicableGlobalDiscounts
      );

      return {
        item,
        dbVariant,
        productName,
        variantDescription,
        discountedPrice,
        shipWeightGrams: dbVariant.ship_weight_grams as number,
        sku: dbVariant.sku,
      };
    });

    // Calculate subtotal from pre-computed discounted prices
    const subtotal = itemsWithDiscounts.reduce((sum, { discountedPrice, item }) => {
      return sum + discountedPrice * item.quantity;
    }, 0);

    // Server-side shipping cost verification: the client-submitted cost must
    // match a FRESH Biteship quote for the chosen courier+service (issue #138).
    // Without a re-quote, any tampered/changed-in-between price persisted to
    // ecom_orders. Mirrors the agr-client-portal findRateMatch pattern.
    const totalShipWeight = itemsWithDiscounts.reduce((sum, { shipWeightGrams, item }) => {
      return sum + shipWeightGrams * item.quantity;
    }, 0);

    // Reject if shipping cost is 0 but items need shipping and a courier is specified.
    // Pickup orders are exempt — see isShippingCostInvalid.
    if (
      isShippingCostInvalid({
        fulfillmentMethod: data.fulfillmentMethod,
        shippingCost: data.shippingCost,
        shippingCourier: data.shippingCourier,
        totalShipWeight,
      })
    ) {
      return NextResponse.json(
        { error: "Ongkos kirim tidak valid", code: "INVALID_SHIPPING_COST" },
        { status: 400 }
      );
    }

    let shippingCost = data.shippingCost;

    const isBiteshipDelivery =
      data.fulfillmentMethod === "delivery" &&
      Boolean(data.shippingCourier) &&
      data.shippingCourier !== "pickup" &&
      Boolean(data.shippingService);

    if (isBiteshipDelivery) {
      const hasGeo =
        typeof data.shippingAddress.latitude === "number" &&
        Number.isFinite(data.shippingAddress.latitude) &&
        typeof data.shippingAddress.longitude === "number" &&
        Number.isFinite(data.shippingAddress.longitude);
      const destPostal = Number(data.shippingAddress.postalCode);
      const hasPostal =
        data.shippingAddress.postalCode !== undefined && Number.isFinite(destPostal);

      if (!hasGeo && !hasPostal) {
        return NextResponse.json(
          { error: "Alamat pengiriman membutuhkan kode pos atau koordinat", code: "MISSING_DESTINATION" },
          { status: 400 }
        );
      }

      // Rebuild the quote payload from SERVER-VERIFIED data (DB weights),
      // identical builder + courier set to the client quote path.
      const quoteItems = buildQuoteItems(
        itemsWithDiscounts.map(({ productName, discountedPrice, shipWeightGrams, item }) => ({
          name: productName,
          unitPrice: discountedPrice,
          weightGramsPerUnit: shipWeightGrams,
          quantity: item.quantity,
        }))
      );
      const originPostal = Number(
        process.env.ORIGIN_POSTAL_CODE ?? process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE ?? "12440"
      );

      let pricing;
      try {
        pricing = await fetchBiteshipRates({
          originPostalCode: originPostal,
          ...(hasGeo
            ? {
                destinationLatitude: data.shippingAddress.latitude as number,
                destinationLongitude: data.shippingAddress.longitude as number,
              }
            : { destinationPostalCode: destPostal }),
          couriers: hasGeo ? CHECKOUT_COURIERS_GEO : CHECKOUT_COURIERS_POSTAL,
          items: quoteItems,
        });
      } catch (err) {
        console.error("[checkout] Biteship re-quote failed:", err);
        return NextResponse.json(
          { error: "Layanan pengiriman tidak tersedia saat ini", code: "SHIPPING_SERVICE_UNAVAILABLE" },
          { status: 503 }
        );
      }

      const match = findRateMatch(pricing, data.shippingCourier!, data.shippingService!);
      if (!match) {
        return NextResponse.json(
          { error: "Kurir tidak lagi tersedia untuk tujuan ini", code: "SHIPPING_RATE_UNAVAILABLE" },
          { status: 400 }
        );
      }
      if (match.price !== data.shippingCost) {
        // Rate drifted between quote and submit — surface the fresh price so
        // the client can refresh the selector and the buyer confirms it.
        return NextResponse.json(
          {
            error: "Ongkos kirim berubah, silakan pilih ulang",
            code: "SHIPPING_RATE_STALE",
            latestCost: match.price,
          },
          { status: 409 }
        );
      }
      shippingCost = match.price;
    }

    // Idempotency: if this key was already used, return the existing order (no double-deduction)
    if (data.idempotencyKey) {
      const { data: existingOrder } = await admin
        .from("ecom_orders")
        .select("id, order_number, total")
        .eq("idempotency_key", data.idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          total: existingOrder.total,
        });
      }
    }

    const total = subtotal + shippingCost;

    // Build verified items from pre-computed discounted prices
    const verifiedItems = itemsWithDiscounts.map(({ item, productName, variantDescription, discountedPrice, shipWeightGrams, sku }) => ({
      variantId: item.variantId,
      productName,
      variantDescription,
      unitPrice: discountedPrice,
      quantity: item.quantity,
      shipWeightGrams,
      sku,
    }));

    const decrementResult = await decrementStock(admin, data.items);
    if (!decrementResult.success) {
      console.error("Stock decrement error:", decrementResult.error);
      return NextResponse.json(
        { error: "Stok tidak cukup", code: "INSUFFICIENT_STOCK" },
        { status: 409 }
      );
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
            hours: data.shippingAddress.hours ?? null,
          },
          shipping_courier: data.shippingCourier ?? null,
          shipping_service: data.shippingService ?? null,
          shipping_cost: shippingCost,
          shipping_etd: data.shippingEtd ?? null,
          payment_status: "unpaid",
          subtotal,
          total,
          notes: data.notes ?? null,
          idempotency_key: data.idempotencyKey ?? null,
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
      sku: item.sku,
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

    // Create Pivot QRIS payment session
    let pivotSession: { paymentSessionId: string; qrUrl: string; qrString: string; qrExpiresAt: string };
    try {
      pivotSession = await createQrisPaymentSession({
        orderId: order.id as string,
        orderNumber,
        total,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone,
      });
    } catch (pivotError) {
      console.error("Pivot session creation error:", pivotError);
      // Keep order + items in DB as audit trail. Mark cancelled, restore stock.
      // Deleting would remove the audit trail; marking cancelled is safer for ops.
      await admin
        .from("ecom_orders")
        .update({ status: "cancelled", payment_status: "expired" })
        .eq("id", order.id as string);
      await restoreStock(admin, data.items);
      return NextResponse.json(
        { error: "Gagal membuat sesi pembayaran", code: "PAYMENT_ERROR" },
        { status: 502 }
      );
    }

    // Store Pivot session data with retry — session ID is in memory so retries are safe.
    let sessionUpdateError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await admin
        .from("ecom_orders")
        .update({
          pivot_payment_session_id: pivotSession.paymentSessionId,
          pivot_qr_url: pivotSession.qrUrl,
          pivot_qr_string: pivotSession.qrString,
          pivot_qr_expires_at: pivotSession.qrExpiresAt,
        })
        .eq("id", order.id as string);
      if (!error) { sessionUpdateError = null; break; }
      sessionUpdateError = error;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 200));
    }
    if (sessionUpdateError) {
      console.error(
        `[checkout] CRITICAL: Failed to store pivot session ${pivotSession.paymentSessionId} ` +
        `for order ${order.id as string}. Ops must manually link. Error:`,
        sessionUpdateError
      );
      return NextResponse.json(
        { error: "Gagal menyimpan sesi pembayaran", code: "SESSION_STORE_ERROR" },
        { status: 502 }
      );
    }

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
      shippingCost,
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

/** Restore stock for all items atomically (best-effort, used during rollback) */
async function restoreStock(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  items: { variantId: string; quantity: number }[]
) {
  for (const item of items) {
    try {
      await admin.rpc("ecom_restore_stock", {
        p_variant_id: item.variantId,
        p_quantity: item.quantity,
      });
    } catch (e) {
      console.error("Failed to restore stock for variant:", item.variantId, e);
    }
  }
}
