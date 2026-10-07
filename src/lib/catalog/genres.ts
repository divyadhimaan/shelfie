/**
 * Shelfie's fixed genre list (CAT-4). Open Library subjects and Goodreads shelves
 * are free text; mapping them onto this list keeps stats and wrap cards clean.
 */
export const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Romantasy",
  "Mystery",
  "Thriller",
  "Horror",
  "Historical Fiction",
  "Literary Fiction",
  "Classics",
  "Contemporary",
  "Young Adult",
  "Children's",
  "Graphic Novels",
  "Poetry",
  "Mythology",
  "Dystopian",
  "Humor",
  "Biography",
  "Memoir",
  "History",
  "Science",
  "Self-Help",
  "Business",
  "Psychology",
  "Philosophy",
  "Religion",
  "Politics",
  "True Crime",
  "Travel",
  "Food",
  "Art",
  "Non-Fiction",
] as const;

export type Genre = (typeof GENRES)[number];

// Checked in order; a subject can map to several genres.
const RULES: [RegExp, Genre][] = [
  [/romantasy|fantasy romance/, "Romantasy"],
  [/\bfantasy\b|magic|dragons|wizards/, "Fantasy"],
  [/science[- ]fiction|sci-?fi|\bspace\b|time travel|robots|aliens/, "Science Fiction"],
  [/\bromance\b|love stories/, "Romance"],
  [/mystery|detective|whodunit/, "Mystery"],
  [/thriller|suspense/, "Thriller"],
  [/horror|ghost stories/, "Horror"],
  [/historical fiction/, "Historical Fiction"],
  [/literary fiction|literary-fiction|fiction, literary|modern fiction/, "Literary Fiction"],
  [/classics?\b|classic literature/, "Classics"],
  [/contemporary/, "Contemporary"],
  // Audience tags only, not topics: "Homeless children" is about children, not for them.
  [
    /young adult (fiction|literature|books)|teen & young adult|^ya\b|\bya (fiction|fantasy)|^young[- ]adult$/,
    "Young Adult",
  ],
  [
    /juvenile (fiction|literature|works|fantasy|audience)|children'?s (books|stories|fiction|literature)|^children'?s$|^kids$/,
    "Children's",
  ],
  [/graphic novels?|comics?|manga/, "Graphic Novels"],
  [/poetry|poems/, "Poetry"],
  [/mythology|myths|greek gods/, "Mythology"],
  [/dystopia/, "Dystopian"],
  [/humou?r|comedy/, "Humor"],
  [/biography|biographies/, "Biography"],
  [/memoir|autobiography/, "Memoir"],
  [/\bhistory\b/, "History"],
  [/popular science|physics|biology|astronomy|\bscience\b(?![- ]fiction)/, "Science"],
  [/self-help|personal development|habits|success/, "Self-Help"],
  [/business|economics|management|entrepreneur/, "Business"],
  [/psychology/, "Psychology"],
  [/philosophy/, "Philosophy"],
  [/religion|spirituality|christian/, "Religion"],
  [/politics|political science/, "Politics"],
  [/true crime/, "True Crime"],
  [/travel/, "Travel"],
  [/cooking|cookbooks?|food/, "Food"],
  [/\bart\b|photography|design/, "Art"],
  [/non-?fiction/, "Non-Fiction"],
];

const NON_FICTION_ONLY = new Set<Genre>([
  "Biography",
  "Memoir",
  "History",
  "Science",
  "Self-Help",
  "Business",
  "Psychology",
  "Philosophy",
  "Religion",
  "Politics",
  "True Crime",
  "Travel",
  "Food",
  "Art",
  "Non-Fiction",
]);

/** Who a book is for, rather than what it is. Ranked after content genres. */
const AUDIENCE = new Set<Genre>(["Young Adult", "Children's"]);
/** Audience and format genres: catalogs attach these from single editions, so they need a strong signal. */
const NEEDS_STRONG_SIGNAL = new Set<Genre>([...AUDIENCE, "Graphic Novels"]);
const STRONG_MIN_MATCHES = 3;
const STRONG_MIN_SHARE = 0.1;
/** With this many subjects, one stray subject isn't enough to name a genre. */
const LONG_SUBJECT_LIST = 15;

const isFictionSubject = (subject: string) => {
  const s = subject.trim().toLowerCase();
  return !/non-?fiction/.test(s) && /^fiction\b|\bfiction$/.test(s);
};

/**
 * Maps Open Library subjects and the reader's Goodreads shelves to at most `limit` genres.
 * Shelves are a deliberate choice by a reader, so they count more than catalog subjects.
 */
export function normalizeGenres(subjects: string[], shelves: string[] = [], limit = 3): Genre[] {
  const counts = new Map<Genre, number>();
  const fromSubjects = new Map<Genre, number>();
  const fromShelves = new Set<Genre>();
  const tally = (text: string, weight: number, source: "subject" | "shelf") => {
    // Shelf names use hyphens ("young-adult"); test both spellings, counting each genre once.
    const variants = [text.toLowerCase(), text.toLowerCase().replace(/-/g, " ")];
    for (const [pattern, genre] of RULES) {
      if (!variants.some((v) => pattern.test(v))) continue;
      counts.set(genre, (counts.get(genre) ?? 0) + weight);
      if (source === "shelf") fromShelves.add(genre);
      else fromSubjects.set(genre, (fromSubjects.get(genre) ?? 0) + 1);
    }
  };
  for (const subject of subjects) tally(subject, 1, "subject");
  for (const shelf of shelves) tally(shelf, 3, "shelf");

  // A novel's "History" subject describes its setting, not its genre.
  if (subjects.some(isFictionSubject)) {
    for (const genre of NON_FICTION_ONLY) counts.delete(genre);
  }

  // Best content genre before pruning, so a book never ends up with none.
  const fallback = [...counts.entries()]
    .filter(([genre]) => !NEEDS_STRONG_SIGNAL.has(genre))
    .sort((a, b) => b[1] - a[1])[0];

  for (const genre of [...counts.keys()]) {
    if (fromShelves.has(genre)) continue; // the reader's own shelf always counts
    const matches = fromSubjects.get(genre) ?? 0;
    const strong =
      matches >= STRONG_MIN_MATCHES && matches / Math.max(1, subjects.length) >= STRONG_MIN_SHARE;
    if (NEEDS_STRONG_SIGNAL.has(genre) && !strong) counts.delete(genre);
    else if (subjects.length > LONG_SUBJECT_LIST && matches < 2) counts.delete(genre);
  }
  if (counts.size === 0 && fallback) counts.set(fallback[0], fallback[1]);

  // Romantasy is the specific form of Romance + Fantasy.
  if (counts.has("Romantasy")) counts.delete("Romance");

  // What a book is comes before who it's for: audience genres rank after content genres.
  return [...counts.entries()]
    .sort((a, b) => Number(AUDIENCE.has(a[0])) - Number(AUDIENCE.has(b[0])) || b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}
