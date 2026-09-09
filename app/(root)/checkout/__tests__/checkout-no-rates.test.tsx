import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CartItem } from "@/lib/stores/cart";

vi.mock("@/components/map/MapPicker", () => ({
  default: () => <div data-testid="map-picker" />,
}));
vi.mock("@/components/location-display", () => ({
  LocationDisplay: () => <div data-testid="location-display" />,
}));
vi.mock("@/components/navigation", () => ({ default: () => null }));
vi.mock("@/components/ui/footer", () => ({ Footer: () => null }));
vi.mock("@/lib/analytics/gtag", () => ({ trackBeginCheckout: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/checkout",
}));

const cart: CartItem[] = [
  {
    variantId: "v1",
    productSlug: "gayo",
    productName: "Kopi Gayo",
    variantDescription: "250g",
    unitPrice: 100000,
    originalPrice: 100000,
    quantity: 1,
    shipWeightGrams: 250,
    image: "/x.png",
  },
];

const mockUseCart = vi.fn();
vi.mock("@/lib/hooks/useCart", () => ({ useCart: () => mockUseCart() }));
const mockUseAuth = vi.fn();
vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));
const mockUseAddresses = vi.fn();
vi.mock("@/lib/hooks/useAddresses", () => ({ useAddresses: () => mockUseAddresses() }));
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error("mock") }) }) }) }),
  }),
}));

import CheckoutPageContent from "../checkout-page-content";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function ratesResponse(pricing: unknown[]) {
  return { ok: true, json: async () => ({ success: true, pricing }) };
}

beforeEach(() => {
  mockFetch.mockReset();
  mockUseCart.mockReturnValue({
    cartItems: cart,
    cartTotal: 100000,
    cartCount: 1,
    clearCart: vi.fn(),
    hydrated: true,
  });
  mockUseAuth.mockReturnValue({ user: null, loading: false });
  mockUseAddresses.mockReturnValue({ addresses: [], isLoading: false });
});

async function typePostal(code: string) {
  // labelledby points at a Radix div (non-labellable) so use the placeholder
  const input = await screen.findByPlaceholderText("12190");
  fireEvent.change(input, { target: { value: code } });
  // debounce is 800ms
  await new Promise((r) => setTimeout(r, 1000));
}

describe("checkout page — no-rates recovery panel (#143/#142)", () => {
  it("shows the recovery panel with a map escape hatch when the quote returns zero couriers", async () => {
    mockFetch.mockResolvedValue(ratesResponse([]));
    render(<CheckoutPageContent />);

    await typePostal("40115");

    // dead-end is explained instead of silently hiding the selector
    expect(await screen.findByText(/kurir/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    // pay button remains disabled, and the panel explains why
    expect(screen.getByRole("button", { name: /bayar sekarang/i })).toBeDisabled();

    // escape hatch opens the map picker
    fireEvent.click(screen.getByRole("button", { name: /tandai lokasi di peta/i }));
    expect(await screen.findByTestId("map-picker")).toBeInTheDocument();
  });

  it("shows the selector (not the panel) when rates exist", async () => {
    mockFetch.mockResolvedValue(
      ratesResponse([
        {
          courier_name: "JNE",
          courier_code: "jne",
          courier_service_name: "REG",
          courier_service_code: "reg",
          price: 12000,
          duration: "2 - 3 days",
          currency: "IDR",
        },
      ])
    );
    render(<CheckoutPageContent />);

    await typePostal("40115");

    await waitFor(() => expect(screen.getByRole("combobox")).toBeInTheDocument());
    expect(screen.queryByText(/kurir/i)).not.toBeInTheDocument();
  });

  it("no alarm on a pristine form before any quote attempt", async () => {
    mockFetch.mockResolvedValue(ratesResponse([]));
    render(<CheckoutPageContent />);

    await new Promise((r) => setTimeout(r, 300));
    expect(screen.queryByText(/kurir/i)).not.toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
