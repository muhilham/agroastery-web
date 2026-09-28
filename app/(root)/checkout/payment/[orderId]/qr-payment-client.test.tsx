import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import QrPaymentClient from "./qr-payment-client";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/checkout/payment/test",
}));

vi.mock("@/lib/hooks/useCart", () => ({
  useCart: () => ({ clearCart: vi.fn() }),
}));

vi.mock("@/components/navigation", () => ({
  default: () => null,
}));

vi.mock("react-qr-code", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="qr-code">{value}</div>
  ),
}));

const defaultProps = {
  orderId: "test-order-id-123",
  orderNumber: "AGR-20260415-ABCD",
  total: 150000,
  qrString: "00020101021226...",
  qrExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
};

function mockFetch(response: object, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
  });
}

describe("QrPaymentClient — simulate button", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    mockFetch({ payment_status: "pending_payment" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not render the simulate button in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(<QrPaymentClient {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /simulate payment/i })
    ).toBeNull();
  });

  it("renders the simulate button in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(<QrPaymentClient {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /simulate payment/i })
    ).toBeDefined();
  });

  it("calls /api/dev/simulate-payment with the orderId on click", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockFetch({ simulated: true });

    render(<QrPaymentClient {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /simulate payment/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/dev/simulate-payment",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ orderId: defaultProps.orderId }),
        })
      );
    });
  });

  it("shows an error message when the API returns an error", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockFetch({ error: "DB error" }, false);

    render(<QrPaymentClient {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /simulate payment/i }));

    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeDefined();
    });
  });

  it("shows a fallback error message when the API response has no error field", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockFetch({}, false);

    render(<QrPaymentClient {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /simulate payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/gagal|error/i)).toBeDefined();
    });
  });
});

describe("QrPaymentClient — QR display", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    mockFetch({ payment_status: "pending_payment" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the QR code value", () => {
    render(<QrPaymentClient {...defaultProps} />);
    expect(screen.getByText(defaultProps.qrString)).toBeDefined();
  });

  it("shows screenshot hint text", () => {
    render(<QrPaymentClient {...defaultProps} />);
    expect(
      screen.getByText(/screenshot QR ini/i)
    ).toBeDefined();
  });
});

describe("QrPaymentClient — expiry grace window (#187)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps polling and shows grace notice after status turns expired", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ payment_status: "expired" }),
    });
    global.fetch = fetchSpy;

    render(<QrPaymentClient {...defaultProps} />);

    // Advance past a few poll ticks so the expired status is observed.
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByTestId("payment-grace-notice")
    ).toBeDefined();
    expect(screen.getByText(/payment masih bisa masuk/i)).toBeDefined();
    // Poll must NOT have stopped: more ticks → more status fetches.
    const callsBefore = fetchSpy.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    // No dead-state yet.
    expect(screen.queryByTestId("payment-cancelled-notice")).toBeNull();
  });

  it("shows cancelled state only after the 10-min grace window lapses", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ payment_status: "expired" }),
    });

    render(<QrPaymentClient {...defaultProps} />);

    await act(async () => {
      vi.advanceTimersByTime(3000); // first expired observation → grace starts
    });
    expect(screen.getByTestId("payment-grace-notice")).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(10 * 60 * 1000 + 3000); // grace lapses
    });

    expect(screen.queryByTestId("payment-grace-notice")).toBeNull();
    expect(screen.getByTestId("payment-cancelled-notice")).toBeDefined();
    expect(screen.getByText(/kedaluwarsa/i)).toBeDefined();
  });

  it("redirects to success when a late payment lands during the grace window", async () => {
    mockPush.mockClear();
    let expired = true;
    global.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({ payment_status: expired ? "expired" : "paid" }),
    }));

    render(<QrPaymentClient {...defaultProps} />);

    await act(async () => {
      vi.advanceTimersByTime(3000); // observe expired → grace
    });
    expect(screen.getByTestId("payment-grace-notice")).toBeDefined();

    expired = false;
    await act(async () => {
      vi.advanceTimersByTime(3000); // observe late paid → redirect
    });

    expect(mockPush).toHaveBeenCalledWith(`/checkout/success?order=${defaultProps.orderId}`);
  });
});
