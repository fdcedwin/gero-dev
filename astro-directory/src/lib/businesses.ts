import { getCollection, type CollectionEntry } from "astro:content";
import { findUnsafeMarkdown } from "./markdown-safety";
import {
  buildCategoryIndex,
  fillSuggestions,
  getRelated,
  rankByRating,
  type RelatableItem,
} from "./related";

export type Business = CollectionEntry<"businesses">;
export type Category = CollectionEntry<"categories">;

const MAX_DESCRIPTION_LENGTH = 1000;

export const businessHref = (id: string) => `/directory/${id}/`;
export const categoryHref = (id: string) => `/directory/category/${id}/`;

/** Every published business, sorted by name. Drafts and archived listings never get a page. */
export async function getPublishedBusinesses(): Promise<Business[]> {
  const [entries, categoryMap] = await Promise.all([
    getCollection("businesses", ({ data }) => data.status === "published"),
    getCategoryMap(),
  ]);
  for (const entry of entries) {
    const body = entry.body?.trim() ?? "";
    const problems = findUnsafeMarkdown(body);
    // Astro only logs broken references; make them fail the build instead.
    for (const id of categoryIds(entry)) {
      if (!categoryMap.has(id))
        problems.push(`unknown category "${id}" (see src/content/categories.yaml)`);
    }
    if (body.length > MAX_DESCRIPTION_LENGTH) {
      problems.push(
        `description is ${body.length} characters; the limit is ${MAX_DESCRIPTION_LENGTH}`,
      );
    }
    if (problems.length > 0) {
      throw new Error(`[businesses/${entry.id}/index.md] ${problems.join("; ")}.`);
    }
  }
  return entries.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export async function getCategoryMap(): Promise<Map<string, Category>> {
  const entries = await getCollection("categories");
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export function categoryIds(business: Business): string[] {
  return business.data.categories.map((ref) => ref.id);
}

/** Returns a lookup for suggested businesses; the category index is built once per call. */
export function createRelatedLookup(
  businesses: Business[],
): (business: Business, limit?: number) => Business[] {
  const items = businesses.map((business) => ({
    id: business.id,
    name: business.data.name,
    categoryIds: categoryIds(business),
    rating: business.data.rating?.value,
    business,
  })) satisfies (RelatableItem & { business: Business })[];

  const byId = new Map(items.map((item) => [item.id, item]));
  const index = buildCategoryIndex(items);
  const ranked = rankByRating(items);

  return (business, limit = 3) => {
    const item = byId.get(business.id);
    if (!item) return [];
    const related = getRelated(item, index, limit);
    return fillSuggestions(item, related, ranked, limit).map((suggestion) => suggestion.business);
  };
}
