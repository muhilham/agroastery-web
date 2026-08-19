import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestingPeriod } from "./index";

const { mockReplace, mockParams } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockParams: { value: {} as Record<string, string> },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockParams.value),
}));

describe("RestingPeriod", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockParams.value = {};
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
    mockParams.value = { roast: "not-a-date" };
    render(<RestingPeriod />);
    expect(screen.getByText(/enter.*roast date/i)).toBeInTheDocument();
  });

  it("shows today's day count for a valid roast date", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    expect(screen.getByText(/today is day 14 since roast/i)).toBeInTheDocument();
    expect(screen.getByText(/roasted on 4 Agustus 2026/i)).toBeInTheDocument();
  });

  it("shows day 0 banner on the roast day itself", () => {
    mockParams.value = { roast: "2026-08-18" };
    render(<RestingPeriod />);
    expect(screen.getByText(/today is roast day/i)).toBeInTheDocument();
  });

  it("shows not roasted yet for a future roast date", () => {
    mockParams.value = { roast: "2026-08-20" };
    render(<RestingPeriod />);
    expect(screen.getByText(/not roasted yet/i)).toBeInTheDocument();
  });

  it("renders all four milestones with dates and statuses", () => {
    mockParams.value = { roast: "2026-08-04" };
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
      "/roast-age/?roast=2026-08-04",
      { scroll: false }
    );
  });

  it("removes the param when the date input is cleared", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/roast date/i), { target: { value: "" } });
    expect(mockReplace).toHaveBeenCalledWith("/roast-age/", { scroll: false });
  });

  it("copies the current URL and shows feedback", async () => {
    mockParams.value = { roast: "2026-08-04" };
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
    mockParams.value = { roast: "2026-08-04" };
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

  it("shows coffee name under the header when param present", () => {
    mockParams.value = { roast: "2026-08-04", coffee: "Toraja Sapan" };
    render(<RestingPeriod />);
    expect(screen.getByText("Toraja Sapan")).toBeInTheDocument();
  });

  it("hides coffee name when param absent", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    expect(screen.queryByText("Toraja Sapan")).not.toBeInTheDocument();
  });

  it("ignores whitespace-only coffee param", () => {
    mockParams.value = { roast: "2026-08-04", coffee: "   " };
    render(<RestingPeriod />);
    expect(screen.queryByText(/toraja/i)).not.toBeInTheDocument();
  });

  it("renders custom rest target card when days param valid", () => {
    mockParams.value = { roast: "2026-08-04", days: "10" };
    render(<RestingPeriod />);
    const card = screen.getByText("Rest target — 10 days").closest("div");
    expect(card).toHaveTextContent("14 Agustus 2026");
    expect(card).toHaveTextContent("4 days ago");
  });

  it("hides custom rest target card when days param invalid", () => {
    mockParams.value = { roast: "2026-08-04", days: "abc" };
    render(<RestingPeriod />);
    expect(screen.queryByText(/rest target/i)).not.toBeInTheDocument();
  });

  it("hides custom rest target card when days param out of range", () => {
    mockParams.value = { roast: "2026-08-04", days: "400" };
    render(<RestingPeriod />);
    expect(screen.queryByText(/rest target/i)).not.toBeInTheDocument();
  });

  it("updates coffee param in URL when name input changes", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/coffee name/i), {
      target: { value: "Gayo" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/roast-age/?roast=2026-08-04&coffee=Gayo",
      { scroll: false }
    );
  });

  it("removes coffee param from URL when name input cleared", () => {
    mockParams.value = { roast: "2026-08-04", coffee: "Gayo" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/coffee name/i), {
      target: { value: "" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/roast-age/?roast=2026-08-04",
      { scroll: false }
    );
  });

  it("updates days param in URL when rest days input changes", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/rest days/i), {
      target: { value: "12" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/roast-age/?roast=2026-08-04&days=12",
      { scroll: false }
    );
  });

  it("removes days param from URL when rest days input cleared", () => {
    mockParams.value = { roast: "2026-08-04", days: "12" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/rest days/i), {
      target: { value: "" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/roast-age/?roast=2026-08-04",
      { scroll: false }
    );
  });

  it("keeps coffee param when roast changes right after coffee input", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/coffee name/i), {
      target: { value: "Gayo" },
    });
    fireEvent.change(screen.getByLabelText(/roast date/i), {
      target: { value: "2026-08-11" },
    });
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/roast-age/?roast=2026-08-11&coffee=Gayo",
      { scroll: false }
    );
  });

  it("encodes special characters in coffee param", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    fireEvent.change(screen.getByLabelText(/coffee name/i), {
      target: { value: "Gayo & Blend" },
    });
    expect(mockReplace).toHaveBeenCalledWith(
      "/roast-age/?roast=2026-08-04&coffee=Gayo+%26+Blend",
      { scroll: false }
    );
  });
});
