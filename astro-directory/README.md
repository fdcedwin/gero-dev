# What's On Gero: Astro directory experiment

An experiment in generating the business directory with [Astro](https://astro.build). It is data-driven: one Markdown file per business, validated at build time, and every profile page generated from a single template based on `../business-profile.html`.

**Everything lives in this `astro-directory/` folder.** The existing site files at the repo root (`index.html`, `business-profile.html`, `submit-business.html`, `assets/`) are not modified. Styles, fonts and images used here are duplicates of those originals.

The listings under `src/content/businesses/` are **placeholder / fake data** for testing.

## Quick start

```sh
cd astro-directory
nvm use            # Node version from .nvmrc
npm ci             # install exact locked versions
npm run dev        # http://localhost:4321
```

| Command                          | What it does                                                  |
| -------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                    | Local dev server with hot reload                              |
| `npm run build`                  | Type-check (`astro check`), then build static site to `dist/` |
| `npm run preview`                | Serve the built `dist/` locally                               |
| `npm test`                       | Unit tests (Vitest)                                           |
| `npm run lint` / `format`        | ESLint / Prettier                                             |
| `npm run new:business -- "Name"` | Scaffold a new listing                                        |

## Managing businesses

Each business is a folder under `src/content/businesses/`. **The folder name is the URL**:

```
src/content/businesses/cafe-fleur/
  index.md            → /directory/cafe-fleur/
  gallery-1.jpg       (photos live next to the listing)
```

### Add

```sh
npm run new:business -- "Cafe Fleur"
```

Fill in `src/content/businesses/cafe-fleur/index.md`, add photos to the same folder, set `status: published`. Use `src/content/businesses/cafe-fleur/index.md` as the reference example.

The build **fails with a clear message** if anything is wrong. Some examples:

- missing required fields, or a short description over 140 characters
- a description over 1,000 characters
- a link that is not `https://`
- a Facebook or Instagram field that is not a facebook.com or instagram.com URL
- opening hours not written as `"HH:MM"`
- an unknown category
- raw HTML in the description

### Edit

Edit the `index.md`. Templates never need to change.

### Remove

- **Temporarily:** set `status: archived` (or `draft`). The page is no longer generated.
- **Permanently:** delete the folder.

If a page has been public, consider adding a redirect in `astro.config.mjs` (`redirects: { "/directory/old-slug/": "/directory/" }`).

### Rename (change URL)

Rename the folder and add a redirect from the old URL.

### Categories

Categories are defined in `src/content/categories.yaml`. The key is the URL (`/directory/category/<key>/`). A business lists categories by key, primary first. Categories with no published businesses get no page.

## Project structure

```
src/
  content.config.ts        Schema for businesses and categories (the data contract)
  content/                 Listing data (Markdown + photos) and categories.yaml
  pages/
    directory/[slug].astro                       Business profile template (one for all)
    directory/[...page].astro                    Directory, paginated
    directory/category/[category]/[...page].astro  Category listings, paginated
  components/site/         Header, Footer, CTA, Breadcrumbs
  components/business/     Profile building blocks (Gallery, ContactInfo, OpeningHours…)
  lib/                     Pure helpers + unit tests (hours, ratings, related, JSON-LD, safety)
  layouts/BaseLayout.astro <head>, SEO and Open Graph tags, structured data
  styles/                  SCSS (ported from the original templates)
public/                    Fonts, static images, _headers
```

## Security notes

- **Output is static HTML.** There is no server or database to attack at runtime.
- **Escaping:** all listing fields are escaped by Astro. Raw HTML in descriptions is rejected at build time; Markdown is fine. `set:html` is banned by lint, except for JSON-LD, which is escaped by `serializeJsonLd`.
- **CSP:** Astro emits a hash-based `script-src`/`style-src` CSP per page (`security.csp`). If you add third-party scripts such as Google Tag Manager, add them to the CSP config or they will be blocked.
- **Security headers:** HSTS, `frame-ancestors`, nosniff, Referrer-Policy and Permissions-Policy live in `public/_headers`. That file works on Netlify and Cloudflare Pages; on Vercel, move them to `vercel.json`.
- **Search indexing:** controlled by `SITE_INDEXABLE` (see `.env.example`). It defaults to `noindex` and should be set to `true` only for production.
- **Dependencies:** versions are pinned exactly and the lockfile is committed. `ci.example.yml` is a ready-made CI workflow (`npm audit`, lint, tests, build; actions pinned to commit SHAs). Copy it to `.github/workflows/` at the repo root to enable it.
- **Forms:** the newsletter and submit-business forms are not wired to a backend yet. They will need server-side validation, rate limiting and spam protection.
