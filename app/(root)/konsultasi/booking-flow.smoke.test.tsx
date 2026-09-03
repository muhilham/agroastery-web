import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import BookingFlow from "./booking-flow";

describe("BookingFlow smoke render", () => {
  it("renders and loads availability without throwing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dates: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BookingFlow />);

    expect(screen.getByRole("heading", { name: "Konsultasi Kopi" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/consultations/availability"));
  });
});
