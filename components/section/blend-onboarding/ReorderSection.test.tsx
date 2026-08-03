import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReorderSection } from "./ReorderSection";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReorderSection", () => {
  it("links the primary CTA to the Blend 50:50 product page", () => {
    render(<ReorderSection />);
    expect(screen.getByRole("link", { name: "Pesan Ulang Blend 50:50" })).toHaveAttribute(
      "href",
      "/product/biji-kopi-blend-5050-kopi-susu-ekonomis"
    );
  });

  it("links the secondary CTA to the catalog", () => {
    render(<ReorderSection />);
    expect(screen.getByRole("link", { name: "Jelajahi Kopi Lainnya" })).toHaveAttribute(
      "href",
      "/katalog"
    );
  });

  it("fires reorder_clicked when the primary CTA is clicked", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    render(<ReorderSection />);
    fireEvent.click(screen.getByRole("link", { name: "Pesan Ulang Blend 50:50" }));
    expect(trackBlendEvent).toHaveBeenCalledWith("reorder_clicked");
  });
});
