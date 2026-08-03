import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { RecipeSection } from "./RecipeSection";
import { recipes } from "@/lib/data/blend-50-50";

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

describe("RecipeSection", () => {
  it("fires brew_guide_viewed with the recipe's brew_method on scroll-into-view", async () => {
    const { trackBlendEvent } = await import("@/lib/data/blend-50-50");
    const recipe = recipes.find((r) => r.id === "espresso")!;
    render(<RecipeSection recipe={recipe} />);

    FakeIntersectionObserver.instances[0].trigger(true);

    expect(trackBlendEvent).toHaveBeenCalledWith("brew_guide_viewed", { brew_method: "espresso" });
  });
});
