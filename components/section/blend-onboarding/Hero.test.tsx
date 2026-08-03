import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders CTA links pointing to each recipe section", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Espresso" })).toHaveAttribute("href", "#espresso");
    expect(screen.getByRole("link", { name: "Iced Americano" })).toHaveAttribute(
      "href",
      "#iced-americano"
    );
    expect(screen.getByRole("link", { name: "Es Kopi Susu" })).toHaveAttribute(
      "href",
      "#es-kopi-susu"
    );
  });

  it("renders the title and subhead", () => {
    render(<Hero />);
    expect(screen.getByRole("heading", { name: "Blend 50:50" })).toBeInTheDocument();
    expect(screen.getByText("Dirancang untuk minuman berbasis susu.")).toBeInTheDocument();
  });
});
