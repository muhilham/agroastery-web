import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import QrPaymentClient from "./qr-payment-client";
import { PENDING_ORDER_STORAGE_KEY, PENDING_ORDER_VERSION_KEY } from "@/lib/pending-order";

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
  qrExpiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
  hasPaymentEmail: true,
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

  it("renders a deterministic expired countdown for an empty expiry", () => {
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={null} />);
    expect(screen.getByText("QR Kedaluwarsa")).toBeDefined();
    expect(screen.queryByText(/NaN:NaN/)).toBeNull();
  });

  it("automatically refreshes once the countdown expires", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: true, json: async () => ({ qrString: "new-qr", qrExpiresAt: new Date(Date.now() + 3600_000).toISOString() }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={new Date(Date.now() + 1000).toISOString()} />);
    await act(async () => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/checkout/refresh-qr", expect.any(Object)));
  });

  it("stops auto refresh after three failures and leaves manual state", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: false, json: async () => ({ error: "Gagal" }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={null} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15000); });
    const refreshCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(([url]) => url.includes("refresh-qr"));
    expect(refreshCalls.length).toBeLessThanOrEqual(3);
    expect(refreshCalls.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /perbarui qr/i })).toBeDefined();
  });

  it("shows a notice after auto refresh succeeds", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: true, json: async () => ({ qrString: "new-qr", qrExpiresAt: new Date(Date.now() + 3600_000).toISOString() }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={null} />);
    await waitFor(() => expect(screen.getByText(/QR baru dibuat/i)).toBeDefined());
  });

  it("does not retry when the total hold is expired", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: false, json: async () => ({ error: "Batas waktu pemesanan telah terlewati. Silakan pesan ulang.", code: "HOLD_EXPIRED" }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={null} />);
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(60_000); });
    const refreshCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(([url]) => url.includes("refresh-qr"));
    expect(refreshCalls).toHaveLength(1);
    expect(screen.getByText(/Batas waktu pemesanan/i)).toBeDefined();
  });

  it("reloads the page (no retry) when refresh returns 409 STATE_CHANGED", async () => {
    const reload = vi.fn();
    const origLocation = window.location;
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: { ...origLocation, reload } });
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: false, json: async () => ({ error: "Status pesanan berubah. Muat ulang halaman.", code: "STATE_CHANGED" }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={null} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    const refreshCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(([url]) => url.includes("refresh-qr"));
    expect(refreshCalls).toHaveLength(1);
    expect(reload).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: origLocation });
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

  it("hard-navigates to success when a late payment lands during the grace window", async () => {
    // Issue #186: must be a full page load (window.location.href), NOT
    // router.push — SPA flight renders /checkout/success without the
    // ?order param, so PurchaseTracking never fires the GA4 purchase event.
    mockPush.mockClear();
    const hrefSpy = vi.fn();
    const originalLocation = window.location;
    // @ts-expect-error test-only: swap jsdom's non-writable location for a spy target
    delete window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return "";
        },
        set href(value: string) {
          hrefSpy(value);
        },
        assign: hrefSpy,
        replace: hrefSpy,
      },
    });

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
      vi.advanceTimersByTime(3000); // observe late paid → hard navigation
    });

    expect(hrefSpy).toHaveBeenCalledWith(`/checkout/success?order=${defaultProps.orderId}`);
    expect(mockPush).not.toHaveBeenCalled();

    // @ts-expect-error restore jsdom location for other tests
    delete window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});

