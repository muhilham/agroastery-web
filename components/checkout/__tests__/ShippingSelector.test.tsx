import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import ShippingSelector from "@/components/checkout/ShippingSelector";
import type { NormalizedRate } from "@/lib/types/shipping";

function rate(over: Partial<NormalizedRate> & { code: string }): NormalizedRate {
  const [courier_code, courier_service_code] = over.code.split("-");
  return {
    carrier: over.carrier ?? "JNE",
    service: over.service ?? "REG",
    eta: over.eta ?? "1 - 2 days",
    price: over.price ?? 10000,
    serviceType: over.serviceType,
    code: over.code,
    raw: {
      courier_name: over.carrier ?? "JNE",
      courier_code,
      courier_service_name: over.service ?? "REG",
      courier_service_code,
      price: over.price ?? 10000,
    } as NormalizedRate["raw"],
  };
}

// Postal-style quote: no service_type -> everything Reguler, one section.
const mockRates: NormalizedRate[] = [
  rate({ carrier: "JNE", code: "jne-ctc", service: "City to City (CTC)", eta: "2 - 3 days", price: 15000 }),
  rate({ carrier: "SiCepat", code: "sicepat-reg", service: "REG", eta: "1 - 2 days", price: 12000 }),
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
      <Wrapper shippingRates={mockRates} selectedShipping={null} onSelect={vi.fn()} />
    );

    const group = screen.getByRole("radiogroup", { name: /opsi pengiriman/i });
    expect(group).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0].closest("label")).toHaveTextContent("SiCepat REG");
    expect(radios[1].closest("label")).toHaveTextContent("JNE City to City (CTC)");
    // One radiogroup with a shared radio name => cross-section arrow order
    // follows DOM order (issue #160 F1).
    expect(radios[0]).toHaveAttribute("name", "shipping-rate");
    expect(radios[1]).toHaveAttribute("name", "shipping-rate");
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
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={rate({ code: "wes-not-offered" })}
        onSelect={onSelect}
      />
    );
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ code: "sicepat-reg" }));
  });

  // Review finding on PR #158: preserve-by-code alone kept a STALE
  // NormalizedRate when a cart change re-quoted the same courier at a new
  // price — totals and the pay payload read selectedShipping.price directly.
  it("syncs a same-code selection to the fresh price after a re-quote", () => {
    const stale = rate({ code: "jne-ctc", price: 15000 });
    const fresh = rate({ code: "jne-ctc", price: 18000 });
    const onSelect = vi.fn();
    render(
      <Wrapper shippingRates={[fresh]} selectedShipping={stale} onSelect={onSelect} />
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

  // ---- issue #160: grouped sections ----

  it("renders Instan and Reguler sections inside ONE radiogroup for a geo quote", () => {
    const geo = [
      rate({ carrier: "SiCepat", code: "sicepat-reg", price: 8000 }),
      rate({ carrier: "JNE", code: "jne-reg", price: 10000 }),
      rate({ carrier: "Grab", code: "grab-instant", service: "Instant", eta: "1 - 3 Hours", price: 19000, serviceType: "instant" }),
      rate({ carrier: "Gojek", code: "gojek-sameday", service: "Same Day", eta: "6 - 8 Hours", price: 20000, serviceType: "same_day" }),
      rate({ carrier: "Lalamove", code: "lalamove-motorcycle", service: "Motorcycle", eta: "1 - 3 Hours", price: 12100, serviceType: "same_day" }),
    ];
    render(
      <Wrapper shippingRates={geo} selectedShipping={null} onSelect={vi.fn()} />
    );
    // ONE radiogroup — section headers are plain headings, not nested groups.
    expect(screen.getAllByRole("radiogroup")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /instan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /reguler/i })).toBeInTheDocument();
    // Instan first in DOM (visual order == tab order).
    const radios = screen.getAllByRole("radio");
    expect((radios[0] as HTMLInputElement).value).toBe("lalamove-motorcycle"); // cheapest instan
    // The postal-only fixture renders no section headers at all.
  });

  it("renders no section header for a postal quote (no empty Instan section)", () => {
    render(
      <Wrapper shippingRates={mockRates} selectedShipping={null} onSelect={vi.fn()} />
    );
    expect(screen.queryByRole("heading", { name: /instan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /reguler/i })).not.toBeInTheDocument();
  });

  it("treats overnight 'besok sampai' services as Reguler, unknown type as Reguler", () => {
    const geo = [
      rate({ carrier: "JNE", code: "jne-yes", service: "Yakin Esok Sampai (YES)", eta: "1 - 1 days", price: 18000, serviceType: "overnight" }),
      rate({ carrier: "AnterAja", code: "anteraja-reg", service: "Reguler", price: 11500, serviceType: "weird_future_value" }),
    ];
    render(
      <Wrapper shippingRates={geo} selectedShipping={null} onSelect={vi.fn()} />
    );
    // Both land in Reguler => effectively one section, no headers.
    expect(screen.queryByRole("heading", { name: /instan/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("shows at most one badge per card: Tercepat beats Termurah on the same rate", () => {
    // One rate is both cheapest AND fastest -> single Tercepat badge, and a
    // badge never appears on two cards simultaneously here.
    const rates = [
      rate({ carrier: "Lalamove", code: "lama-motor", service: "Motorcycle", eta: "1 - 2 Hours", price: 9000, serviceType: "same_day" }),
      rate({ carrier: "JNE", code: "jne-reg", service: "Reguler", eta: "1 - 2 days", price: 10000, serviceType: "standard" }),
    ];
    render(<Wrapper shippingRates={rates} selectedShipping={null} onSelect={vi.fn()} />);
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label"));
    expect(labels[0]).toHaveTextContent("Tercepat");
    expect(labels[0]).not.toHaveTextContent("Termurah"); // one badge max
    expect(labels[1]).not.toHaveTextContent("Termurah"); // fastest==cheapest consumes it
  });

  it("badges Termurah on the cheapest when it is not also the fastest", () => {
    const rates = [
      rate({ carrier: "SiCepat", code: "sicepat-reg", service: "REG", eta: "1 - 2 days", price: 8000, serviceType: "standard" }),
      rate({ carrier: "Grab", code: "grab-instant", service: "Instant", eta: "1 - 3 Hours", price: 19000, serviceType: "instant" }),
    ];
    render(<Wrapper shippingRates={rates} selectedShipping={null} onSelect={vi.fn()} />);
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label"));
    // Reguler cheapest first in price order but Instan section renders first;
    // grab is index 0 (instan section), sicepat index 1.
    expect(labels[1]).toHaveTextContent("Termurah");
    expect(labels[0]).toHaveTextContent("Tercepat");
  });

  it("collapses each section beyond 3 rates behind its own reveal button", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      ...mockRates[0],
      code: `c-${i}`,
      service: `SVC-${i}`,
      price: 10000 + i * 1000,
    }));
    render(
      <Wrapper shippingRates={many} selectedShipping={null} onSelect={vi.fn()} />
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: /lihat 3 opsi reguler lainnya/i }));
    expect(screen.getAllByRole("radio")).toHaveLength(6);
  });

  // Adversarial review on #158: a manual pick ranked outside the collapse
  // window must never be hidden by a re-quote reset — an all-unchecked
  // radiogroup whose price still flows to totals is worse than no collapse.
  it("keeps a below-the-fold selection visible after a re-quote", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      ...mockRates[0],
      code: `c-${i}`,
      service: `SVC-${i}`,
      price: 10000 + i * 1000,
    }));
    const picked = many[5]; // most expensive — outside the collapse window
    render(
      <Wrapper shippingRates={many} selectedShipping={picked} onSelect={vi.fn()} />
    );
    expect(screen.getAllByRole("radio")).toHaveLength(6);
    const checked = screen.getByRole("radio", { checked: true }) as HTMLInputElement;
    // Must be the USER's pick — force-expand that flips selection to the
    // cheapest would still render 6 cards.
    expect(checked.value).toBe("c-5");
  });

  it("force-expands only the section holding the selection", () => {
    const geo = [
      rate({ carrier: "SiCepat", code: "sicepat-reg", price: 8000, serviceType: "standard" }),
      ...Array.from({ length: 3 }, (_, i) =>
        rate({ carrier: "JNE", code: `jne-x${i}`, service: `X${i}`, price: 9000 + i, serviceType: "standard" })
      ),
      rate({ carrier: "Lalamove", code: "lama-motor", service: "Motorcycle", price: 12000, eta: "1 - 3 Hours", serviceType: "same_day" }),
      rate({ carrier: "Grab", code: "grab-inst", service: "Instant", price: 19000, eta: "1 - 3 Hours", serviceType: "instant" }),
      rate({ carrier: "Gojek", code: "gojek-sd", service: "Same Day", price: 20000, eta: "6 - 8 Hours", serviceType: "same_day" }),
      // 4th instan rate: Instan now also exceeds its 3-window, so a
      // hypothetical GLOBAL force-expand bug is observable (it would render
      // 4 instan cards and hide the instan reveal).
      rate({ carrier: "Grab", code: "grab-inst2", service: "Instant XL", price: 21000, eta: "1 - 3 Hours", serviceType: "instant" }),
    ];
    // Reguler has 4 rates, selection is its 4th (outside the 3-window):
    // only Reguler force-expands; Instan stays collapsed at 3 + reveal.
    const picked = geo[3]; // jne-x2, 4th reguler rate
    render(<Wrapper shippingRates={geo} selectedShipping={picked} onSelect={vi.fn()} />);
    const radios = screen.getAllByRole("radio");
    expect((radios.find((r) => (r as HTMLInputElement).checked) as HTMLInputElement | undefined)?.value).toBe("jne-x2");
    expect(radios).toHaveLength(7); // 4 reguler expanded + 3 instan collapsed
    expect(screen.getByText(/opsi instan lainnya/i)).toBeInTheDocument();
  });

  it("normalizes duration and doubled carrier in labels, incl. hours -> jam", () => {
    const rates: NormalizedRate[] = [
      { ...mockRates[0], carrier: "JNE", service: "JNE Trucking", eta: "3 - 4 days" },
      { ...mockRates[1], carrier: "SiCepat", service: "BST", eta: "1 - 1 days" },
      rate({ carrier: "Grab", code: "grab-inst", service: "Instant", eta: "1 - 3 Hours", price: 20000, serviceType: "instant" }),
    ];
    render(
      <Wrapper shippingRates={rates} selectedShipping={rates[1]} onSelect={vi.fn()} />
    );
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label"));
    // Sections: Grab (instan) renders first even though it is priciest.
    expect(labels[0]).toHaveTextContent("Tiba 1\u20133 jam");
    // Reguler sorted by price: BST (12000) first, JNE Trucking (15000) next
    expect(labels[1]).toHaveTextContent("Tiba 1 hari");
    expect(labels[2]).toHaveTextContent("Tiba 3\u20134 hari");
    expect(labels[2]).toHaveTextContent("JNE Trucking");
    expect(labels[2]!.textContent).not.toMatch(/JNE JNE/);
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

  it("shows skeleton rows only while the FIRST quote is in flight", () => {
    const { rerender } = render(
      <Wrapper shippingRates={[]} selectedShipping={null} onSelect={vi.fn()} isLoading />
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    // 3 pulse placeholders, no radios, aria-hidden so SR users wait for the
    // polite announcement instead.
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);

    rerender(
      <Wrapper shippingRates={mockRates} selectedShipping={mockRates[0]} onSelect={vi.fn()} isLoading />
    );
    // Re-quote with an existing list: keep showing rates, no skeletons.
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(0);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-busy", "true");
  });

  it("shows empty state when no shipping rates", () => {
    render(
      <Wrapper shippingRates={[]} selectedShipping={null} onSelect={vi.fn()} />
    );
    expect(screen.getByText("Opsi Pengiriman")).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
