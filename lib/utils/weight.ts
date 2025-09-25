export function normalizeWeightLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "");
}

/** Parse labels like "150g", "150 gr", "0.5kg", returns integer grams */
export function parseWeightToGrams(label: string): number {
  const v = normalizeWeightLabel(label);
  const kg = v.match(/^(\d+(?:[.,]\d+)?)kg$/);
  if (kg) return Math.round(Number(kg[1].replace(",", ".")) * 1000);
  const g = v.match(/^(\d+)g(r)?$/);
  if (g) return parseInt(g[1], 10);
  const digits = v.match(/^(\d+)$/);
  if (digits) return parseInt(digits[1], 10);
  throw new Error(`Unsupported weight label: ${label}`);
}

/** Optionally add packaging extra either fixed grams or percent (env). */
export function applyPackaging(baseGrams: number): number {
  const extraGrams = Number(process.env.PACKAGING_EXTRA_GRAMS ?? 0);
  const extraPct = Number(process.env.PACKAGING_EXTRA_PERCENT ?? 0);
  const withPct = Math.round(baseGrams * (1 + extraPct / 100));
  return Math.max(1, withPct + extraGrams);
}
