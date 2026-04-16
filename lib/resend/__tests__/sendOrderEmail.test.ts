import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEmailSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockEmailSend },
  })),
}));

const mockSingle = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

const baseOrder = {
  id: "order-uuid",
  order_number: "AGR-20260415-X7K2M",
  customer_email: "budi@gmail.com",
  customer_name: "Budi Santoso",
  customer_phone: "081234567890",
  created_at: "2026-04-15T14:32:00Z",
  shipping_address: {
    recipient_name: "Budi Santoso",
    phone: "081234567890",
    address_line: "Jl. Kemang Barat No. 7",
    postal_code: "12730",
  },
  shipping_courier: "jne",
  shipping_service: "REG",
  shipping_etd: "2-3 hari",
  shipping_cost: 30000,
  subtotal: 215000,
  total: 245000,
  ecom_order_items: [
    {
      product_name: "Agroastery Single Origin",
      variant_description: "250g, Medium Roast",
      quantity: 1,
      unit_price: 85000,
      subtotal: 85000,
    },
  ],
};

describe("sendOrderEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://agroastery.com");
    mockEmailSend.mockResolvedValue({ data: { id: "email-id" }, error: null });
  });

  it("returns early without calling Resend when customer_email is null", async () => {
    mockSingle.mockResolvedValue({
      data: { ...baseOrder, customer_email: null },
      error: null,
    });
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await sendOrderEmail("order-uuid");
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("calls Resend with correct from address and subject", async () => {
    mockSingle.mockResolvedValue({ data: baseOrder, error: null });
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await sendOrderEmail("order-uuid");
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Agroastery <order@agroastery.com>",
        to: "budi@gmail.com",
        subject: "Order AGR-20260415-X7K2M confirmed — Agroastery",
      })
    );
  });

  it("does not throw when Resend.send rejects", async () => {
    mockSingle.mockResolvedValue({ data: baseOrder, error: null });
    mockEmailSend.mockRejectedValue(new Error("Resend unavailable"));
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await expect(sendOrderEmail("order-uuid")).resolves.toBeUndefined();
  });

  it("does not throw when order is not found in DB", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await expect(sendOrderEmail("bad-uuid")).resolves.toBeUndefined();
  });

  it("skips send if email_sent_at is already set", async () => {
    vi.resetModules();
    const mockSend = vi.fn().mockResolvedValue({ error: null });
    vi.doMock("resend", () => ({
      Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseAdminClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: "order-uuid",
                    order_number: "AGR-001",
                    created_at: new Date().toISOString(),
                    customer_name: "Test",
                    customer_email: "test@example.com",
                    email_sent_at: "2026-04-15T10:00:00Z", // already sent
                    ecom_order_items: [],
                    subtotal: 100000,
                    shipping_cost: 0,
                    shipping_courier: null,
                    shipping_service: null,
                    shipping_etd: null,
                    total: 100000,
                    shipping_address: {
                      recipient_name: "Test",
                      phone: "081",
                      address_line: "Jl Test",
                    },
                  },
                  error: null,
                }),
            }),
          }),
        }),
      }),
    }));
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await sendOrderEmail("order-uuid");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("updates email_sent_at after successful send", async () => {
    vi.resetModules();
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    vi.doMock("resend", () => ({
      Resend: vi.fn().mockImplementation(() => ({
        emails: { send: vi.fn().mockResolvedValue({ error: null }) },
      })),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseAdminClient: () => ({
        from: (table: string) => {
          if (table === "ecom_orders") {
            return {
              select: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: "order-uuid",
                        order_number: "AGR-001",
                        created_at: new Date().toISOString(),
                        customer_name: "Test",
                        customer_email: "test@example.com",
                        email_sent_at: null, // not sent yet
                        ecom_order_items: [],
                        subtotal: 100000,
                        shipping_cost: 0,
                        shipping_courier: null,
                        shipping_service: null,
                        shipping_etd: null,
                        total: 100000,
                        shipping_address: {
                          recipient_name: "Test",
                          phone: "081",
                          address_line: "Jl Test",
                        },
                      },
                      error: null,
                    }),
                }),
              }),
              update: mockUpdate,
            };
          }
          return {
            select: () => ({
              eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
            }),
          };
        },
      }),
    }));
    const { sendOrderEmail } = await import("../sendOrderEmail");
    await sendOrderEmail("order-uuid");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ email_sent_at: expect.any(String) })
    );
  });
});