describe("QrPaymentClient — recovery copy + pointer lifecycle (#226 P1a/P1c)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("promises the email link only when a payment email was sent", () => {
    mockFetch({ payment_status: "pending_payment" });
    render(<QrPaymentClient {...defaultProps} hasPaymentEmail={true} />);
    expect(screen.getByTestId("recovery-copy").textContent).toMatch(/email Anda/i);
  });

  it("points at the checkout banner instead of email when no email exists", () => {
    mockFetch({ payment_status: "pending_payment" });
    render(<QrPaymentClient {...defaultProps} hasPaymentEmail={false} />);
    const copy = screen.getByTestId("recovery-copy").textContent ?? "";
    expect(copy).not.toMatch(/email/i);
    expect(copy).toMatch(/Lanjut bayar/i);
  });

  it("clears the same-browser pending pointer when payment is detected", async () => {
    mockFetch({ payment_status: "paid" });
    const originalLocation = window.location;
    let navigatedTo = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        get href() {
          return navigatedTo;
        },
        set href(value: string) {
          navigatedTo = value;
        },
      },
    });

    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify({
      orderId: defaultProps.orderId,
      orderNumber: defaultProps.orderNumber,
      total: defaultProps.total,
      savedAt: new Date().toISOString(),
    }));
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, "1");

    render(<QrPaymentClient {...defaultProps} />);
    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(localStorage.getItem(PENDING_ORDER_STORAGE_KEY)).toBeNull();
    expect(navigatedTo).toBe(`/checkout/success?order=${defaultProps.orderId}`);

    // @ts-expect-error restore jsdom location for other tests
    delete window.location;
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("keeps a pointer belonging to a DIFFERENT order when this one pays", async () => {
    mockFetch({ payment_status: "paid" });
    const other = {
      orderId: "bbbbbbbb-2222-2222-2222-222222222222",
      orderNumber: "AGR-20260903-NEW",
      total: 99000,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(other));
    localStorage.setItem(PENDING_ORDER_VERSION_KEY, "1");

    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign() {}, replace() {} },
    });

    render(<QrPaymentClient {...defaultProps} />);
    await act(async () => { vi.advanceTimersByTime(3000); });

    // Paying order A must not destroy the recovery pointer for newer order B
    // (checkout B abandoned, then A paid via its own QR page, same browser).
    expect(localStorage.getItem(PENDING_ORDER_STORAGE_KEY)).toContain(other.orderId);

    // @ts-expect-error restore jsdom location for other tests
    delete window.location;
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });
});

describe("QrPaymentClient — proactive reissue + dead-state CTA (#231 A3/A4)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("auto-regenerates when the QR enters the horizon, long before countdown-zero", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: true, json: async () => ({ qrString: "new-qr", qrExpiresAt: new Date(Date.now() + 55 * 60_000).toISOString() }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    // 11 min remaining < 48-min trigger: pre-fix this NEVER fired (only at 0).
    render(<QrPaymentClient {...defaultProps} qrExpiresAt={new Date(Date.now() + 11 * 60_000).toISOString()} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/checkout/refresh-qr", expect.any(Object)));
  });

  it("does NOT auto-regenerate while the QR is outside the horizon", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ({ ok: true, json: async () => ({ payment_status: "pending_payment" }) }));
    global.fetch = fetchMock;
    render(<QrPaymentClient {...defaultProps} />); // defaultProps = 55 min remaining
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("refresh-qr"))).toHaveLength(0);
  });

  it("#231 A3: manual Perbarui QR is enabled with plenty of time left", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: true, json: async () => ({ qrString: "new-qr", qrExpiresAt: new Date(Date.now() + 55 * 60_000).toISOString() }) }
      : { ok: true, json: async () => ({ payment_status: "pending_payment" }) });
    render(<QrPaymentClient {...defaultProps} />); // 55 min remaining: outside the horizon, pre-fix button was disabled
    const btn = screen.getByRole("button", { name: /perbarui qr/i });
    expect(btn.hasAttribute("disabled")).toBe(false);
  });

  it("#231 A4: dead state offers a reorder CTA into the cart", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ payment_status: "expired" }) });
    render(<QrPaymentClient {...defaultProps} />);
    await act(async () => { vi.advanceTimersByTime(3000); }); // observe expired -> grace
    await act(async () => { vi.advanceTimersByTime(10 * 60 * 1000 + 3000); }); // grace lapses
    expect(screen.getByTestId("payment-cancelled-notice")).toBeDefined();
    const cta = screen.getByTestId("reorder-cta");
    expect(cta.getAttribute("href")).toBe("/cart");
  });
});
