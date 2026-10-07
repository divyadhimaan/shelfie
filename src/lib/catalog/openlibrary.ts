/** Open Library search client (CAT-2). Docs: https://openlibrary.org/dev/docs/api/search */

const SEARCH_URL = "https://openlibrary.org/search.json";
const FIELDS = [
  "key",
  "title",
  "subtitle",
  "author_name",
  "author_key",
  "first_publish_year",
  "number_of_pages_median",
  "cover_i",
  "subject",
].join(",");

// Open Library asks clients to identify themselves; identified clients get higher rate limits.
const USER_AGENT = `Shelfie/0.1 (${process.env.OPENLIBRARY_CONTACT ?? "https://github.com/divyadhimaan/shelfie"})`;

export type OpenLibraryWork = {
  /** "OL45804W" */
  workId: string;
  title: string;
  subtitle: string | null;
  authors: { name: string; olAuthorId: string | null }[];
  firstPublishedYear: number | null;
  pages: number | null;
  coverUrl: string | null;
  subjects: string[];
};

type SearchDoc = {
  key: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  author_key?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
};

async function search(params: Record<string, string>, attempt = 0): Promise<SearchDoc[]> {
  const url = new URL(SEARCH_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });

  if ((response.status === 429 || response.status >= 500) && attempt < 2) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    return search(params, attempt + 1);
  }
  if (!response.ok) throw new Error(`Open Library search failed (${response.status})`);

  const body = (await response.json()) as { docs?: SearchDoc[] };
  return body.docs ?? [];
}

function toWork(doc: SearchDoc): OpenLibraryWork {
  const names = doc.author_name ?? [];
  const keys = doc.author_key ?? [];
  return {
    workId: doc.key.replace("/works/", ""),
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    authors: names.map((name, i) => ({ name, olAuthorId: keys[i] ?? null })),
    firstPublishedYear: doc.first_publish_year ?? null,
    pages: doc.number_of_pages_median ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
    subjects: doc.subject ?? [],
  };
}

export function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/^(the|a|an) /, "")
    .trim();
}

function lastName(author: string) {
  const parts = normalizeForMatch(author).split(" ");
  return parts[parts.length - 1] ?? "";
}

/** A title search result counts only if both the title and the author's surname line up. */
function isPlausibleMatch(doc: SearchDoc, title: string, author: string) {
  const wanted = normalizeForMatch(title);
  const found = normalizeForMatch(doc.title);
  const titleOk = found === wanted || found.startsWith(wanted) || wanted.startsWith(found);
  const surname = lastName(author);
  const authorOk = !surname || (doc.author_name ?? []).some((name) => lastName(name) === surname);
  return titleOk && authorOk;
}

/** Search-friendly title: drop "(Series, #1)" and subtitles after a colon. */
export function searchTitle(title: string) {
  return title
    .replace(/\s*\(.*\)\s*$/, "")
    .split(":")[0]
    .trim();
}

export async function findWork(book: {
  title: string;
  author: string;
  isbn13: string | null;
  isbn10: string | null;
}): Promise<OpenLibraryWork | null> {
  for (const isbn of [book.isbn13, book.isbn10]) {
    if (!isbn) continue;
    const [doc] = await search({ isbn });
    if (doc) return toWork(doc);
  }

  const title = searchTitle(book.title);
  if (!title) return null;
  const docs = await search({ title, ...(book.author ? { author: book.author } : {}) });
  const doc = docs.find((d) => isPlausibleMatch(d, title, book.author));
  return doc ? toWork(doc) : null;
}
