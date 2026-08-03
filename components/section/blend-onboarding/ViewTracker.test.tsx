import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ViewTracker } from "./ViewTracker";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

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

describe("ViewTracker", () => {
  it("calls onView once when the element intersects, even if triggered twice", () => {
    const onView = vi.fn();
    render(
      <ViewTracker onView={onView}>
        <div>content</div>
      </ViewTracker>
    );
    const observer = FakeIntersectionObserver.instances[0];
    observer.trigger(true);
    observer.trigger(true);
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it("does not call onView when the element is not intersecting", () => {
    const onView = vi.fn();
    render(
      <ViewTracker onView={onView}>
        <div>content</div>
      </ViewTracker>
    );
    FakeIntersectionObserver.instances[0].trigger(false);
    expect(onView).not.toHaveBeenCalled();
  });
});
