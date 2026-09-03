import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/navigation", () => ({
  default: () => <nav aria-label="site navigation" />,
}));
vi.mock("./booking-flow", () => ({
  default: () => <div>Booking flow</div>,
}));

import KonsultasiPage from "./page";

describe("/konsultasi page smoke render", () => {
  it("renders its server page shell without throwing", () => {
    render(<KonsultasiPage />);

    expect(screen.getByLabelText("site navigation")).toBeInTheDocument();
    expect(screen.getByText("Booking flow")).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  });
});
