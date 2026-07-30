import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import QrPaymentClient from "./qr-payment-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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
    <div data-testid="qr-code">
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100" height="100" fill="#000" />
      </svg>
      {value}
    </div>
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

describe("QrPaymentClient — download button", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    mockFetch({ payment_status: "pending_payment" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders the download QR button", () => {
    render(<QrPaymentClient {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /download qr/i })
    ).toBeDefined();
  });

  it("shows screenshot hint text", () => {
    render(<QrPaymentClient {...defaultProps} />);
    expect(
      screen.getByText(/screenshot QR ini/i)
    ).toBeDefined();
  });

  it("shows error when SVG is absent", () => {
    render(<QrPaymentClient {...defaultProps} />);

    // Remove the SVG from the DOM to simulate absent QR
    const qrContainer = screen.getByTestId("qr-code");
    qrContainer.querySelector("svg")?.remove();

    const button = screen.getByRole("button", { name: /download qr/i });
    fireEvent.click(button);

    expect(
      screen.getByText(/QR code tidak ditemukan/i)
    ).toBeDefined();
  });

  it("downloads QR image with crisp rendering", () => {
    const originalCreateElement = document.createElement.bind(document);
    const anchorClickSpy = vi.fn();
    const toDataURLSpy = vi.fn().mockReturnValue("data:image/png;base64,fake");
    const drawImageSpy = vi.fn();
    const fillRectSpy = vi.fn();
    const imageSmoothingEnabledSpy = vi.fn();

    // Mock canvas
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        const canvas = originalCreateElement("canvas");
        let _imageSmoothingEnabled = true;
        canvas.getContext = vi.fn().mockReturnValue({
          fillRect: fillRectSpy,
          drawImage: drawImageSpy,
          get imageSmoothingEnabled() {
            return _imageSmoothingEnabled;
          },
          set imageSmoothingEnabled(v: boolean) {
            _imageSmoothingEnabled = v;
            imageSmoothingEnabledSpy(v);
          },
        } as unknown as CanvasRenderingContext2D);
        canvas.toDataURL = toDataURLSpy;
        return canvas;
      }
      if (tagName === "a") {
        const a = originalCreateElement("a");
        a.click = anchorClickSpy;
        return a;
      }
      return originalCreateElement(tagName);
    });

    // Mock Image to trigger onload immediately
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      #src = "";
      width = 100;
      height = 100;
      get src() {
        return this.#src;
      }
      set src(value: string) {
        this.#src = value;
        // Synchronous onload for testing — in real browsers this is async
        this.onload?.();
      }
    } as unknown as typeof Image;

    render(<QrPaymentClient {...defaultProps} />);

    const button = screen.getByRole("button", { name: /download qr/i });
    fireEvent.click(button);

    // Wait for the async image onload
    return waitFor(() => {
      expect(imageSmoothingEnabledSpy).toHaveBeenCalledWith(false);
      expect(drawImageSpy).toHaveBeenCalled();
      expect(toDataURLSpy).toHaveBeenCalledWith("image/png");
    }).finally(() => {
      global.Image = originalImage;
    });
  });

  it("shows error when image fails to load", () => {
    const originalCreateElement = document.createElement.bind(document);

    // jsdom doesn't implement getContext, so we must mock the canvas element
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        const canvas = originalCreateElement("canvas");
        canvas.getContext = vi.fn().mockReturnValue({
          fillRect: vi.fn(),
          drawImage: vi.fn(),
          imageSmoothingEnabled: true,
        } as unknown as CanvasRenderingContext2D);
        canvas.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,fake");
        return canvas;
      }
      return originalCreateElement(tagName);
    });

    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      #src = "";
      width = 100;
      height = 100;
      get src() {
        return this.#src;
      }
      set src(value: string) {
        this.#src = value;
        // Trigger onerror synchronously to simulate a broken SVG source
        this.onerror?.();
      }
    } as unknown as typeof Image;

    render(<QrPaymentClient {...defaultProps} />);

    const button = screen.getByRole("button", { name: /download qr/i });
    fireEvent.click(button);

    expect(
      screen.getByText(/Gagal memuat QR/i)
    ).toBeDefined();

    global.Image = originalImage;
  });

  it("opens new window on mobile browser", () => {
    const originalCreateElement = document.createElement.bind(document);

    // jsdom doesn't implement getContext, so we must mock the canvas element
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        const canvas = originalCreateElement("canvas");
        canvas.getContext = vi.fn().mockReturnValue({
          fillRect: vi.fn(),
          drawImage: vi.fn(),
          imageSmoothingEnabled: true,
        } as unknown as CanvasRenderingContext2D);
        canvas.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,fake");
        return canvas;
      }
      return originalCreateElement(tagName);
    });

    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      configurable: true,
    });

    const writeSpy = vi.fn();
    const closeSpy = vi.fn();
    const mockWindow = { document: { write: writeSpy, close: closeSpy } } as unknown as Window;
    vi.spyOn(window, "open").mockReturnValue(mockWindow);

    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      #src = "";
      width = 100;
      height = 100;
      get src() {
        return this.#src;
      }
      set src(value: string) {
        this.#src = value;
        this.onload?.();
      }
    } as unknown as typeof Image;

    render(<QrPaymentClient {...defaultProps} />);

    const button = screen.getByRole("button", { name: /download qr/i });
    fireEvent.click(button);

    expect(window.open).toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();

    // Restore
    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      configurable: true,
    });
    global.Image = originalImage;
  });
});
