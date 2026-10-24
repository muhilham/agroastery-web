/**
 * Recipe JSON-LD for /start/blend-50-50 (issue #235).
 *
 * The guide page serves four exact recipes (dose/yield/time/ingredients) with
 * zero structured data — pure extraction loss for both Google rich results and
 * AI engines (robots.ts deliberately allows GPTBot/CCBot/PerplexityBot). Every
 * field is derived from the visible recipe card content (lib/data/blend-50-50
 * renders 1:1 via RecipeCard), so the JSON-LD <-> page parity rule holds by
 * construction.
 *
 * Ingredient vs parameter split mirrors what the cards show: a step label like
 * "Espresso"/"Air"/"Es"/"Susu" is a quantity + ingredient; "Dose"/"Yield"/
 * "Waktu" is an extraction parameter, kept in the instructions, never claimed
 * as an ingredient.
 */
import type { Recipe } from "@/lib/data/blend-50-50";
import { SITE_URL } from "./content-pages";

const RECIPE_URL = "/start/blend-50-50";
const BRAND = "Agroastery";
/** Primary product photo of the blend the recipes use (live products.images). */
const RECIPE_IMAGE = "https://cdn.agroastery.com/produk/kopi-susu-50-50/1.png";

const INGREDIENT_LABEL_RE =
  /(kopi|espresso|air|es\b|susu|creamer|sirup|aren|gula|batu|uht|milk)/i;

function sectionAnchor(id: string): string {
  return id.replace(/_/g, "-");
}

export function recipeJsonLd(recipe: Recipe): Record<string, unknown> {
  const ingredients = recipe.steps
    .filter((s) => INGREDIENT_LABEL_RE.test(s.label) && !/^Yield$/i.test(s.label))
    .map((s) => `${s.value} ${s.label}`);
  // Espresso/mokapot cards show dose parameters instead of ingredient rows;
  // the coffee itself is the page's subject, so name the dose as ingredient.
  if (ingredients.length === 0) {
    const dose = recipe.steps.find((s) => /dose|kopi/i.test(s.label));
    if (dose) ingredients.push(`${dose.value} biji kopi Blend 50:50`);
  }

  const instructions = [
    ...recipe.steps.map((s) => ({
      "@type": "HowToDirection" as const,
      text: `${s.label}: ${s.value}`,
    })),
    ...(recipe.note
      ? [{ "@type": "HowToDirection" as const, text: recipe.note }]
      : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: `${recipe.title} dengan Blend 50:50`,
    url: `${SITE_URL}${RECIPE_URL}#${sectionAnchor(recipe.id)}`,
    image: [RECIPE_IMAGE],
    description:
      `Resep ${recipe.title} dari panduan seduh resmi ${BRAND} untuk Blend 50:50` +
      (recipe.tasteProfile.length
        ? ` — profil rasa ${recipe.tasteProfile.join(", ")}.`
        : "."),
    author: { "@type": "Organization", name: BRAND },
    publisher: { "@type": "Organization", name: BRAND },
    recipeCategory: "Minuman kopi",
    recipeCuisine: "Kopi susu kekinian",
    keywords: ["blend 50/50", "es kopi susu", "resep kopi cafe", BRAND],
    recipeIngredient: ingredients,
    recipeInstructions: instructions,
  };
}

/** Serialized + script-safe JSON-LD for one recipe (mirrors the escaping in
 * lib/seo/content-jsonld.ts). */
export function recipeJsonLdHtml(recipe: Recipe): string {
  return JSON.stringify(recipeJsonLd(recipe))
    .replace(/<\/script>/gi, "<\\/script>")
    .replace(/<!--/g, "<\\!--");
}
