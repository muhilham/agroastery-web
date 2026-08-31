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
  it("renders shipping options as radio buttons", () => {
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("JNE")).toBeInTheDocument();
    expect(screen.getByText("City to City (CTC)")).toBeInTheDocument();
    expect(screen.getByText("SiCepat")).toBeInTheDocument();
    expect(screen.getByText("REG")).toBeInTheDocument();
    expect(screen.getByText(/Rp\s*15\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Rp\s*12\.000/)).toBeInTheDocument();
  });

  it("calls onSelect when a radio is clicked", () => {
    const onSelect = vi.fn();
    render(
      <Wrapper
        shippingRates={mockRates}
        selectedShipping={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("City to City (CTC)").closest("label")!);

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
