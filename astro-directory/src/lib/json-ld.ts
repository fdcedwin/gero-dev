/**
 * Serialise structured data for a <script type="application/ld+json"> tag.
 * JSON.stringify alone is not safe here: a value containing "</script>" would close the tag
 * and allow HTML injection, so the HTML-significant characters are unicode-escaped.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[], site: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: new URL(item.href, site).href } : {}),
    })),
  };
}
