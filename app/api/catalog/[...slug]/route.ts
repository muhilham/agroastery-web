import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // keep dynamic; this is an API proxy

const ALLOWED = new Set(["categories.json", "products.json"]);
const BASE = process.env.CATALOG_BASE ?? "https://cdn.agroastery.com/produk";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await ctx.params; // ← FIX: await params per Next.js 15
  const path = Array.isArray(slug) ? slug.join("/") : "";

  if (!path || !ALLOWED.has(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = `${BASE}/${path}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Upstream fetch failed", status: res.status },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
