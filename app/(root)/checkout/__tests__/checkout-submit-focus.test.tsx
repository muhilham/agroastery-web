import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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
  // jsdom has no scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

async function typePostal(code: string) {
  const input = await screen.findByPlaceholderText("12190");
  await act(async () => {
    fireEvent.change(input, { target: { value: code } });
    await new Promise((r) => setTimeout(r, 1100));
  });
}

describe("checkout page — invalid submit focus (#157 P1)", () => {
  it("scrolls and focuses the first invalid field when a rejected submit happens", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        pricing: [
          {
            courier_name: "JNE",
            courier_code: "jne",
            courier_service_name: "REG",
            courier_service_code: "reg",
            price: 12000,
            duration: "2 - 3 days",
            currency: "IDR",
          },
        ],
      }),
    });
    render(<CheckoutPageContent />);

    // Destination + cheapest pre-selected => pay button ENABLED on an empty
    // form: exactly the trap from the audit.
    await typePostal("40115");
    const pay = screen.getByRole("button", { name: /bayar sekarang/i });
    await waitFor(() => expect(pay).toBeEnabled());

    fireEvent.click(pay);

    // First invalid field in DOM order is the address textarea — focus must
    // land on it (deferred one frame after aria-invalid renders).
    const address = await screen.findByPlaceholderText(/Jl\. Kemang Barat/);
    await waitFor(() => expect(document.activeElement).toBe(address));
    expect(address).toHaveAttribute("aria-invalid", "true");
    expect(address.scrollIntoView).toHaveBeenCalled();
  });
});
