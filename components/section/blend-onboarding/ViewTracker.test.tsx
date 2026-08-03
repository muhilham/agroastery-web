import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ViewTracker } from "./ViewTracker";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
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

  it("calls disconnect when the component unmounts", () => {
    const onView = vi.fn();
    const { unmount } = render(
      <ViewTracker onView={onView}>
        <div>content</div>
      </ViewTracker>
    );
    const observer = FakeIntersectionObserver.instances[0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("passes the threshold prop to the IntersectionObserver constructor", () => {
    const onView = vi.fn();
    render(
      <ViewTracker onView={onView} threshold={0.75}>
        <div>content</div>
      </ViewTracker>
    );
    const observer = FakeIntersectionObserver.instances[0];
    expect(observer.options?.threshold).toBe(0.75);
  });
});
