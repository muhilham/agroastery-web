/**
 * #226 P1b — "Lanjut Bayar" CTA conditional rendering on the three order
 * surfaces (/orders list, /orders/[id] detail, /track/[orderId]).
 *
 * Pages are rendered directly (they're async server components) with the
 * Supabase client mocked per-state; chrome (Navigation/Footer) is stubbed.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/components/navigation", () => ({ default: () => null }));
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }));
vi.mock("@/app/(root)/track/[orderId]/TrackingTimeline", () => ({ TrackingTimeline: () => null }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom })),
}));

const ORDER_ID = "bbbbbbbb-1111-1111-1111-111111111111";

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    order_number: "AGR-20260903-TEST",
    // Real production shape (verified against live ecom_orders):
    // status='pending_payment' + payment_status='unpaid' for a fresh order;
    // the payment_status column is only ever unpaid/paid/expired/refunded.
    status: "pending_payment",
    payment_status: "unpaid",
    total: 185000,
    subtotal: 150000,
    shipping_cost: 35000,
    created_at: "2026-09-03T10:00:00Z",
    shipping_address: null,
    shipping_courier: null,
    tracking_number: null,
    biteship_order_id: null,
    payment_method: null,
    paid_at: null,
    user_id: null,
    ecom_order_items: [],
    ...overrides,
  };
}

/** Chainable builder matching the supabase-js select/eq/order/single shape.
 *  Thenable like the real QueryBuilder: the orders LIST awaits the terminal
 *  order() call directly (no .single()), so every link must resolve to
 *  { data, error }. */
function chainFor(rows: unknown, single = false) {
  const result = Promise.resolve({ data: rows, error: null });
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "in", "not"]) chain[m] = vi.fn(() => chain);
  chain.single = vi.fn(() => result);
  chain.maybeSingle = vi.fn(() => result);
  chain.then = result.then.bind(result);
  return chain;
}

async function renderOrdersList(overrides: Record<string, unknown> = {}) {
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mockFrom.mockReturnValue(
    chainFor([{ ...makeOrder(overrides),
      // list select omits nested items
    }])
  );
  const OrdersPage = (await import("@/app/(root)/orders/page")).default;
  return render(await OrdersPage());
}

async function renderOrderDetail(overrides: Record<string, unknown> = {}) {
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mockFrom.mockImplementation((table: string) =>
    chainFor(table === "ecom_orders" ? makeOrder(overrides) : [], table === "ecom_orders")
  );
  const DetailPage = (await import("@/app/(root)/orders/[id]/page")).default;
  return render(await DetailPage({ params: Promise.resolve({ id: ORDER_ID }) }));
}

async function renderTrack(overrides: Record<string, unknown> = {}) {
  mockFrom.mockReturnValue(chainFor(makeOrder(overrides), true));
  const TrackPage = (await import("@/app/(root)/track/[orderId]/page")).default;
  return render(await TrackPage({ params: Promise.resolve({ orderId: ORDER_ID }) }));
}

describe("/orders list CTA (#226 P1b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockGetUser.mockReset();
  });

  it("shows Lanjut Bayar for status=pending_payment + payment_status=unpaid", async () => {
    await renderOrdersList({ status: "pending_payment", payment_status: "unpaid" });
    const cta = screen.getByTestId("lanjut-bayar-AGR-20260903-TEST");
    expect(cta.getAttribute("href")).toBe(`/checkout/payment/${ORDER_ID}`);
  });

  it("hides the CTA for paid rows", async () => {
    await renderOrdersList({ status: "paid", payment_status: "paid" });
    expect(screen.queryByTestId("lanjut-bayar-AGR-20260903-TEST")).toBeNull();
  });

  it("hides the CTA for expired rows", async () => {
    await renderOrdersList({ status: "cancelled", payment_status: "expired" });
    expect(screen.queryByTestId("lanjut-bayar-AGR-20260903-TEST")).toBeNull();
  });

  it("hides the CTA for cancelled+unpaid rows (real prod shape) — paying a cancelled order 410s", async () => {
    // Live data has exactly this pair; a payment_status-only check would be
    // 'unpaid' here and wrongly offer a link that HOLD_EXPIREDs on click.
    await renderOrdersList({ status: "cancelled", payment_status: "unpaid" });
    expect(screen.queryByTestId("lanjut-bayar-AGR-20260903-TEST")).toBeNull();
  });
});

describe("/orders/[id] detail CTA (#226 P1b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockGetUser.mockReset();
  });

  it("shows Lanjut Bayar when status=pending_payment and payment_status=unpaid", async () => {
    await renderOrderDetail({ status: "pending_payment", payment_status: "unpaid" });
    const cta = screen.getByTestId("lanjut-bayar-detail");
    expect(cta.getAttribute("href")).toBe(`/checkout/payment/${ORDER_ID}`);
  });

  it("hides Lanjut Bayar once paid", async () => {
    await renderOrderDetail({ status: "paid", payment_status: "paid" });
    expect(screen.queryByTestId("lanjut-bayar-detail")).toBeNull();
  });

  it("hides Lanjut Bayar for a cancelled+unpaid order", async () => {
    await renderOrderDetail({ status: "cancelled", payment_status: "unpaid" });
    expect(screen.queryByTestId("lanjut-bayar-detail")).toBeNull();
  });
});

describe("/track/[orderId] CTA (#226 P1b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it("shows Lanjut Bayar for unpaid orders — the lookup funnel dead-end fix", async () => {
    await renderTrack({ status: "pending_payment", payment_status: "unpaid" });
    const cta = screen.getByTestId("lanjut-bayar-track");
    expect(cta.getAttribute("href")).toBe(`/checkout/payment/${ORDER_ID}`);
  });

  it("hides Lanjut Bayar for paid orders", async () => {
    await renderTrack({ status: "paid", payment_status: "paid" });
    expect(screen.queryByTestId("lanjut-bayar-track")).toBeNull();
  });
});
