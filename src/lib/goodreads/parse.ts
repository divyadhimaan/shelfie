import { csvToRecords } from "./csv";

export type ReadingStatus = "want_to_read" | "reading" | "read" | "dnf" | "paused";
export type BookFormat = "print" | "ebook" | "audio" | "unknown";

/** One Goodreads export row, cleaned up (IMP-2, IMP-3, IMP-4). */
export type GoodreadsBook = {
  goodreadsId: string | null;
  title: string;
  series: string | null;
  seriesPosition: number | null;
  author: string;
  additionalAuthors: string[];
  isbn10: string | null;
  isbn13: string | null;
  /** 1–5, or null when unrated (Goodreads exports 0). */
  rating: number | null;
  averageRating: number | null;
  publisher: string | null;
  format: BookFormat;
  pages: number | null;
  yearPublished: number | null;
  originalPublicationYear: number | null;
  /** ISO dates (YYYY-MM-DD) */
  dateRead: string | null;
  dateAdded: string | null;
  status: ReadingStatus;
  tags: string[];
  review: string | null;
  privateNotes: string | null;
  readCount: number;
};

export const REQUIRED_HEADERS = ["Title", "Author", "Exclusive Shelf"] as const;

export class GoodreadsFormatError extends Error {}

/** Goodreads wraps ISBNs as ="0441172717" so spreadsheets keep leading zeros. */
export function cleanIsbn(value: string | undefined): string | null {
  const digits = (value ?? "")
    .replace(/^="?|"$/g, "")
    .replace(/[^0-9Xx]/g, "")
    .toUpperCase();
  return digits.length === 10 || digits.length === 13 ? digits : null;
}

/** Goodreads dates look like 2024/03/15 (sometimes 2024/03 or 2024). */
export function parseGoodreadsDate(value: string | undefined): string | null {
  const match = (value ?? "").trim().match(/^(\d{4})(?:[/-](\d{1,2}))?(?:[/-](\d{1,2}))?$/);
  if (!match) return null;
  const [, year, month = "1", day = "1"] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}

function parseNumber(value: string | undefined): number | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** "Dune Messiah (Dune Chronicles, #2)" → title, series, position. */
export function splitSeries(rawTitle: string): {
  title: string;
  series: string | null;
  seriesPosition: number | null;
} {
  const match = rawTitle.match(/^(.*\S)\s*\(([^()]+?),?\s*#([\d.]+)[^()]*\)\s*$/);
  if (!match) return { title: rawTitle.trim(), series: null, seriesPosition: null };
  const position = Number(match[3]);
  return {
    title: match[1].trim(),
    series: match[2].trim(),
    seriesPosition: Number.isFinite(position) ? position : null,
  };
}

function formatFromBinding(binding: string | undefined): BookFormat {
  const b = (binding ?? "").toLowerCase();
  if (!b) return "unknown";
  if (b.includes("kindle") || b.includes("ebook") || b.includes("nook")) return "ebook";
  if (b.includes("audio")) return "audio";
  if (
    b.includes("hardcover") ||
    b.includes("paperback") ||
    b.includes("mass market") ||
    b.includes("board")
  )
    return "print";
  return "unknown";
}

const DNF_SHELVES = new Set([
  "dnf",
  "did-not-finish",
  "did-not-finish-dnf",
  "abandoned",
  "gave-up",
]);
const PAUSED_SHELVES = new Set(["paused", "on-hold", "on-pause"]);
const EXCLUSIVE = new Set(["read", "currently-reading", "to-read"]);

function statusFor(exclusiveShelf: string, shelves: string[]): ReadingStatus {
  if (exclusiveShelf === "currently-reading") return "reading";
  if (exclusiveShelf === "to-read") return "want_to_read";
  if (exclusiveShelf === "read") return "read";
  // Custom exclusive shelves (e.g. "dnf") appear here too.
  const all = [exclusiveShelf, ...shelves];
  if (all.some((s) => DNF_SHELVES.has(s))) return "dnf";
  if (all.some((s) => PAUSED_SHELVES.has(s))) return "paused";
  return "want_to_read";
}

function cleanReview(value: string | undefined): string | null {
  const text = (value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
  return text || null;
}

export function normalizeRow(raw: Record<string, string>): GoodreadsBook | null {
  const rawTitle = (raw.Title ?? "").trim();
  if (!rawTitle) return null;

  const { title, series, seriesPosition } = splitSeries(rawTitle);
  const exclusiveShelf = (raw["Exclusive Shelf"] ?? "").trim().toLowerCase();
  const shelves = (raw.Bookshelves ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const status = statusFor(exclusiveShelf, shelves);
  const statusShelves =
    status === "dnf" ? DNF_SHELVES : status === "paused" ? PAUSED_SHELVES : new Set<string>();
  const tags = shelves.filter((s) => !EXCLUSIVE.has(s) && !statusShelves.has(s));

  const rating = parseNumber(raw["My Rating"]);
  const readCount = parseNumber(raw["Read Count"]);

  return {
    goodreadsId: (raw["Book Id"] ?? "").trim() || null,
    title,
    series,
    seriesPosition,
    author: (raw.Author ?? "").trim(),
    additionalAuthors: (raw["Additional Authors"] ?? "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    isbn10: cleanIsbn(raw.ISBN),
    isbn13: cleanIsbn(raw.ISBN13),
    rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    averageRating: parseNumber(raw["Average Rating"]),
    publisher: (raw.Publisher ?? "").trim() || null,
    format: formatFromBinding(raw.Binding),
    pages: parseNumber(raw["Number of Pages"]) || null,
    yearPublished: parseNumber(raw["Year Published"]),
    originalPublicationYear: parseNumber(raw["Original Publication Year"]),
    dateRead: parseGoodreadsDate(raw["Date Read"]),
    dateAdded: parseGoodreadsDate(raw["Date Added"]),
    status,
    tags,
    review: cleanReview(raw["My Review"]),
    privateNotes: cleanReview(raw["Private Notes"]),
    // Goodreads exports 0 for books never marked read.
    readCount: status === "read" ? Math.max(1, readCount ?? 1) : Math.max(0, readCount ?? 0),
  };
}

/** Parses a Goodreads library export. Throws GoodreadsFormatError when the file isn't one. */
export function parseGoodreadsExport(csv: string) {
  const { headers, records } = csvToRecords(csv);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new GoodreadsFormatError(
      `This doesn't look like a Goodreads export (missing ${missing.join(", ")}).`,
    );
  }
  return records.map((raw, index) => ({ rowNumber: index + 1, raw, book: normalizeRow(raw) }));
}
