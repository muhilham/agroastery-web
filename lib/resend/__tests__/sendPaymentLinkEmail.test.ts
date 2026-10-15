import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
const single = vi.fn();
vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send } })) }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ single }) }) }) }),
}));

describe("sendPaymentLinkEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://agroastery.com");
    single.mockResolvedValue({ data: { id: "order-1", order_number: "AGR-1", total: 150000, customer_email: "budi@example.com" }, error: null });
    send.mockResolvedValue({ error: null });
  });

  it("sends a payment link to the order customer", async () => {
    const { sendPaymentLinkEmail } = await import("../sendPaymentLinkEmail");
    await sendPaymentLinkEmail("order-1");
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "budi@example.com", subject: expect.stringContaining("AGR-1") }));
    const react = send.mock.calls[0][0].react;
    expect(react.props.paymentUrl).toContain("/checkout/payment/order-1");
  });
});
