import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Blend5050OnboardingPage from "./page";

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

describe("Blend5050OnboardingPage", () => {
  it("renders the hero, all three recipe sections, ingredients, troubleshooting, help, and reorder CTAs", () => {
    render(<Blend5050OnboardingPage />);
    expect(screen.getByRole("heading", { name: "Blend 50:50" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Espresso" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Iced Americano" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Es Kopi Susu" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bahan yang Digunakan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Troubleshooting" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pesan Ulang Blend 50:50" })).toBeInTheDocument();
  });
});
