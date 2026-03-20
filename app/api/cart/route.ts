import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const CartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

// GET /api/cart — fetch logged-in user's cart from Supabase
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("cart_items")
      .select(`
        id,
        quantity,
        variant_id,
        product_variants (
          id, sku, price, ship_weight_grams,
          products (id, name, slug, images, image_url),
          product_variant_option_values (
            product_option_values (value)
          )
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch cart", code: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/cart — add or update a cart item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("cart_items")
      .upsert(
        {
          user_id: user.id,
          variant_id: parsed.data.variantId,
          quantity: parsed.data.quantity,
        },
        { onConflict: "user_id,variant_id" }
      );

    if (error) {
      return NextResponse.json({ error: "Failed to update cart", code: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// DELETE /api/cart — remove a cart item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { variantId } = await request.json();
    if (!variantId) {
      return NextResponse.json({ error: "variantId required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("variant_id", variantId);

    if (error) {
      return NextResponse.json({ error: "Failed to remove item", code: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
