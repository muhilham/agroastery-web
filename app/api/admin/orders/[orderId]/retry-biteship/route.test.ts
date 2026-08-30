import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockRetry = vi.fn();

vi.mock("@/lib/biteship/retryDraft", () => ({
  retryBiteshipDraft: (...args: unknown[]) => mockRetry(...args),
}));

import { POST } from "./route";

function makeReq(orderId: string, adminKey?: string): { req: NextRequest; params: Promise<{ orderId: string }> } {
  const headers = new Headers();
  if (adminKey) headers.set("x-admin-key", adminKey);
  const req = new NextRequest(`http://localhost/api/admin/orders/${orderId}/retry-biteship`, {
    method: "POST",
    headers,
  });
  return { req, params: Promise.resolve({ orderId }) };
}

describe("POST /api/admin/orders/{orderId}/retry-biteship", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SECRET = "secret-123";
  });

  it("rejects missing admin key", async () => {
    const { req, params } = makeReq("11111111-1111-1111-1111-111111111111");
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("rejects invalid admin key", async () => {
    const { req, params } = makeReq("11111111-1111-1111-1111-111111111111", "wrong");
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 500 when retry throws", async () => {
    mockRetry.mockRejectedValue(new Error("Biteship down"));
    const { req, params } = makeReq("11111111-1111-1111-1111-111111111111", "secret-123");
    const res = await POST(req, { params });
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe("Biteship down");
  });

  it("returns success when retry succeeds", async () => {
    mockRetry.mockResolvedValue(undefined);
    const { req, params } = makeReq("11111111-1111-1111-1111-111111111111", "secret-123");
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toBe("Biteship draft retry initiated");
    expect(mockRetry).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
  });
});
