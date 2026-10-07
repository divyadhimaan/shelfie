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
  [/young adult|\bya\b|\bteens?\b/, "Young Adult"],
  [/juvenile|children'?s/, "Children's"],
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
  const tally = (text: string, weight: number) => {
    // Shelf names use hyphens ("young-adult"); test both spellings, counting each genre once.
    const variants = [text.toLowerCase(), text.toLowerCase().replace(/-/g, " ")];
    for (const [pattern, genre] of RULES) {
      if (variants.some((v) => pattern.test(v)))
        counts.set(genre, (counts.get(genre) ?? 0) + weight);
    }
  };
  for (const subject of subjects) tally(subject, 1);
  for (const shelf of shelves) tally(shelf, 3);

  // A novel's "History" subject describes its setting, not its genre.
  if (subjects.some(isFictionSubject)) {
    for (const genre of NON_FICTION_ONLY) counts.delete(genre);
  }
  // Romantasy is the specific form of Romance + Fantasy.
  if (counts.has("Romantasy")) counts.delete("Romance");

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}
