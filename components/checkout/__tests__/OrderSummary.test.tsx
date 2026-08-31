import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OrderSummary from "@/components/checkout/OrderSummary";
import type { CartItem } from "@/lib/stores/cart";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill: _fill, ...rest }: { src: string; alt: string; fill?: boolean; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const mockItems: CartItem[] = [
  {
    variantId: "var-1",
    productSlug: "kopi-gayo",
    productName: "Kopi Gayo",
    variantDescription: "250g - Whole Bean",
    unitPrice: 85000,
    originalPrice: 85000,
    quantity: 2,
    shipWeightGrams: 300,
    image: "/assets/gayo.jpg",
  },
  {
    variantId: "var-2",
    productSlug: "kopi-toraja",
    productName: "Kopi Toraja",
    variantDescription: "500g - Ground",
    unitPrice: 120000,
    originalPrice: 150000,
    quantity: 1,
    shipWeightGrams: 550,
    image: "/assets/toraja.jpg",
  },
];

describe("OrderSummary", () => {
  it("renders cart items correctly", () => {
    render(<OrderSummary cartItems={mockItems} cartCount={3} />);

    expect(screen.getByText("Kopi Gayo")).toBeInTheDocument();
    expect(screen.getByText("Kopi Toraja")).toBeInTheDocument();
    expect(screen.getByText("250g - Whole Bean × 2")).toBeInTheDocument();
    expect(screen.getByText("500g - Ground × 1")).toBeInTheDocument();
  });

  it("shows item prices", () => {
    render(<OrderSummary cartItems={mockItems} cartCount={3} />);

    expect(screen.getByText(/Rp\s*170\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Rp\s*120\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Rp\s*150\.000/)).toBeInTheDocument();
  });

  it("handles empty items gracefully", () => {
    render(<OrderSummary cartItems={[]} cartCount={0} />);

    expect(screen.getByText("Pesanan (0 item)")).toBeInTheDocument();
    expect(screen.queryByText("Kopi Gayo")).not.toBeInTheDocument();
  });
});
