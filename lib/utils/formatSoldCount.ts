// ============================================================
// Format product sold count for display: "{n} terjual"
// Rounds for readability while preserving accuracy.
// ============================================================

export function formatSoldCount(count: number | null): string {
  if (!count || count <= 0) return "";

  // >= 10000: round to nearest thousand, show as "5rb+ terjual" (drop decimals for readability)
  // >= 1000: round to nearest hundred, show as "2rb+ terjual"
  // < 1000: exact number
  if (count >= 10000) {
    const rounded = Math.round(count / 1000) * 1000;
    return `${rounded / 1000}rb+ terjual`;
  }
  if (count >= 1000) {
    const rounded = Math.round(count / 100) * 100;
    return `${rounded / 1000}rb+ terjual`;
  }
  return `${count} terjual`;
}

/**
 * Format an aggregate (all-channel) sold count: "{n} terjual di semua channel".
 * Reuses the same rounding rules as {@link formatSoldCount}.
 */
export function formatAllChannelSold(count: number | null): string {
  if (!count || count <= 0) return "";
  return `${formatSoldCount(count)} di semua channel`;
}
