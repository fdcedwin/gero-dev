import { defineConfig } from "eslint/config";
import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Rendering unescaped HTML is how XSS gets in; require a deliberate disable comment.
      "astro/no-set-html-directive": "error",
    },
  },
);
