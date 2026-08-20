import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("uses stronger contrast classes for helper and empty-state text", () => {
    render(<RestingPeriod />);

    expect(screen.getByText(/track how long your coffee has been resting/i)).toHaveClass(
      "text-stone-300"
    );
    expect(screen.getByText(/enter your roast date above to see the resting milestones/i)).toHaveClass(
      "text-stone-200"
    );
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

describe("RestingPeriod QR save", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockParams.value = {};
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-18T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("Save QR button is disabled when no roast date", () => {
    mockParams.value = {};
    render(<RestingPeriod />);
    expect(screen.getByRole("button", { name: /save qr/i })).toBeDisabled();
  });

  it("Save QR button is enabled when roast date set", () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    expect(screen.getByRole("button", { name: /save qr/i })).toBeEnabled();
  });

  it("opens dialog with QR and encoded URL on Save QR click", async () => {
    mockParams.value = { roast: "2026-08-04", coffee: "Toraja" };
    window.history.replaceState({}, "", "/roast-age/?roast=2026-08-04&coffee=Toraja");
    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /save qr/i }));
    expect(await screen.findByText(/QR Code — Toraja/i)).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/roast=2026-08-04/)).toBeInTheDocument();
  });

  it("dialog title is 'QR Code' when no coffee name", async () => {
    mockParams.value = { roast: "2026-08-04" };
    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /save qr/i }));
    expect(await screen.findByText(/^QR Code$/i)).toBeInTheDocument();
  });

  it("downloads PNG on Download button click", async () => {
    mockParams.value = { roast: "2026-08-04" };
    const toDataURL = vi.fn().mockReturnValue("data:image/png;base64,FAKE");
    const anchorClick = vi.fn();
    const origCreate = document.createElement.bind(document);
    const createElSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const c = origCreate("canvas");
        c.getContext = vi.fn().mockReturnValue({
          fillRect: vi.fn(),
          drawImage: vi.fn(),
          fillStyle: "",
        }) as any;
        c.toDataURL = toDataURL;
        return c;
      }
      if (tag === "a") {
        const a = origCreate("a");
        a.click = anchorClick;
        return a;
      }
      return origCreate(tag);
    });
    const OrigImage = globalThis.Image;
    class FakeImage {
      onload: (() => void) | null = null;
      private _src = "";
      set src(v: string) {
        this._src = v;
        Promise.resolve().then(() => this.onload && this.onload());
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal("Image", FakeImage);

    render(<RestingPeriod />);
    fireEvent.click(screen.getByRole("button", { name: /save qr/i }));
    const dlBtn = await screen.findByRole("button", { name: /download png/i });
    fireEvent.click(dlBtn);
    await waitFor(() => expect(anchorClick).toHaveBeenCalled());

    expect(toDataURL).toHaveBeenCalledWith("image/png");
    createElSpy.mockRestore();
    vi.stubGlobal("Image", OrigImage);
  });
});
