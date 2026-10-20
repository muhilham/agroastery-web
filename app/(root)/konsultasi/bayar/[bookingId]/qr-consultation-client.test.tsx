import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
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
    // #231 A3 note: with the 48-min horizon and a 10s expiry, the proactive
    // auto-refresh fires on mount — same code path, so no click is needed.
    const reload = vi.fn();
    const origLocation = window.location;
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: { ...origLocation, reload } });
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: false, json: async () => ({ error: "Status booking berubah. Muat ulang halaman.", code: "STATE_CHANGED" }) }
      : { ok: true, json: async () => ({ status: "pending_payment" }) });
    render(<QrConsultationClient bookingId="booking-1" amount={100000} qrString="qr" qrExpiresAt={new Date(Date.now() + 10_000).toISOString()} />);
    await waitFor(() => expect(reload).toHaveBeenCalled());
    Object.defineProperty(window, "location", { configurable: true, writable: true, value: origLocation });
  });

  it("#231 A3: regenerates before countdown-zero, while the QR is still inside the horizon", async () => {
    // qrExpiresAt 11 min out is YOUNGER-looking than the 48-min trigger, i.e.
    // secondsLeft(660) <= QRIS_REFRESH_AT_SECONDS(2880) — must fire on mount
    // without waiting for the countdown to reach 0. Pre-fix this never fired.
    global.fetch = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: true, json: async () => ({ qrString: "new-qr", qrExpiresAt: new Date(Date.now() + 55 * 60_000).toISOString() }) }
      : { ok: true, json: async () => ({ status: "pending_payment" }) });
    render(<QrConsultationClient bookingId="booking-1" amount={100000} qrString="qr" qrExpiresAt={new Date(Date.now() + 11 * 60_000).toISOString()} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/consultations/refresh-qr", expect.any(Object)));
  });

  it("#231 A3: does NOT regenerate while the QR is outside the horizon", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => url.includes("refresh-qr")
      ? { ok: true, json: async () => ({ qrString: "new-qr", qrExpiresAt: new Date(Date.now() + 55 * 60_000).toISOString() }) }
      : { ok: true, json: async () => ({ status: "pending_payment" }) });
    global.fetch = fetchMock;
    render(<QrConsultationClient bookingId="booking-1" amount={100000} qrString="qr" qrExpiresAt={new Date(Date.now() + 55 * 60_000).toISOString()} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes("refresh-qr"))).toHaveLength(0);
  });
});
