"use client";

import type { Recipe } from "@/lib/data/blend-50-50";
import { trackBlendEvent } from "@/lib/data/blend-50-50";
import { RecipeCard } from "./RecipeCard";
import { ViewTracker } from "./ViewTracker";

type RecipeSectionProps = { recipe: Recipe };

export function RecipeSection({ recipe }: RecipeSectionProps) {
  return (
    <ViewTracker onView={() => trackBlendEvent("brew_guide_viewed", { brew_method: recipe.id })}>
      <RecipeCard recipe={recipe} />
    </ViewTracker>
  );
}
