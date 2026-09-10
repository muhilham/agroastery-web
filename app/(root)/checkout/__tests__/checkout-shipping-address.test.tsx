/**
 * Issue #148 — checkout shipping-address UX regressions.
 * S1: delivery→pickup→delivery round-trip re-quotes (saved address).
 * S2: saved address without usable destination reveals postal/map + explains.
 * S3: "Alamat baru" keeps recipient name/phone.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { CartItem } from "@/lib/stores/cart";

vi.mock("@/components/map/MapPicker", () => ({
  default: ({ readOnly, onChange }: { readOnly?: boolean; onChange?: (c: { lat: number; lng: number }) => void }) => (
    <div data-testid={readOnly ? "map-readonly" : "map-picker"}>
      {!readOnly && onChange && (
        <button type="button" data-testid="map-pin" onClick={() => onChange({ lat: -6.2, lng: 106.8 })}>
          pin
        </button>
      )}
    </div>
  ),
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

const USER = { id: "u1", email: "buyer@example.com" };
const ADDRESS_WITH_POSTAL = {
  id: "addr-1",
  label: "Rumah",
  recipient_name: "Budi",
  phone: "+62812345678",
  address_line: "Jl. Kemang Raya 5, Jakarta Selatan",
  postal_code: "12790",
  latitude: null,
  longitude: null,
  is_default: true,
  created_at: "2026-01-01",
};
const ADDRESS_NO_DEST = {
  ...ADDRESS_WITH_POSTAL,
  id: "addr-2",
  label: "Gudang",
  postal_code: null,
  address_line: "Jl. Tanpa Kode Pos BANGET", // no embedded 5-digit code
};

function rateBody() {
  return {
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
  };
}

function setup(addresses: unknown[]) {
  mockUseAuth.mockReturnValue({ user: USER, loading: false });
  mockUseAddresses.mockReturnValue({ addresses, isLoading: false });
}

async function settle(ms = 1200) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

// guest mode: postal + map fields are open by default; set a pin via the
// mocked picker's fire-onChange button
async function openMapAndDropPin() {
  fireEvent.click(await screen.findByRole("button", { name: /pilih lokasi di peta/i }));
  const pin = await screen.findByTestId("map-pin");
  await act(async () => {
    fireEvent.click(pin);
    await new Promise((r) => setTimeout(r, 1100)); // geo quote fires un-debounced on watch change
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(rateBody());
  mockUseCart.mockReturnValue({
    cartItems: cart,
    cartTotal: 100000,
    cartCount: 1,
    clearCart: vi.fn(),
    hydrated: true,
  });
});

describe("#148 S1 — delivery→pickup→delivery round-trip keeps quoting", () => {
  it("re-quotes the saved address when returning to Kirim (no re-tap needed)", async () => {
    vi.stubEnv("NEXT_PUBLIC_PICKUP_ADDRESS", "Jl. Roastery No. 1");
    vi.stubEnv("NEXT_PUBLIC_PICKUP_HOURS", "Sen-Sab 09-17");
    setup([ADDRESS_WITH_POSTAL]);
    render(<CheckoutPageContent />);

    // default address auto-selects and quotes
    await settle();
    expect(await screen.findByRole("combobox")).toBeInTheDocument();
    const callsAfterQuote = mockFetch.mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: /ambil sendiri/i }));
    await settle(100);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^kirim$/i }));
    await settle();
    // rates came back WITHOUT re-tapping the address card
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsAfterQuote);
  });
});

describe("#148 S2 — saved address with no usable destination is recoverable", () => {
  it("reveals postal input + explains why nothing is quoted", async () => {
    setup([ADDRESS_NO_DEST]);
    render(<CheckoutPageContent />);
    await settle(400);

    // explanation at the selector spot
    expect(
      await screen.findByText(/belum punya kode pos atau titik peta/i)
    ).toBeInTheDocument();
    // actionable: postal field visible even though a saved address is selected
    const postal = await screen.findByPlaceholderText("12190");
    // typing a code quotes, no address-card re-tap needed
    await act(async () => {
      fireEvent.change(postal, { target: { value: "40115" } });
      await new Promise((r) => setTimeout(r, 1100));
    });
    expect(await screen.findByRole("combobox")).toBeInTheDocument();
  });

  it("quotes directly from a postal code embedded in the address line", async () => {
    setup([{ ...ADDRESS_NO_DEST, address_line: "Jl. Kemang, Jakarta 12790" }]);
    render(<CheckoutPageContent />);
    await settle();
    expect(await screen.findByRole("combobox")).toBeInTheDocument();
    expect(screen.queryByText(/belum punya kode pos/i)).not.toBeInTheDocument();
  });
});

describe("#148 S4 — pin override is visible next to the postal field", () => {
  it("shows the 'computed from map pin' note while a pin drives the quote", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false }); // guest: fields open
    mockUseAddresses.mockReturnValue({ addresses: [], isLoading: false });
    render(<CheckoutPageContent />);

    await openMapAndDropPin();
    expect(
      await screen.findByText(/ongkir dihitung dari titik peta/i)
    ).toBeInTheDocument();
  });
});

describe("#148 S3 — 'Alamat baru' keeps recipient contact", () => {
  it("preserves fullName and phone, clears only address fields", async () => {
    setup([ADDRESS_WITH_POSTAL]);
    render(<CheckoutPageContent />);
    await settle();

    // saved address prefilled contact
    const name = (await screen.findByPlaceholderText("Nama lengkap penerima")) as HTMLInputElement;
    expect(name.value).toBe("Budi");

    fireEvent.click(screen.getByRole("button", { name: /alamat baru/i }));
    await settle(100);

    expect(name.value).toBe("Budi"); // contact kept
    const addr = screen.getByPlaceholderText(/Jl\. Kemang Barat/i) as HTMLInputElement;
    expect(addr.value).toBe(""); // street cleared
    const postal = screen.getByPlaceholderText("12190") as HTMLInputElement;
    expect(postal.value).toBe(""); // postal cleared
  });
});
