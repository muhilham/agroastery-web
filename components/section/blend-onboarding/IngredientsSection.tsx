import { ingredients } from "@/lib/data/blend-50-50";

export function IngredientsSection() {
  return (
    <section className="border-t border-white/10 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-xl font-semibold text-[hsl(var(--primary))]">Bahan yang Digunakan</h2>
        <dl className="mt-6 space-y-4">
          {ingredients.map((ingredient) => (
            <div key={ingredient.name}>
              <dt className="text-sm font-medium text-[hsl(var(--primary))]">{ingredient.name}</dt>
              <dd className="mt-1 text-sm text-[hsl(var(--secondary))]">{ingredient.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
