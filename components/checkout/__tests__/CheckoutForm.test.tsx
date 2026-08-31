import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import type { TForm } from "@/app/(root)/checkout/checkoutSchemas";
import type { Address } from "@/lib/hooks/useAddresses";

vi.mock("@/components/map/MapPicker", () => ({
  default: () => <div data-testid="map-picker">MapPicker</div>,
}));

vi.mock("@/components/location-display", () => ({
  LocationDisplay: () => <div data-testid="location-display">LocationDisplay</div>,
}));

const defaultValues: TForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  lat: undefined,
  lng: undefined,
  notes: "",
  fulfillmentMethod: "delivery",
};

function Wrapper({
  props = {},
}: {
  props?: Partial<React.ComponentProps<typeof CheckoutForm>>;
}) {
  const methods = useForm<TForm>({ defaultValues });

  return (
    <FormProvider {...methods}>
      <CheckoutForm
        formControl={methods.control}
        isGuest={false}
        user={null}
        isLoadingAddresses={false}
        addresses={[]}
        selectedAddressId={null}
        onAddressSelect={() => {}}
        showMap={false}
        onToggleMap={() => {}}
        watchedLat={undefined}
        watchedLng={undefined}
        isLoadingShipping={false}
        fulfillmentMethod="delivery"
        onFulfillmentChange={() => {}}
        pickupAvailable={true}
        location={null}
        shippingError={null}
        onMapChange={() => {}}
        {...props}
      />
    </FormProvider>
  );
}

const mockAddresses: Address[] = [
  {
    id: "addr-1",
    recipient_name: "Budi",
    phone: "08123456789",
    address_line: "Jl. Sudirman No. 1, Jakarta",
    postal_code: "12190",
    is_default: true,
    label: "Rumah",
    latitude: null,
    longitude: null,
    note: null,
    biteship_location_id: null,
    client_id: null,
    created_at: null,
    user_id: "user-1",
  },
];

describe("CheckoutForm", () => {
  it("renders form fields (name, phone, address)", () => {
    render(<Wrapper />);

    expect(screen.getByLabelText("Nama Lengkap")).toBeInTheDocument();
    expect(screen.getByLabelText("Nomor HP")).toBeInTheDocument();
    expect(screen.getByLabelText("Alamat Lengkap")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("12190")).toBeInTheDocument();
  });

  it("renders fulfillment method selection (pickup vs delivery)", () => {
    render(<Wrapper />);

    expect(screen.getByRole("button", { name: "Kirim" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ambil Sendiri" })
    ).toBeInTheDocument();
  });

  it("shows saved addresses when available", () => {
    render(
      <Wrapper
        props={{
          user: { id: "user-1" },
          addresses: mockAddresses,
          selectedAddressId: "addr-1",
        }}
      />
    );

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(
      screen.getAllByText("Jl. Sudirman No. 1, Jakarta").length
    ).toBeGreaterThanOrEqual(1);
  });
});
