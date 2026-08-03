import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpSection } from "./HelpSection";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HelpSection", () => {
  it("renders a WhatsApp link", () => {
    render(<HelpSection />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link.getAttribute("href")).toMatch(/^https:\/\/wa\.me\//);
  });

  it("fires whatsapp_clicked on click", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    render(<HelpSection />);
    fireEvent.click(screen.getByRole("link", { name: /whatsapp/i }));
    expect(trackBlendEvent).toHaveBeenCalledWith("whatsapp_clicked");
  });
});
