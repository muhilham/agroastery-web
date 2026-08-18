import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestingPeriod } from "./index";

const { mockReplace, mockRoastParam } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRoastParam: { value: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () =>
    new URLSearchParams(mockRoastParam.value ? `roast=${mockRoastParam.value}` : ""),
}));

describe("RestingPeriod", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockRoastParam.value = "";
    vi.useFakeTimers({ toFake: ["Date"] });
    // 2026-08-18T10:00:00Z = 2026-08-18 17:00 WIB
    vi.setSystemTime(new Date("2026-08-18T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state prompting for a roast date when param is absent", () => {
    render(<RestingPeriod />);
    expect(screen.getByText(/enter.*roast date/i)).toBeInTheDocument();
    expect(screen.queryByText(/day 3/i)).not.toBeInTheDocument();
  });

  it("ignores an invalid roast param and shows empty state", () => {
    mockRoastParam.value = "not-a-date";
    render(<RestingPeriod />);
    expect(screen.getByText(/enter.*roast date/i)).toBeInTheDocument();
  });

  it("shows today's day count for a valid roast date", () => {
    mockRoastParam.value = "2026-08-04";
    render(<RestingPeriod />);
    expect(screen.getByText(/today is day 14 since roast/i)).toBeInTheDocument();
    expect(screen.getByText(/roasted on 4 Agustus 2026/i)).toBeInTheDocument();
  });

  it("shows day 0 banner on the roast day itself", () => {
    mockRoastParam.value = "2026-08-18";
    render(<RestingPeriod />);
    expect(screen.getByText(/today is roast day/i)).toBeInTheDocument();
  });

  it("shows not roasted yet for a future roast date", () => {
    mockRoastParam.value = "2026-08-20";
    render(<RestingPeriod />);
    expect(screen.getByText(/not roasted yet/i)).toBeInTheDocument();
  });

  it("renders all four milestones with dates and statuses", () => {
    mockRoastParam.value = "2026-08-04";
    render(<RestingPeriod />);

    const day3 = screen.getByText("Day 3").closest("div");
    expect(day3).toHaveTextContent("7 Agustus 2026");
    expect(day3).toHaveTextContent("11 days ago");

    const day7 = screen.getByText("Day 7").closest("div");
    expect(day7).toHaveTextContent("11 Agustus 2026");
    expect(day7).toHaveTextContent("7 days ago");

    const day14 = screen.getByText("Day 14").closest("div");
    expect(day14).toHaveTextContent("18 Agustus 2026");
    expect(day14).toHaveTextContent("Today");

    const day21 = screen.getByText("Day 21").closest("div");
    expect(day21).toHaveTextContent("25 Agustus 2026");
    expect(day21).toHaveTextContent("In 7 days");
  });

  it("updates the URL param when the date input changes", () => {
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/roast date/i), {
      target: { value: "2026-08-04" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/resting-period/?roast=2026-08-04",
      { scroll: false }
    );
  });

  it("removes the param when the date input is cleared", () => {
    mockRoastParam.value = "2026-08-04";
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/roast date/i), { target: { value: "" } });
    expect(mockReplace).toHaveBeenCalledWith("/resting-period/", { scroll: false });
  });

  it("copies the current URL and shows feedback", async () => {
    mockRoastParam.value = "2026-08-04";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(await screen.findByText(/copied!/i)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it("shows a readonly URL fallback when the clipboard API fails", async () => {
    mockRoastParam.value = "2026-08-04";
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    const input = await screen.findByLabelText(/copy manually/i);
    expect(input).toHaveValue(window.location.href);
  });
});
