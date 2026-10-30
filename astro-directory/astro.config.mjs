// @ts-check
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.whatsongero.com",
  trailingSlash: "always",

  integrations: [sitemap()],

  env: {
    schema: {
      // Keep false on staging/previews. Set SITE_INDEXABLE=true only for the production build.
      SITE_INDEXABLE: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
    },
  },

  markdown: {
    // Listings have no code blocks; Shiki's inline styles would also conflict with the CSP.
    syntaxHighlight: false,
  },

  security: {
    // Emits a per-page CSP <meta> with hashes for every script/style Astro outputs.
    csp: true,
  },
});
