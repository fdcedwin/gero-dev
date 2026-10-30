export interface RelatableItem {
  id: string;
  name: string;
  categoryIds: string[];
  rating?: number | undefined;
}

/** Map of category id -> items in that category. Build once per build, reuse for every page. */
export function buildCategoryIndex<T extends RelatableItem>(items: T[]): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const item of items) {
    for (const categoryId of item.categoryIds) {
      const bucket = index.get(categoryId);
      if (bucket) bucket.push(item);
      else index.set(categoryId, [item]);
    }
  }
  return index;
}

/**
 * Deterministic "suggested businesses": items sharing the most categories first,
 * then a shared primary category, then rating, then name. Never includes `item` itself.
 */
export function getRelated<T extends RelatableItem>(
  item: T,
  index: Map<string, T[]>,
  limit = 3,
): T[] {
  const sharedCounts = new Map<T, number>();
  for (const categoryId of item.categoryIds) {
    for (const candidate of index.get(categoryId) ?? []) {
      if (candidate.id === item.id) continue;
      sharedCounts.set(candidate, (sharedCounts.get(candidate) ?? 0) + 1);
    }
  }

  const primary = item.categoryIds[0];
  const samePrimary = (c: T) => (c.categoryIds[0] === primary ? 1 : 0);

  return [...sharedCounts.entries()]
    .sort(
      ([a, aShared], [b, bShared]) =>
        bShared - aShared ||
        samePrimary(b) - samePrimary(a) ||
        (b.rating ?? 0) - (a.rating ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit)
    .map(([candidate]) => candidate);
}

/** Every item ordered best-first (rating, then name). Used to top up sparse suggestions. */
export function rankByRating<T extends RelatableItem>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name),
  );
}

/**
 * Top `related` up to `limit` from `ranked` so the section is never half empty.
 * Skips `item` itself and anything already suggested; keeps category matches first.
 */
export function fillSuggestions<T extends RelatableItem>(
  item: T,
  related: T[],
  ranked: T[],
  limit = 3,
): T[] {
  const result = related.slice(0, limit);
  const taken = new Set([item.id, ...result.map((r) => r.id)]);
  for (const candidate of ranked) {
    if (result.length >= limit) break;
    if (!taken.has(candidate.id)) result.push(candidate);
  }
  return result;
}
