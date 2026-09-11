import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import ShippingSelector from "@/components/checkout/ShippingSelector";
import type { NormalizedRate } from "@/lib/types/shipping";

const mockRates: NormalizedRate[] = [
  {
    carrier: "JNE",
    code: "jne-ctc",
    service: "City to City (CTC)",
    eta: "2 - 3 days",
    price: 15000,
    raw: {
      courier_name: "JNE",
      courier_code: "jne",
      courier_service_name: "City to City (CTC)",
      courier_service_code: "ctc",
      price: 15000,
    } as NormalizedRate["raw"],
  },
  {
    carrier: "SiCepat",
    code: "sicepat-reg",
    service: "REG",
    eta: "1 - 2 days",
    price: 12000,
    raw: {
      courier_name: "SiCepat",
      courier_code: "sicepat",
      courier_service_name: "REG",
      courier_service_code: "reg",
      price: 12000,
    } as NormalizedRate["raw"],
  },
];

function Wrapper(props: React.ComponentProps<typeof ShippingSelector>) {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <ShippingSelector {...props} />
    </FormProvider>
  );
}

describe("ShippingSelector", () => {
  it("renders rates as radio cards sorted by price", () => {
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={null}
        onSelect={vi.fn()}
      />
    );

    const group = screen.getByRole("radiogroup", { name: /opsi pengiriman/i });
    expect(group).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    // Sorted by price ascending: SiCepat (12000) first, then JNE (15000)
    expect(radios[0].closest("label")).toHaveTextContent("SiCepat REG");
    expect(radios[1].closest("label")).toHaveTextContent(
      "JNE City to City (CTC)"
    );
    expect(radios[0].closest("label")!.textContent).toMatch(/12[\.\s\u00a0\u202f]000/);
    expect(radios[1].closest("label")!.textContent).toMatch(/15[\.\s\u00a0\u202f]000/);
  });

  it("pre-selects the cheapest rate when nothing is selected", () => {
    const onSelect = vi.fn();
    render(
      <Wrapper shippingRates={mockRates} selectedShipping={null} onSelect={onSelect} />
    );
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "sicepat-reg" })
    );
  });

  it("re-seeds the cheapest rate when the selection vanished from a re-quote", () => {
    const onSelect = vi.fn();
    const stale: NormalizedRate = {
      ...mockRates[0],
      code: "wes-not-offered",
    };
    render(
      <Wrapper shippingRates={mockRates} selectedShipping={stale} onSelect={onSelect} />
    );
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ code: "sicepat-reg" }));
  });

  // Review finding on PR #158: preserve-by-code alone kept a STALE
  // NormalizedRate when a cart change re-quoted the same courier at a new
  // price — totals and the pay payload read selectedShipping.price directly.
  it("syncs a same-code selection to the fresh price after a re-quote", () => {
    const stale: NormalizedRate = { ...mockRates[0], price: 15000 }; // jne-ctc
    const fresh: NormalizedRate = { ...mockRates[0], price: 18000 };
    const onSelect = vi.fn();
    render(
      <Wrapper
        shippingRates={[fresh]}
        selectedShipping={stale}
        onSelect={onSelect}
      />
    );
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "jne-ctc", price: 18000 })
    );
  });

  it("preserves a manual selection that still exists in the new quote", () => {
    const onSelect = vi.fn();
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={mockRates[0]}
        onSelect={onSelect}
      />
    );
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getAllByRole("radio")[1]).toBeChecked();
  });

  it("calls onSelect when a card is chosen", () => {
    const onSelect = vi.fn();
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={mockRates[1]}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getAllByRole("radio")[1]);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "jne-ctc", carrier: "JNE" })
    );
  });

  it("collapses more than 4 rates behind a reveal button", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      ...mockRates[0],
      code: `c-${i}`,
      service: `SVC-${i}`,
      price: 10000 + i * 1000,
    }));
    render(
      <Wrapper shippingRates={many} selectedShipping={null} onSelect={vi.fn()} />
    );
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /lihat 2 opsi lainnya/i }));
    expect(screen.getAllByRole("radio")).toHaveLength(6);
  });

  it("normalizes duration and doubled carrier in labels", () => {
    const rates: NormalizedRate[] = [
      {
        ...mockRates[0],
        carrier: "JNE",
        service: "JNE Trucking",
        eta: "3 - 4 days",
      },
      { ...mockRates[1], carrier: "SiCepat", service: "BST", eta: "1 - 1 days" },
    ];
    render(
      <Wrapper shippingRates={rates} selectedShipping={rates[1]} onSelect={vi.fn()} />
    );
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label"));
    // Sorted by price: BST (12000) first, JNE Trucking (15000) second
    expect(labels[0]).toHaveTextContent("Tiba 1 hari");
    expect(labels[1]).toHaveTextContent("Tiba 3\u20134 hari");
    expect(labels[1]).toHaveTextContent("JNE Trucking");
    expect(labels[1]!.textContent).not.toMatch(/JNE JNE/);
  });

  it("announces loading and result counts via aria-live", () => {
    const { rerender } = render(
      <Wrapper shippingRates={mockRates} selectedShipping={mockRates[0]} onSelect={vi.fn()} isLoading />
    );
    expect(screen.getByText(/menghitung ongkir/i)).toBeInTheDocument();
    rerender(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={mockRates[0]}
        onSelect={vi.fn()}
        isLoading={false}
      />
    );
    expect(screen.getByText(/2 opsi pengiriman tersedia/i)).toBeInTheDocument();
  });

  it("shows empty state when no shipping rates", () => {
    render(
      <Wrapper shippingRates={[]} selectedShipping={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText("Opsi Pengiriman")).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
