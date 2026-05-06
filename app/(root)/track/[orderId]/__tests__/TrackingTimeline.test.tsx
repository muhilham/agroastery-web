import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

// Import after setting up mocks since the component uses fetch
async function renderTimeline(orderId = "order-uuid") {
  const { TrackingTimeline } = await import("../TrackingTimeline");
  return render(<TrackingTimeline orderId={orderId} />);
}

describe("TrackingTimeline", () => {
  it("shows a loading skeleton while fetching", async () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));
    const { container } = await renderTimeline();
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("shows 'sedang disiapkan' message when dispatched is false", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ dispatched: false, status: "processing" }),
    } as Response);
    await renderTimeline();
    await waitFor(() =>
      expect(screen.getByText("Pesanan sedang disiapkan untuk dikirim")).toBeTruthy()
    );
  });

  it("shows resi and 'menunggu update' when dispatched with no history", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dispatched: true,
        status: "shipped",
        waybill_id: "JNE000123456",
        courier: "JNE",
        history: [],
      }),
    } as Response);
    await renderTimeline();
    await waitFor(() => {
      expect(screen.getByText("JNE000123456")).toBeTruthy();
      expect(screen.getByText("Menunggu update dari kurir")).toBeTruthy();
    });
  });

  it("renders timeline events when history is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dispatched: true,
        status: "shipped",
        waybill_id: "JNE000123456",
        courier: "JNE",
        history: [
          { note: "Paket dalam perjalanan", status: "in_transit", updated_at: "2026-04-16T09:14:00Z" },
          { note: "Paket diterima kurir", status: "picked_up", updated_at: "2026-04-15T17:30:00Z" },
        ],
      }),
    } as Response);
    await renderTimeline();
    await waitFor(() => {
      expect(screen.getByText("Paket dalam perjalanan")).toBeTruthy();
      expect(screen.getByText("Paket diterima kurir")).toBeTruthy();
    });
  });

  it("shows error message when fetch response is not ok", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
    } as Response);
    await renderTimeline();
    await waitFor(() =>
      expect(screen.getByText("Tidak dapat memuat info pengiriman")).toBeTruthy()
    );
  });

  it("shows error message when fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
    await renderTimeline();
    await waitFor(() =>
      expect(screen.getByText("Tidak dapat memuat info pengiriman")).toBeTruthy()
    );
  });

  it("shows courier tracking link when link is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dispatched: true,
        status: "shipped",
        waybill_id: "JNE000123456",
        courier: "JNE",
        link: "https://tracking.jne.co.id/JNE000123456",
        history: [],
      }),
    } as Response);
    await renderTimeline();
    await waitFor(() => {
      const link = screen.getByText("Lacak di JNE");
      expect(link).toBeTruthy();
      expect(link.closest("a")?.getAttribute("href")).toBe(
        "https://tracking.jne.co.id/JNE000123456"
      );
    });
  });

  it("does not show courier tracking link when link is absent", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dispatched: true,
        status: "shipped",
        waybill_id: "JNE000123456",
        courier: "JNE",
        history: [],
      }),
    } as Response);
    await renderTimeline();
    await waitFor(() => {
      expect(screen.getByText("JNE000123456")).toBeTruthy();
    });
    expect(screen.queryByText("Lacak di JNE")).toBeNull();
  });
});
