import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/section/blend-onboarding/Hero";
import { RecipeSection } from "@/components/section/blend-onboarding/RecipeSection";
import { IngredientsSection } from "@/components/section/blend-onboarding/IngredientsSection";
import { TroubleshootingSection } from "@/components/section/blend-onboarding/TroubleshootingSection";
import { HelpSection } from "@/components/section/blend-onboarding/HelpSection";
import { ReorderSection } from "@/components/section/blend-onboarding/ReorderSection";
import { OnboardingStartTracker } from "@/components/section/blend-onboarding/OnboardingStartTracker";
import { recipes } from "@/lib/data/blend-50-50";
import { recipeJsonLdHtml } from "@/lib/seo/recipe-jsonld";

// Brand string normalized to "Agroastery" (issue #235): the PDP/JSON-LD use
// "Agroastery" — mixed "AGRoastery" spellings split citation equity between
// two brand identities for search engines and LLMs.
export const metadata: Metadata = {
  title: "Panduan Seduh Blend 50:50 | Agroastery",
  description:
    "Resep dan panduan menyeduh Blend 50:50 langsung dari Agroastery — espresso, iced americano, es kopi susu, dan mokapot.",
  alternates: { canonical: "/start/blend-50-50" },
  openGraph: {
    title: "Panduan Seduh Blend 50:50 | Agroastery",
    description: "Resep dan panduan menyeduh Blend 50:50 langsung dari Agroastery.",
    url: "/start/blend-50-50",
  },
};

export default function Blend5050OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl">
      <OnboardingStartTracker />
      {recipes.map((recipe) => (
        <script
          key={recipe.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: recipeJsonLdHtml(recipe) }}
        />
      ))}
      <div className="px-6 pt-8">
        <Link href="/" className="text-sm font-medium tracking-wide text-[hsl(var(--secondary))]">
          Agroastery
        </Link>
      </div>
      <Hero />
      {recipes.map((recipe) => (
        <RecipeSection key={recipe.id} recipe={recipe} />
      ))}
      <IngredientsSection />
      <TroubleshootingSection />
      <HelpSection />
      <ReorderSection />
    </main>
  );
}
