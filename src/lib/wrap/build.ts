/** Turns a year of reads into the Year Shelfie card sequence (WRP-1, WRP-2). Pure, so it's easy to test. */
import { type FinishedRead, computeStats } from "@/lib/stats/compute";

export const CARD_SIZES = {
  story: { width: 1080, height: 1920, label: "Story 9:16" },
  portrait: { width: 1080, height: 1350, label: "Portrait 4:5" },
  square: { width: 1080, height: 1080, label: "Square 1:1" },
} as const;

export type CardSize = keyof typeof CARD_SIZES;

export const isCardSize = (value: string | null): value is CardSize =>
  !!value && value in CARD_SIZES;

type Book = { title: string; author: string | null; coverUrl: string | null };

export type WrapCard =
  | { kind: "intro"; year: number; name: string | null }
  | { kind: "books"; year: number; books: number; pages: number }
  | { kind: "genre"; genre: string; books: number; share: number; runnersUp: string[] }
  | { kind: "author"; author: string; books: number }
  | { kind: "authors"; distinct: number }
  | { kind: "favourite"; book: Book; rating: number }
  | { kind: "month"; month: string; books: number }
  | { kind: "longest"; book: Book; pages: number }
  | { kind: "collage"; year: number; covers: string[]; books: number }
  | {
      kind: "summary";
      year: number;
      books: number;
      pages: number;
      averageRating: number | null;
      topGenre: string | null;
      topAuthor: string | null;
      favourite: string | null;
    };

export type CardKind = WrapCard["kind"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toBook = (read: FinishedRead): Book => ({
  title: read.title,
  author: read.authors[0] ?? null,
  coverUrl: read.coverUrl,
});

/** Cards for one year; cards with nothing to say are left out. */
export function buildWrap(
  allReads: FinishedRead[],
  year: number,
  name: string | null = null,
): WrapCard[] {
  const reads = allReads.filter((r) => r.finishedAt?.startsWith(String(year)));
  if (reads.length === 0) return [];

  const stats = computeStats(allReads, year);
  const cards: WrapCard[] = [
    { kind: "intro", year, name },
    { kind: "books", year, books: stats.booksRead, pages: stats.pagesRead },
  ];

  const [topGenre, ...otherGenres] = stats.topGenres;
  if (topGenre) {
    cards.push({
      kind: "genre",
      genre: topGenre.name,
      books: topGenre.count,
      share: Math.round((topGenre.count / stats.booksRead) * 100),
      runnersUp: otherGenres.slice(0, 2).map((g) => g.name),
    });
  }

  const [topAuthor] = stats.topAuthors;
  if (topAuthor && topAuthor.count >= 2) {
    cards.push({ kind: "author", author: topAuthor.name, books: topAuthor.count });
  } else {
    const distinct = new Set(reads.map((r) => r.authors[0]).filter(Boolean)).size;
    if (distinct > 1) cards.push({ kind: "authors", distinct });
  }

  // Highest rating; ties go to the most recently finished.
  const favourite = reads
    .filter((r) => r.rating !== null)
    .sort(
      (a, b) =>
        (b.rating as number) - (a.rating as number) ||
        (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""),
    )[0];
  if (favourite)
    cards.push({ kind: "favourite", book: toBook(favourite), rating: favourite.rating as number });

  const busiest = stats.byPeriod.reduce(
    (best, p, i) => (p.books > stats.byPeriod[best].books ? i : best),
    0,
  );
  if (stats.byPeriod[busiest].books >= 2) {
    cards.push({
      kind: "month",
      month: MONTH_NAMES[busiest],
      books: stats.byPeriod[busiest].books,
    });
  }

  if (stats.longest && stats.longest.pages > 0) {
    cards.push({
      kind: "longest",
      book: {
        title: stats.longest.title,
        author: stats.longest.author,
        coverUrl: stats.longest.coverUrl,
      },
      pages: stats.longest.pages,
    });
  }

  const covers = [...new Set(reads.map((r) => r.coverUrl).filter((c): c is string => !!c))];
  if (covers.length >= 3)
    cards.push({ kind: "collage", year, covers: covers.slice(0, 12), books: reads.length });

  cards.push({
    kind: "summary",
    year,
    books: stats.booksRead,
    pages: stats.pagesRead,
    averageRating: stats.averageRating,
    topGenre: topGenre?.name ?? null,
    topAuthor: topAuthor?.name ?? null,
    favourite: favourite?.title ?? null,
  });

  return cards;
}
