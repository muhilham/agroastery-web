import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import QrConsultationClient from "./qr-consultation-client";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("react-qr-code", () => ({ default: () => <div /> }));

describe("QrConsultationClient", () => {
  it("shows deterministic expired state for a missing expiry", () => {
    render(<QrConsultationClient bookingId="booking-1" amount={100000} qrString="qr" qrExpiresAt={null} />);
    expect(screen.getByText("QR Kedaluwarsa")).toBeDefined();
    expect(screen.queryByText("NaN:NaN")).toBeNull();
  });

  it("reloads the page when refresh returns 409 STATE_CHANGED", async () => {
    const reload = vi.fn();
    const origLocation = window.location;
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: { ...origLocation, reload } });
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: false, json: async () => ({ error: "Status booking berubah. Muat ulang halaman.", code: "STATE_CHANGED" }) }
      : { ok: true, json: async () => ({ status: "pending_payment" }) });
    render(<QrConsultationClient bookingId="booking-1" amount={100000} qrString="qr" qrExpiresAt={new Date(Date.now() + 10_000).toISOString()} />);
    fireEvent.click(screen.getByRole("button", { name: /perbarui qr/i }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: origLocation });
  });
});
