import { NextResponse } from "next/server";
import { getProducts } from "@/lib/supabase/queries/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ data: products });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
