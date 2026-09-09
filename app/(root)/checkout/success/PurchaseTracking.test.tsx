import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PurchaseTracking from "./PurchaseTracking";
import { trackPurchase } from "@/lib/analytics/gtag";

vi.mock("@/lib/analytics/gtag", () => ({
  trackPurchase: vi.fn(),
}));

const props = {
  transactionId: "AGR-20260909-0001",
  value: 115000,
  shipping: 15000,
  items: [
    { itemId: "variant-1", itemName: "Kopi Arabika", price: 50000, quantity: 2 },
  ],
};

describe("PurchaseTracking", () => {
  beforeEach(() => {
    vi.mocked(trackPurchase).mockClear();
    sessionStorage.clear();
  });

  it("fires purchase exactly once under StrictMode double-mount", () => {
    render(
      <StrictMode>
        <PurchaseTracking {...props} />
      </StrictMode>
    );
    expect(trackPurchase).toHaveBeenCalledTimes(1);
    expect(trackPurchase).toHaveBeenCalledWith(props);
  });

  it("does not re-fire on remount for the same transaction (refresh/back-nav)", () => {
    const first = render(<PurchaseTracking {...props} />);
    first.unmount();
    render(<PurchaseTracking {...props} />);
    expect(trackPurchase).toHaveBeenCalledTimes(1);
  });

  it("fires for a different transaction even after a prior one was tracked", () => {
    render(<PurchaseTracking {...props} />);
    render(<PurchaseTracking {...props} transactionId="AGR-20260909-0002" />);
    expect(trackPurchase).toHaveBeenCalledTimes(2);
  });
});
