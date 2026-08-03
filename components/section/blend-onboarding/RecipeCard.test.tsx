import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeCard } from "./RecipeCard";
import { recipes } from "@/lib/data/blend-50-50";

describe("RecipeCard", () => {
  it("renders title, section id, steps, and taste tags for espresso", () => {
    const recipe = recipes.find((r) => r.id === "espresso")!;
    const { container } = render(<RecipeCard recipe={recipe} />);

    expect(screen.getByRole("heading", { name: "Espresso" })).toBeInTheDocument();
    expect(container.querySelector("#espresso")).not.toBeNull();
    expect(screen.getByText("18g")).toBeInTheDocument();
    expect(screen.getByText("40g")).toBeInTheDocument();
    recipe.tasteProfile.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it("derives a hyphenated section id from an underscored recipe id", () => {
    const recipe = recipes.find((r) => r.id === "iced_americano")!;
    const { container } = render(<RecipeCard recipe={recipe} />);
    expect(container.querySelector("#iced-americano")).not.toBeNull();
  });
});
