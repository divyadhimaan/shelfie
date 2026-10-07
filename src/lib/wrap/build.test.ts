import { describe, expect, it } from "vitest";
import type { FinishedRead } from "@/lib/stats/compute";
import { buildWrap } from "./build";

let n = 0;
const read = (over: Partial<FinishedRead>): FinishedRead => ({
  workId: `w${n++}`,
  title: `Book ${n}`,
  authors: [`Author ${n}`],
  genres: [],
  coverUrl: `https://covers.example/${n}.jpg`,
  finishedAt: "2026-01-10",
  rating: null,
  pages: 300,
  ...over,
});

const reads = [
  read({
    title: "Dune",
    genres: ["Science Fiction"],
    rating: 5,
    finishedAt: "2026-01-12",
    pages: 688,
  }),
  read({
    title: "Hobbit",
    authors: ["Tolkien"],
    genres: ["Fantasy"],
    rating: 4,
    finishedAt: "2026-03-20",
  }),
  read({
    title: "Fellowship",
    authors: ["Tolkien"],
    genres: ["Fantasy"],
    finishedAt: "2026-03-30",
  }),
  read({ title: "Hail Mary", genres: ["Science Fiction"], rating: 5, finishedAt: "2026-05-03" }),
  read({ title: "Old one", finishedAt: "2025-02-01", rating: 5 }),
];

describe("buildWrap", () => {
  const cards = buildWrap(reads, 2026, "Divya");
  const kinds = cards.map((c) => c.kind);

  it("orders the story and ends on the summary", () => {
    expect(kinds).toEqual([
      "intro",
      "books",
      "genre",
      "author",
      "favourite",
      "month",
      "longest",
      "collage",
      "summary",
    ]);
  });

  it("picks the most recent of tied favourites", () => {
    const fav = cards.find((c) => c.kind === "favourite");
    expect(fav?.kind === "favourite" && fav.book.title).toBe("Hail Mary");
  });

  it("only counts the chosen year", () => {
    const books = cards.find((c) => c.kind === "books");
    expect(books?.kind === "books" && books.books).toBe(4);
  });

  it("names the busiest month only when it had at least two books", () => {
    const month = cards.find((c) => c.kind === "month");
    expect(month?.kind === "month" && month.month).toBe("March");
  });

  it("skips cards without data", () => {
    const lean = buildWrap([read({ finishedAt: "2026-06-01", coverUrl: null, pages: null })], 2026);
    expect(lean.map((c) => c.kind)).toEqual(["intro", "books", "summary"]);
  });

  it("returns nothing for a year without reads", () => {
    expect(buildWrap(reads, 2024)).toEqual([]);
  });
});
