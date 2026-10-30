#!/usr/bin/env node
// Scaffolds a new listing: npm run new:business -- "Business Name"
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const name = process.argv.slice(2).join(" ").trim();
if (!name) {
  console.error('Usage: npm run new:business -- "Business Name"');
  process.exit(1);
}

const slug = name
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/['’]/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug || slug === "category" || /^\d+$/.test(slug)) {
  console.error(`Can't build a valid URL slug from "${name}". Choose a different name.`);
  process.exit(1);
}

const dir = join("src", "content", "businesses", slug);
if (existsSync(dir)) {
  console.error(`${dir} already exists.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const yamlName = JSON.stringify(name);

const template = `---
name: ${yamlName}
status: draft # change to "published" when ready
categories: [] # keys from src/content/categories.yaml, primary first
shortDescription: "" # max 140 characters
location:
  suburb: ""
  address: ""
contact:
  # phone: (08) 0000 0000
  # website: https://example.com.au
  # email: hello@example.com.au
  # facebook: https://www.facebook.com/...
  # instagram: https://www.instagram.com/...
# hours:
#   monday: { open: "09:00", close: "17:00" }
#   tuesday: { open: "09:00", close: "17:00" }
#   wednesday: { open: "09:00", close: "17:00" }
#   thursday: { open: "09:00", close: "17:00" }
#   friday: { open: "09:00", close: "17:00" }
#   saturday: closed
#   sunday: closed
listedSince: ${today}
gallery: []
#   - { src: ./photo-1.jpg, alt: Describe the photo }
---

Full description (max 1,000 characters).
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "index.md"), template);
console.log(`Created ${join(dir, "index.md")} → /directory/${slug}/`);
