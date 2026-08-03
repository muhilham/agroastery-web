import type { Recipe } from "@/lib/data/blend-50-50";

type RecipeCardProps = { recipe: Recipe };

export function RecipeCard({ recipe }: RecipeCardProps) {
  const sectionId = recipe.id.replace(/_/g, "-");

  return (
    <section id={sectionId} className="scroll-mt-8 border-t border-white/10 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-xl font-semibold text-[hsl(var(--primary))]">{recipe.title}</h2>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {recipe.steps.map((step) => (
            <div key={step.label}>
              <dt className="text-xs uppercase tracking-wide text-[hsl(var(--secondary))]">
                {step.label}
              </dt>
              <dd className="mt-1 text-lg font-medium text-[hsl(var(--primary))]">{step.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {recipe.tasteProfile.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#9C6B3E]/30 px-3 py-1 text-xs text-[hsl(var(--secondary))]"
            >
              {tag}
            </span>
          ))}
        </div>
        {recipe.note && (
          <p className="mt-6 text-sm leading-relaxed text-[hsl(var(--secondary))]">{recipe.note}</p>
        )}
      </div>
    </section>
  );
}
