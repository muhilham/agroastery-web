import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFetch,
  mockInsert,
  mockFrom,
  mockCreateSupabaseAdminClient,
} = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const mockInsert = vi.fn();
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockCreateSupabaseAdminClient = vi.fn(() => ({ from: mockFrom }));

  return { mockFetch, mockInsert, mockFrom, mockCreateSupabaseAdminClient };
});

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: mockCreateSupabaseAdminClient,
}));

vi.mock("@/lib/whatsapp", () => ({
  buildPaymentWhatsAppLink: vi.fn(() => null),
}));

import { sendOrderNotification, sendPaymentNotification } from "./notify";

describe("telegram order notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "tok";
    process.env.TELEGRAM_CHAT_ID = "chat";
    delete process.env.TELEGRAM_PRODUCTION_THREAD_ID;

    mockFetch.mockResolvedValue({ ok: true });
    mockInsert.mockResolvedValue({});
  });

  it("includes message_thread_id when production thread env is configured", async () => {
    process.env.TELEGRAM_PRODUCTION_THREAD_ID = "42";

    await sendOrderNotification({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      customerName: "Budi",
      customerPhone: "08123",
      customerEmail: "budi@example.com",
      items: [
        {
          productName: "Kopi",
          variantDescription: "250g",
          quantity: 1,
          unitPrice: 100000,
        },
      ],
      subtotal: 100000,
      shippingCost: 20000,
      total: 120000,
      shippingAddress: { address_line: "Jl. Sudirman", postal_code: "12345" },
      shippingCourier: "jne",
      shippingService: "REG",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("chat");
    expect(body.message_thread_id).toBe(42);
  });

  it("omits message_thread_id when production thread env is not configured", async () => {
    await sendOrderNotification({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      customerName: "Budi",
      customerPhone: "08123",
      customerEmail: "budi@example.com",
      items: [
        {
          productName: "Kopi",
          variantDescription: "250g",
          quantity: 1,
          unitPrice: 100000,
        },
      ],
      subtotal: 100000,
      shippingCost: 20000,
      total: 120000,
      shippingAddress: { address_line: "Jl. Sudirman", postal_code: "12345" },
      shippingCourier: "jne",
      shippingService: "REG",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.chat_id).toBe("chat");
    expect(body).not.toHaveProperty("message_thread_id");
  });

  it("includes WA link in payment notification for QRIS", async () => {
    const { buildPaymentWhatsAppLink } = await import("@/lib/whatsapp");
    vi.mocked(buildPaymentWhatsAppLink).mockReturnValue("https://wa.me/12345");

    await sendPaymentNotification({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      customerName: "Budi",
      customerPhone: "08123",
      paymentMethod: "QRIS",
      total: 100000,
      paidAt: "2026-07-23T10:00:00Z",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("WA: https://wa.me/12345");
  });

  it("does not skip WA link when paymentMethod starts with ⚠️", async () => {
    const { buildPaymentWhatsAppLink } = await import("@/lib/whatsapp");
    vi.mocked(buildPaymentWhatsAppLink).mockReturnValue("https://wa.me/12345");

    await sendPaymentNotification({
      orderId: "ord-1",
      orderNumber: "AGR-001",
      customerName: "Budi",
      customerPhone: "08123",
      paymentMethod: "⚠️ ALERT",
      total: 100000,
      paidAt: "2026-07-23T10:00:00Z",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("WA: https://wa.me/12345");
  });
});
