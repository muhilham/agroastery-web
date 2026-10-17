import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

import PendingOrderBanner from "./PendingOrderBanner";
import { savePendingOrder, loadPendingOrder, PENDING_ORDER_STORAGE_KEY, PENDING_ORDER_VERSION_KEY } from "@/lib/pending-order";

const pointer = {
  orderId: "aaaaaaaa-1111-1111-1111-111111111111",
  orderNumber: "AGR-20260903-TEST",
  total: 185000,
  savedAt: new Date().toISOString(),
};

function mockStatusFetch(payment_status: string | null) {
  return vi.fn().mockImplementation((url: string) => {
    if (String(url).includes("/status")) {
      return Promise.resolve({ ok: true, json: async () => ({ payment_status }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({}) });
  });
}

describe("PendingOrderBanner (#226 P1a)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when no pointer is stored", () => {
    vi.stubGlobal("fetch", mockStatusFetch("pending_payment"));
    render(<PendingOrderBanner />);
    expect(screen.queryByText(/belum dibayar/i)).toBeNull();
  });

  it("shows the banner with order number and amount when the order is still unpaid", async () => {
    savePendingOrder(pointer);
    vi.stubGlobal("fetch", mockStatusFetch("pending_payment"));

    render(<PendingOrderBanner />);

    const link = await screen.findByRole("link", { name: /lanjut bayar/i });
    expect(link.getAttribute("href")).toBe(`/checkout/payment/${pointer.orderId}`);
    expect(screen.getByText(/AGR-20260903-TEST/)).toBeDefined();
  });

  it("verifies against the status endpoint before showing", async () => {
    savePendingOrder(pointer);
    const fetchMock = mockStatusFetch("pending_payment");
    vi.stubGlobal("fetch", fetchMock);

    render(<PendingOrderBanner />);

    await screen.findByRole("link", { name: /lanjut bayar/i });
    expect(fetchMock).toHaveBeenCalledWith(`/api/orders/${pointer.orderId}/status`);
  });

  it("clears the pointer and stays hidden when the order is already paid", async () => {
    savePendingOrder(pointer);
    vi.stubGlobal("fetch", mockStatusFetch("paid"));

    render(<PendingOrderBanner />);

    await waitFor(() => expect(loadPendingOrder()).toBeNull());
    expect(screen.queryByText(/belum dibayar/i)).toBeNull();
  });

  it("clears the pointer when the order expired", async () => {
    savePendingOrder(pointer);
    vi.stubGlobal("fetch", mockStatusFetch("expired"));

    render(<PendingOrderBanner />);

    await waitFor(() => expect(loadPendingOrder()).toBeNull());
    expect(screen.queryByText(/belum dibayar/i)).toBeNull();
  });

  it("clears the pointer on 404 and never shows a dead link", async () => {
    savePendingOrder(pointer);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }));

    render(<PendingOrderBanner />);

    await waitFor(() => expect(loadPendingOrder()).toBeNull());
    expect(screen.queryByText(/belum dibayar/i)).toBeNull();
  });

  it("stays hidden (pointer intact) on transient network failure", async () => {
    savePendingOrder(pointer);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<PendingOrderBanner />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText(/belum dibayar/i)).toBeNull();
    // A network blip must not delete recoverable state
    expect(localStorage.getItem(PENDING_ORDER_STORAGE_KEY)).toBeTruthy();
  });

  it("ignores a payload stored under a mismatched version key", async () => {
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(pointer));
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, "0");
    const fetchMock = mockStatusFetch("pending_payment");
    vi.stubGlobal("fetch", fetchMock);

    render(<PendingOrderBanner />);

    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/belum dibayar/i)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
