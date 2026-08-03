import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IngredientsSection } from "./IngredientsSection";
import { ingredients } from "@/lib/data/blend-50-50";

describe("IngredientsSection", () => {
  it("renders every ingredient's name and detail", () => {
    render(<IngredientsSection />);
    ingredients.forEach((ingredient) => {
      expect(screen.getByText(ingredient.name)).toBeInTheDocument();
      expect(screen.getByText(ingredient.detail)).toBeInTheDocument();
    });
  });
});
