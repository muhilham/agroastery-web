import { render, screen } from "@testing-library/react";
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
});
