/** Pure reading-stats calculations (STA-1, STA-3, STA-7). Kept free of the database so they're easy to test. */

export type FinishedRead = {
  workId: string;
  title: string;
  authors: string[];
  genres: string[];
  coverUrl: string | null;
  /** ISO date, or null for reads Goodreads never dated */
  finishedAt: string | null;
  rating: number | null;
  pages: number | null;
};

export type BookRef = {
  workId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  pages: number;
};

export type RankedItem = { name: string; count: number };

export type PeriodCount = { label: string; books: number; pages: number };

export type ReadingStats = {
  /** null = all time */
  year: number | null;
  booksRead: number;
  pagesRead: number;
  /** Books in the period whose page count is unknown (pages total is a lower bound). */
  booksMissingPages: number;
  averageRating: number | null;
  ratedBooks: number;
  averageLength: number | null;
  longest: BookRef | null;
  shortest: BookRef | null;
  /** Months of the year, or years for all time */
  byPeriod: PeriodCount[];
  /** Whole-star buckets 1–5; half stars round down (4.5 counts as 4★). */
  ratingDistribution: { stars: number; count: number }[];
  topGenres: RankedItem[];
  topAuthors: RankedItem[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const yearOf = (iso: string | null) => (iso ? Number(iso.slice(0, 4)) : null);

/** Years that have at least one dated finished read, newest first. */
export function yearsWithReads(reads: FinishedRead[]): number[] {
  const years = new Set<number>();
  for (const read of reads) {
    const y = yearOf(read.finishedAt);
    if (y) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

function rank(counts: Map<string, number>, limit: number): RankedItem[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function toRef(read: FinishedRead): BookRef {
  return {
    workId: read.workId,
    title: read.title,
    author: read.authors[0] ?? null,
    coverUrl: read.coverUrl,
    pages: read.pages ?? 0,
  };
}

/**
 * Stats for one calendar year, or all time when `year` is null.
 * Every finished read counts, so a re-read in the same year counts twice, as Goodreads does.
 */
export function computeStats(allReads: FinishedRead[], year: number | null): ReadingStats {
  const reads = year === null ? allReads : allReads.filter((r) => yearOf(r.finishedAt) === year);

  const withPages = reads.filter((r): r is FinishedRead & { pages: number } => (r.pages ?? 0) > 0);
  const pagesRead = withPages.reduce((sum, r) => sum + r.pages, 0);
  const rated = reads.filter((r) => r.rating !== null);
  const bySize = [...withPages].sort((a, b) => b.pages - a.pages);

  let byPeriod: PeriodCount[];
  if (year !== null) {
    byPeriod = MONTHS.map((label) => ({ label, books: 0, pages: 0 }));
    for (const read of reads) {
      const month = Number(read.finishedAt?.slice(5, 7)) - 1;
      byPeriod[month].books++;
      byPeriod[month].pages += read.pages ?? 0;
    }
  } else {
    const years = yearsWithReads(reads).sort((a, b) => a - b);
    const first = years[0];
    const last = years[years.length - 1];
    byPeriod = [];
    // Keep empty years in the run so gaps show as gaps.
    if (first !== undefined && last !== undefined) {
      for (let y = first; y <= last; y++) byPeriod.push({ label: String(y), books: 0, pages: 0 });
      for (const read of reads) {
        const y = yearOf(read.finishedAt);
        if (y === null) continue;
        const period = byPeriod[y - first];
        period.books++;
        period.pages += read.pages ?? 0;
      }
    }
  }

  const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: rated.filter((r) => Math.floor(r.rating as number) === stars).length,
  }));

  const genres = new Map<string, number>();
  const authors = new Map<string, number>();
  for (const read of reads) {
    for (const genre of read.genres) genres.set(genre, (genres.get(genre) ?? 0) + 1);
    const author = read.authors[0];
    if (author) authors.set(author, (authors.get(author) ?? 0) + 1);
  }

  return {
    year,
    booksRead: reads.length,
    pagesRead,
    booksMissingPages: reads.length - withPages.length,
    averageRating: rated.length
      ? Math.round((rated.reduce((sum, r) => sum + (r.rating as number), 0) / rated.length) * 100) /
        100
      : null,
    ratedBooks: rated.length,
    averageLength: withPages.length ? Math.round(pagesRead / withPages.length) : null,
    longest: bySize[0] ? toRef(bySize[0]) : null,
    shortest: bySize.length > 1 ? toRef(bySize[bySize.length - 1]) : null,
    byPeriod,
    ratingDistribution,
    topGenres: rank(genres, 6),
    topAuthors: rank(authors, 5),
  };
}
