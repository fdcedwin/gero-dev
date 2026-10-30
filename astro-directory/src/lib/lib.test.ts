import { describe, expect, it } from "vitest";
import { displayUrl, mapsHref, telHref } from "./contact";
import { formatDayHours, formatTime, toOpeningHoursSpecification, type WeeklyHours } from "./hours";
import { serializeJsonLd } from "./json-ld";
import { findUnsafeMarkdown } from "./markdown-safety";
import { starStates } from "./rating";
import { buildCategoryIndex, getRelated, type RelatableItem } from "./related";

describe("hours", () => {
  it("formats 24h times as 12h", () => {
    expect(formatTime("06:30")).toBe("6:30am");
    expect(formatTime("15:00")).toBe("3:00pm");
    expect(formatTime("12:00")).toBe("12:00pm");
    expect(formatTime("00:05")).toBe("12:05am");
  });

  it("formats a day", () => {
    expect(formatDayHours("closed")).toBe("Closed");
    expect(formatDayHours({ open: "07:00", close: "20:00" })).toBe("7:00am — 8:00pm");
  });

  it("skips closed days in schema.org output", () => {
    const open = { open: "09:00", close: "17:00" };
    const hours: WeeklyHours = {
      monday: open,
      tuesday: open,
      wednesday: open,
      thursday: open,
      friday: open,
      saturday: "closed",
      sunday: "closed",
    };
    const spec = toOpeningHoursSpecification(hours);
    expect(spec).toHaveLength(5);
    expect(spec[0]).toMatchObject({ dayOfWeek: "https://schema.org/Monday", opens: "09:00" });
  });
});

describe("rating", () => {
  it("rounds to the nearest whole star and clamps", () => {
    expect(starStates(4.3).filter((s) => s === "filled")).toHaveLength(4);
    expect(starStates(4.6).filter((s) => s === "filled")).toHaveLength(5);
    expect(starStates(-1)).toEqual(Array(5).fill("outlined"));
    expect(starStates(9)).toEqual(Array(5).fill("filled"));
  });
});

describe("contact", () => {
  it("builds tel: links", () => {
    expect(telHref("(08) 9949 9750")).toBe("tel:0899499750");
    expect(telHref("+61 8 9949 9750")).toBe("tel:+61899499750");
  });

  it("shortens URLs for display", () => {
    expect(displayUrl("https://www.website.com.au/")).toBe("website.com.au");
    expect(displayUrl("https://shop.example.com/menu/")).toBe("shop.example.com/menu");
  });

  it("encodes map queries", () => {
    expect(mapsHref("Cafe & Co", "1 Main St")).toContain(
      "query=Cafe%20%26%20Co%2C%201%20Main%20St",
    );
  });
});

describe("serializeJsonLd", () => {
  it("cannot break out of the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("findUnsafeMarkdown", () => {
  it("accepts ordinary Markdown", () => {
    const md =
      "Hello **bold**, kids < 5 eat free.\n\n- [Menu](https://example.com/menu)\n- [Call](tel:0899499750)\n\n[ref]: https://example.com";
    expect(findUnsafeMarkdown(md)).toEqual([]);
  });

  it.each([
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    '<iframe src="https://evil.example"></iframe>',
    "<!-- hidden -->",
    "[x](javascript:alert(1))",
    "[x](jav&#x61;script:alert(1))",
    "[x]( data:text/html,hi)",
    "[x]: vbscript:msgbox",
  ])("rejects %s", (md) => {
    expect(findUnsafeMarkdown(md).length).toBeGreaterThan(0);
  });
});

describe("related", () => {
  const item = (id: string, categoryIds: string[], rating?: number): RelatableItem => ({
    id,
    name: id,
    categoryIds,
    rating,
  });
  const items = [
    item("a", ["food", "cafe"]),
    item("b", ["food", "cafe"], 4),
    item("c", ["food"], 5),
    item("d", ["cafe", "food"], 3),
    item("e", ["salon"]),
  ];
  const index = buildCategoryIndex(items);

  it("never suggests the business itself or unrelated ones", () => {
    const ids = getRelated(items[0]!, index, 10).map((r) => r.id);
    expect(ids).not.toContain("a");
    expect(ids).not.toContain("e");
  });

  it("ranks by shared categories, then same primary, then rating", () => {
    expect(getRelated(items[0]!, index, 3).map((r) => r.id)).toEqual(["b", "d", "c"]);
  });

  it("returns nothing when no category is shared", () => {
    expect(getRelated(items[4]!, index)).toEqual([]);
  });
});
