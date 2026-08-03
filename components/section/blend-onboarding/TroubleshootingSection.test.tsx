import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TroubleshootingSection } from "./TroubleshootingSection";
import { troubleshooting } from "@/lib/data/blend-50-50";

vi.mock("@/lib/data/blend-50-50", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/blend-50-50")>(
    "@/lib/data/blend-50-50"
  );
  return { ...actual, trackBlendEvent: vi.fn() };
});

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  // @ts-expect-error jsdom has no real IntersectionObserver
  global.IntersectionObserver = FakeIntersectionObserver;
});

describe("TroubleshootingSection", () => {
  it("renders every question and answer", () => {
    render(<TroubleshootingSection />);
    troubleshooting.forEach((item) => {
      expect(screen.getByText(item.question)).toBeInTheDocument();
      expect(screen.getByText(item.answer)).toBeInTheDocument();
    });
  });

  it("fires troubleshooting_viewed once on scroll-into-view", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    render(<TroubleshootingSection />);
    FakeIntersectionObserver.instances[0].trigger(true);
    FakeIntersectionObserver.instances[0].trigger(true);
    expect(trackBlendEvent).toHaveBeenCalledTimes(1);
    expect(trackBlendEvent).toHaveBeenCalledWith("troubleshooting_viewed", undefined);
  });
});
