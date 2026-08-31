import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: mockSelect,
    }),
  }),
}));

import { POST } from "./route";

function req(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost/api/orders/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/orders/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ ilike: mockIlike });
    mockIlike.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it("returns orderId when order is found", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "order-uuid-123" },
      error: null,
    });

    const res = await POST(req({
      orderNumber: "AGR-20260831-ABC123",
      email: "budi@example.com",
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orderId).toBe("order-uuid-123");
  });

  it("returns 404 with generic message when order is not found", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(req({
      orderNumber: "AGR-20260831-ABC123",
      email: "budi@example.com",
    }));

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Pesanan tidak ditemukan");
  });

  it("returns 400 for invalid body via Zod", async () => {
    const res = await POST(req({
      orderNumber: "",
      email: "not-an-email",
    }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.issues).toBeDefined();
  });

  it("returns 429 after 10 attempts from the same IP", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const body = { orderNumber: "AGR-20260831-ABC123", email: "budi@example.com" };

    // 10 requests should succeed with 404
    for (let i = 0; i < 10; i++) {
      const res = await POST(req(body, { "x-forwarded-for": "1.2.3.4" }));
      expect(res.status).toBe(404);
    }

    // 11th request should be rate limited
    const res = await POST(req(body, { "x-forwarded-for": "1.2.3.4" }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Terlalu banyak percobaan");
    expect(res.headers.get("Retry-After")).toBe("600");
  });

  it("rate limit is independent per IP", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const body = { orderNumber: "AGR-20260831-ABC123", email: "budi@example.com" };

    // Exhaust limit for IP A
    for (let i = 0; i < 10; i++) {
      await POST(req(body, { "x-forwarded-for": "1.2.3.4" }));
    }

    // IP B should still be allowed
    const resB = await POST(req(body, { "x-forwarded-for": "5.6.7.8" }));
    expect(resB.status).toBe(404);
  });

  it("normalizes order number to uppercase and email to lowercase", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "order-uuid-123" },
      error: null,
    });

    await POST(req({
      orderNumber: "agr-20260831-abc123",
      email: "BUDI@EXAMPLE.COM",
    }));

    expect(mockIlike).toHaveBeenCalledWith("order_number", "AGR-20260831-ABC123");
    expect(mockEq).toHaveBeenCalledWith("customer_email", "budi@example.com");
  });
});
