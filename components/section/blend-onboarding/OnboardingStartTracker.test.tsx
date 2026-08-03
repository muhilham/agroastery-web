import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { OnboardingStartTracker } from "./OnboardingStartTracker";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingStartTracker", () => {
  it("fires onboarding_started exactly once on mount", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    const { rerender } = render(<OnboardingStartTracker />);
    rerender(<OnboardingStartTracker />);
    expect(trackBlendEvent).toHaveBeenCalledTimes(1);
    expect(trackBlendEvent).toHaveBeenCalledWith("onboarding_started");
  });

  it("renders nothing visible", () => {
    const { container } = render(<OnboardingStartTracker />);
    expect(container).toBeEmptyDOMElement();
  });
});
