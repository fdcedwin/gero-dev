/** "(08) 9949 9750" -> "tel:0899499750" */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** "https://www.website.com.au/" -> "website.com.au" */
export function displayUrl(url: string): string {
  const { hostname, pathname } = new URL(url);
  const path = pathname === "/" ? "" : pathname.replace(/\/$/, "");
  return `${hostname.replace(/^www\./, "")}${path}`;
}

/** Google Maps search link – no API key, nothing loaded until the visitor clicks. */
export function mapsHref(name: string, address: string): string {
  const query = encodeURIComponent(`${name}, ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
