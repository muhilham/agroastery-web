import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTNAMES = ["bankneo.co.id", "sit-marketing-img.bankneo.co.id", "marketing-img.bankneo.co.id"];

function isAllowed(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr);
    return ALLOWED_HOSTNAMES.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowed(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/png";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
