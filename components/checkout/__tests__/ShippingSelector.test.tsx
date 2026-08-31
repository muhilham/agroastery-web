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
  it("renders shipping options in a dropdown sorted by price", () => {
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={null}
        onSelect={vi.fn()}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    // Placeholder + 2 rates
    expect(options).toHaveLength(3);

    // Verify sorted by price ascending: SiCepat (12000) first, then JNE (15000)
    expect(options[1].textContent).toContain("SiCepat");
    expect(options[1].textContent).toContain("REG");
    expect(options[2].textContent).toContain("JNE");
    expect(options[2].textContent).toContain("City to City (CTC)");

    expect(options[1].textContent).toContain("Rp\u00a012.000");
    expect(options[2].textContent).toContain("Rp\u00a015.000");
  });

  it("calls onSelect when an option is selected", () => {
    const onSelect = vi.fn();
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={null}
        onSelect={onSelect}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "jne-ctc" } });

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "jne-ctc",
        carrier: "JNE",
      })
    );
  });

  it("shows empty state when no shipping rates", () => {
    render(
      <Wrapper
        shippingRates={[]}
        selectedShipping={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Opsi Pengiriman")).toBeInTheDocument();
    expect(screen.queryByText("JNE")).not.toBeInTheDocument();
  });
});
