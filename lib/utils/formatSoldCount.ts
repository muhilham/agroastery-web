// ============================================================
// Format product sold count for display: "{n} terjual"
// Rounds for readability while preserving accuracy.
// ============================================================

export function formatSoldCount(count: number | null): string {
  if (!count || count <= 0) return "";

  // >= 1000: round to nearest hundred, show as "{x}rb+"
  // >= 100: exact number
  // < 100: exact number
  if (count >= 1000) {
    const rounded = Math.round(count / 100) * 100;
    return `${rounded / 1000}rb+ terjual`;
  }
  return `${count} terjual`;
}
