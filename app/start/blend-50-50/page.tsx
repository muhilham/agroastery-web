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

export const metadata: Metadata = {
  title: "Panduan Seduh Blend 50:50 | AGRoastery",
  description:
    "Resep dan panduan menyeduh Blend 50:50 langsung dari AGRoastery — espresso, iced americano, dan es kopi susu.",
  openGraph: {
    title: "Panduan Seduh Blend 50:50 | AGRoastery",
    description: "Resep dan panduan menyeduh Blend 50:50 langsung dari AGRoastery.",
  },
};

export default function Blend5050OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl">
      <OnboardingStartTracker />
      <div className="px-6 pt-8">
        <Link href="/" className="text-sm font-medium tracking-wide text-[hsl(var(--secondary))]">
          AGRoastery
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
