import { describe, expect, it } from "vitest";
import { type FinishedRead, computeStats, yearsWithReads } from "./compute";

let n = 0;
const read = (over: Partial<FinishedRead>): FinishedRead => ({
  workId: `w${n++}`,
  title: "Book",
  authors: ["Author"],
  genres: [],
  coverUrl: null,
  finishedAt: "2026-01-10",
  rating: null,
  pages: 300,
  ...over,
});

const reads: FinishedRead[] = [
  read({
    title: "Dune",
    authors: ["Frank Herbert"],
    genres: ["Science Fiction"],
    finishedAt: "2026-01-12",
    rating: 5,
    pages: 688,
  }),
  read({
    title: "Hobbit",
    authors: ["J.R.R. Tolkien"],
    genres: ["Fantasy"],
    finishedAt: "2026-03-20",
    rating: 4,
    pages: 300,
  }),
  read({
    title: "Fellowship",
    authors: ["J.R.R. Tolkien", "Alan Lee"],
    genres: ["Fantasy"],
    finishedAt: "2026-03-30",
    rating: null,
    pages: 432,
  }),
  read({
    title: "Circe",
    authors: ["Madeline Miller"],
    genres: ["Fantasy", "Mythology"],
    finishedAt: "2026-04-02",
    rating: 4.5,
    pages: null,
  }),
  read({
    title: "P&P",
    authors: ["Jane Austen"],
    genres: ["Classics"],
    finishedAt: "2025-09-14",
    rating: 5,
    pages: 480,
  }),
  read({
    title: "Undated re-read",
    authors: ["J.R.R. Tolkien"],
    finishedAt: null,
    rating: null,
    pages: 300,
  }),
];

describe("computeStats for a year", () => {
  const stats = computeStats(reads, 2026);

  it("counts books and known pages", () => {
    expect(stats.booksRead).toBe(4);
    expect(stats.pagesRead).toBe(688 + 300 + 432);
    expect(stats.booksMissingPages).toBe(1);
    expect(stats.averageLength).toBe(Math.round((688 + 300 + 432) / 3));
  });

  it("averages only rated books", () => {
    expect(stats.ratedBooks).toBe(3);
    expect(stats.averageRating).toBe(4.5);
  });

  it("buckets by month and rounds half stars down", () => {
    expect(stats.byPeriod).toHaveLength(12);
    expect(stats.byPeriod[2]).toEqual({ label: "Mar", books: 2, pages: 732 });
    expect(stats.ratingDistribution.find((b) => b.stars === 4)?.count).toBe(2);
  });

  it("ranks genres and primary authors", () => {
    expect(stats.topGenres[0]).toEqual({ name: "Fantasy", count: 3 });
    expect(stats.topAuthors[0]).toEqual({ name: "J.R.R. Tolkien", count: 2 });
    expect(stats.topAuthors.find((a) => a.name === "Alan Lee")).toBeUndefined();
  });

  it("finds longest and shortest by known pages", () => {
    expect(stats.longest?.title).toBe("Dune");
    expect(stats.shortest?.title).toBe("Hobbit");
  });
});

describe("computeStats all time", () => {
  const stats = computeStats(reads, null);

  it("includes undated reads in totals but not in the yearly chart", () => {
    expect(stats.booksRead).toBe(6);
    expect(stats.byPeriod.map((p) => [p.label, p.books])).toEqual([
      ["2025", 1],
      ["2026", 4],
    ]);
  });

  it("lists years newest first", () => {
    expect(yearsWithReads(reads)).toEqual([2026, 2025]);
  });
});

describe("empty library", () => {
  it("returns zeros, not NaN", () => {
    const stats = computeStats([], 2026);
    expect(stats.booksRead).toBe(0);
    expect(stats.averageRating).toBeNull();
    expect(stats.averageLength).toBeNull();
    expect(stats.longest).toBeNull();
  });
});
