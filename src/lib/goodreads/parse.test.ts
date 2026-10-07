import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";
import {
  GoodreadsFormatError,
  cleanIsbn,
  parseGoodreadsDate,
  parseGoodreadsExport,
  splitSeries,
} from "./parse";

const sample = readFileSync(
  new URL("../../../docs/samples/goodreads_library_export.csv", import.meta.url),
  "utf8",
);

describe("parseCsv", () => {
  it("handles quotes, escaped quotes and newlines inside fields", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("strips a byte-order mark and blank lines", () => {
    expect(parseCsv("﻿a\n\n1\n")).toEqual([["a"], ["1"]]);
  });
});

describe("field cleanup", () => {
  it("unwraps Goodreads ISBNs", () => {
    expect(cleanIsbn('="0441172717"')).toBe("0441172717");
    expect(cleanIsbn('="9780441172719"')).toBe("9780441172719");
    expect(cleanIsbn('=""')).toBeNull();
  });

  it("parses Goodreads dates and rejects invalid ones", () => {
    expect(parseGoodreadsDate("2026/01/12")).toBe("2026-01-12");
    expect(parseGoodreadsDate("2026/3")).toBe("2026-03-01");
    expect(parseGoodreadsDate("2026/02/30")).toBeNull();
    expect(parseGoodreadsDate("")).toBeNull();
  });

  it("splits series out of titles", () => {
    expect(splitSeries("The Fellowship of the Ring (The Lord of the Rings, #1)")).toEqual({
      title: "The Fellowship of the Ring",
      series: "The Lord of the Rings",
      seriesPosition: 1,
    });
    expect(splitSeries("Dune (Dune #1)").series).toBe("Dune");
    expect(splitSeries("The Hobbit (Middle-earth Universe)").series).toBeNull();
  });
});

describe("parseGoodreadsExport", () => {
  const rows = parseGoodreadsExport(sample);
  const byTitle = (title: string) => rows.find((r) => r.book?.title === title)?.book;

  it("reads every row", () => {
    expect(rows).toHaveLength(14);
  });

  it("maps shelves to statuses and tags", () => {
    expect(byTitle("Babel")?.status).toBe("want_to_read");
    expect(byTitle("The Covenant of Water")?.status).toBe("reading");
    expect(byTitle("Ulysses")?.status).toBe("dnf");
    expect(byTitle("Ulysses")?.tags).toEqual([]);
    expect(byTitle("Dune")?.tags).toEqual(["sci-fi", "favorites"]);
  });

  it("treats a 0 rating as unrated and keeps re-read counts", () => {
    expect(byTitle("The Fellowship of the Ring")?.rating).toBeNull();
    expect(byTitle("The Hobbit (Middle-earth Universe)")?.readCount).toBe(2);
    expect(byTitle("Babel")?.readCount).toBe(0);
  });

  it("cleans reviews and keeps multi-line text", () => {
    expect(byTitle("Project Hail Mary")?.review).toBe(
      'Rocky!!! \n\nBest "buddy" story I\'ve read in years.',
    );
    expect(byTitle("Circe")?.review).toContain("\n\nSecond half");
  });

  it("detects formats and missing dates", () => {
    expect(byTitle("The Name of the Wind")?.format).toBe("ebook");
    expect(byTitle("The Name of the Wind")?.isbn13).toBeNull();
    expect(byTitle("Atomic Habits")?.dateRead).toBeNull();
    expect(byTitle("Atomic Habits")?.dateAdded).toBe("2025-11-02");
  });

  it("rejects files that aren't Goodreads exports", () => {
    expect(() => parseGoodreadsExport("name,email\nA,b@c.d")).toThrow(GoodreadsFormatError);
  });
});
