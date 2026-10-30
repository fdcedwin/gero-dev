export type StarState = "filled" | "outlined";

/** Five star states for a 0–5 rating, rounded to the nearest whole star. */
export function starStates(value: number): StarState[] {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return Array.from({ length: 5 }, (_, i) => (i < filled ? "filled" : "outlined"));
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}
