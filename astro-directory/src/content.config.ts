import { defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Paths already used by other /directory/* routes (pagination is numeric). */
const isReservedSlug = (slug: string) => slug === "category" || /^\d+$/.test(slug);

/** Only https links are allowed – blocks javascript:, data:, and plain http URLs. */
const httpsUrl = z.url({ protocol: /^https$/, error: "Must be a full https:// URL" });

/** https URL restricted to a given host (and its subdomains), e.g. facebook.com. */
const socialUrl = (host: string) =>
  httpsUrl.refine(
    (value) => {
      const { hostname } = new URL(value);
      return hostname === host || hostname.endsWith(`.${host}`);
    },
    { message: `Must be a ${host} link` },
  );

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour "HH:MM", e.g. "06:30"');

const dayHours = z.union([z.literal("closed"), z.object({ open: time, close: time })]);

const categories = defineCollection({
  loader: file("src/content/categories.yaml"),
  schema: z.object({
    name: z.string().min(1),
    parent: reference("categories").optional(),
  }),
});

const businesses = defineCollection({
  loader: glob({
    pattern: "*/index.md",
    base: "./src/content/businesses",
    // The folder name is the URL slug: src/content/businesses/cafe-fleur/ -> /directory/cafe-fleur/
    generateId: ({ entry }) => {
      const slug = entry.split("/")[0] ?? "";
      if (!SLUG_PATTERN.test(slug) || isReservedSlug(slug)) {
        throw new Error(
          `Business folder "${slug}" must be lowercase letters, numbers and single hyphens (e.g. "cafe-fleur"), and can't be "category" or only digits.`,
        );
      }
      return slug;
    },
    // Render Markdown lazily so memory stays flat as the directory grows.
    deferRender: true,
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1).max(120),
      status: z.enum(["published", "draft", "archived"]).default("published"),
      featured: z.boolean().default(false),

      /** First category is the primary one (highlighted, used for suggestions). */
      categories: z.array(reference("categories")).min(1),

      shortDescription: z.string().min(1).max(140),

      location: z.object({
        suburb: z.string().min(1),
        address: z.string().min(1),
        geo: z
          .object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          })
          .optional(),
      }),

      contact: z
        .object({
          phone: z
            .string()
            .regex(/^[+()\d\s-]{6,20}$/, "Phone may only contain digits, spaces, +, - and ()")
            .optional(),
          website: httpsUrl.optional(),
          email: z.email().optional(),
          facebook: socialUrl("facebook.com").optional(),
          instagram: socialUrl("instagram.com").optional(),
        })
        .default({}),

      hours: z
        .object({
          monday: dayHours,
          tuesday: dayHours,
          wednesday: dayHours,
          thursday: dayHours,
          friday: dayHours,
          saturday: dayHours,
          sunday: dayHours,
        })
        .optional(),

      rating: z
        .object({
          value: z.number().min(0).max(5),
          count: z.number().int().min(0),
        })
        .optional(),

      owner: z.string().min(1).optional(),
      listedSince: z.coerce.date(),

      hero: image().optional(),
      gallery: z
        .array(z.object({ src: image(), alt: z.string().min(1) }))
        .max(8)
        .default([]),
      mapImage: image().optional(),
    }),
});

export const collections = { categories, businesses };
