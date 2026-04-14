# Dev Simulate Payment Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dev-only "[DEV] Simulate Payment" button to the QR payment page that triggers the existing simulate-payment API endpoint, allowing local payment flow testing without scanning a QR code.

**Architecture:** Single component edit — add `handleSimulate` async function and a conditionally-rendered button inside `qr-payment-client.tsx`, gated on `process.env.NODE_ENV === "development"`. The existing 3-second polling loop already detects `payment_status: "paid"` and redirects; no extra navigation logic needed.

**Tech Stack:** React 19, Next.js 15, Vitest + React Testing Library, Tailwind CSS

---

## File Map

| File | Action |
|---|---|
| `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx` | Modify — add `handleSimulate` + button |
| `app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx` | Create — tests for simulate button |

---

### Task 1: Write the failing tests

**Files:**
- Create: `app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// app/(root)/checkout/payment/[orderId]/qr-payment-client.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import QrPaymentClient from "./qr-payment-client";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/hooks/useCart", () => ({
  useCart: () => ({ clearCart: vi.fn() }),
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(response: object, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("QrPaymentClient — simulate button", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Prevent the polling interval from making real fetch calls
    vi.useFakeTimers();
    mockFetch({ payment_status: "pending_payment" });
  });

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not render the simulate button outside development", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      writable: true,
      configurable: true,
    });

    render(<QrPaymentClient {...defaultProps} />);

    expect(
      screen.queryByRole("button", { name: /simulate payment/i })
    ).toBeNull();
  });

  it("renders the simulate button in development", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
    });

    render(<QrPaymentClient {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /simulate payment/i })
    ).toBeDefined();
  });

  it("calls /api/dev/simulate-payment with the orderId on click", async () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
    });
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
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
    });
    mockFetch({ error: "DB error" }, false);

    render(<QrPaymentClient {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /simulate payment/i }));

    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeDefined();
    });
  });

  it("shows a fallback error message when the API response has no error field", async () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
      configurable: true,
    });
    mockFetch({}, false);

    render(<QrPaymentClient {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /simulate payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/gagal|error/i)).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm vitest run app/\(root\)/checkout/payment/\[orderId\]/qr-payment-client.test.tsx
```

Expected: all tests in the `simulate button` suite fail — button not found / `handleSimulate` not defined.

---

### Task 2: Implement the simulate button

**Files:**
- Modify: `app/(root)/checkout/payment/[orderId]/qr-payment-client.tsx`

- [ ] **Step 1: Add `simulateError` state and `handleSimulate` function**

After the existing `const [isRefreshing, setIsRefreshing] = useState(false);` line, add:

```tsx
const [simulateError, setSimulateError] = useState<string | null>(null);
const [isSimulating, setIsSimulating] = useState(false);

const handleSimulate = useCallback(async () => {
  setIsSimulating(true);
  setSimulateError(null);
  try {
    const res = await fetch("/api/dev/simulate-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSimulateError(data.error ?? "Gagal simulate pembayaran");
    }
    // On success, the polling loop detects payment_status "paid" and redirects
  } catch {
    setSimulateError("Terjadi kesalahan. Coba lagi.");
  } finally {
    setIsSimulating(false);
  }
}, [orderId]);
```

- [ ] **Step 2: Add the button to the JSX**

After the closing `</div>` of the QR card (`<div className="bg-white rounded-2xl ...">`) and before the bottom cancel link section, add:

```tsx
{process.env.NODE_ENV === "development" && (
  <div className="mt-4 flex flex-col items-center gap-1">
    <button
      onClick={handleSimulate}
      disabled={isSimulating}
      className="text-xs px-3 py-1.5 rounded border border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-colors"
    >
      {isSimulating ? "Simulating..." : "[DEV] Simulate Payment"}
    </button>
    {simulateError && (
      <p className="text-xs text-destructive">{simulateError}</p>
    )}
  </div>
)}
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
pnpm vitest run app/\(root\)/checkout/payment/\[orderId\]/qr-payment-client.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/\(root\)/checkout/payment/\[orderId\]/qr-payment-client.tsx \
        app/\(root\)/checkout/payment/\[orderId\]/qr-payment-client.test.tsx
git commit -m "feat(dev): add simulate payment button to QR payment page"
```

---

## Manual Smoke Test

1. Run `pnpm dev`
2. Create an order and reach the `/checkout/payment/<id>` page
3. Verify "[DEV] Simulate Payment" button is visible below the QR card
4. Click it — within 3 seconds the page should redirect to `/checkout/success?order=<id>`
5. Run `pnpm build && pnpm start` — verify the button is absent (tree-shaken)
