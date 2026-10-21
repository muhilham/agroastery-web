import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill: _fill, onError, placeholder: _p, blurDataURL: _b, priority: _pr, ...rest }: { src: string; alt: string; fill?: boolean; onError?: () => void; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} {...rest} />
  ),
}));

import { FallbackImage } from "./fallback-image";

describe("FallbackImage", () => {
  it("renders the provided src initially", () => {
    render(<FallbackImage src="https://cdn.example.com/a.jpg" alt="A" sizes="100px" />);
    expect(screen.getByAltText("A")).toHaveAttribute("src", "https://cdn.example.com/a.jpg");
  });

  it("swaps to the local placeholder when the image errors", () => {
    render(<FallbackImage src="https://cdn.example.com/missing.jpg" alt="Missing" sizes="100px" />);
    const img = screen.getByAltText("Missing");
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/assets/placeholder.png");
  });

  it("does not loop onError when the placeholder itself fails", () => {
    render(<FallbackImage src="https://cdn.example.com/missing.jpg" alt="Loop" sizes="100px" />);
    const img = screen.getByAltText("Loop");
    fireEvent.error(img);
    fireEvent.error(img);
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/assets/placeholder.png");
  });

  it("resets to the new src when the src prop changes", () => {
    const { rerender } = render(<FallbackImage src="https://cdn.example.com/a.jpg" alt="V" sizes="100px" />);
    const img = screen.getByAltText("V");
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/assets/placeholder.png");

    rerender(<FallbackImage src="https://cdn.example.com/b.jpg" alt="V" sizes="100px" />);
    expect(screen.getByAltText("V")).toHaveAttribute("src", "https://cdn.example.com/b.jpg");
  });
});
