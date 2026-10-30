/**
 * Listing descriptions are rendered from Markdown, and the Markdown processor passes raw HTML
 * through untouched. Rather than sanitising after the fact, unsafe input is rejected at build
 * time so it can never be published: no raw HTML, and links may only use safe schemes.
 */

const HTML_TAG = /<\/?[a-z][^>]*>|<!--/i;
const INLINE_LINK = /\]\(\s*<?([^\s)>]+)/g;
const REFERENCE_LINK = /^\s*\[[^\]]+\]:\s*<?(\S+?)>?\s*$/gm;
const SAFE_DESTINATION = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

export function findUnsafeMarkdown(markdown: string): string[] {
  const problems: string[] = [];

  const tag = markdown.match(HTML_TAG);
  if (tag) {
    problems.push(
      `raw HTML is not allowed (found "${tag[0].slice(0, 40)}"); use Markdown or plain text`,
    );
  }

  for (const pattern of [INLINE_LINK, REFERENCE_LINK]) {
    for (const [, destination = ""] of markdown.matchAll(pattern)) {
      if (!SAFE_DESTINATION.test(destination)) {
        problems.push(
          `link "${destination.slice(0, 60)}" must start with https://, http://, mailto:, tel:, / or #`,
        );
      }
    }
  }

  return problems;
}
