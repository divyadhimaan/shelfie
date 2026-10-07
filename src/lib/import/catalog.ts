import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { authors, editions, workAuthors, works } from "@/db/schema";
import { normalizeGenres } from "@/lib/catalog/genres";
import type { OpenLibraryWork } from "@/lib/catalog/openlibrary";
import type { GoodreadsBook } from "@/lib/goodreads/parse";

/** The db itself or a transaction inside it. */
type Db = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function upsertAuthor(tx: Db, name: string, olAuthorId: string | null) {
  if (olAuthorId) {
    const [row] = await tx
      .insert(authors)
      .values({ name, olAuthorId })
      .onConflictDoUpdate({ target: authors.olAuthorId, set: { name } })
      .returning({ id: authors.id });
    return row.id;
  }
  const [existing] = await tx
    .select({ id: authors.id })
    .from(authors)
    .where(sql`lower(${authors.name}) = lower(${name})`)
    .limit(1);
  if (existing) return existing.id;
  const [row] = await tx.insert(authors).values({ name }).returning({ id: authors.id });
  return row.id;
}

async function linkAuthors(
  tx: Db,
  workId: string,
  list: { name: string; olAuthorId: string | null }[],
) {
  for (const [position, author] of list.entries()) {
    const authorId = await upsertAuthor(tx, author.name, author.olAuthorId);
    await tx.insert(workAuthors).values({ workId, authorId, position }).onConflictDoNothing();
  }
}

/** Finds or creates the shared catalog work for an Open Library match. */
export async function upsertWorkFromOpenLibrary(tx: Db, ol: OpenLibraryWork, book: GoodreadsBook) {
  const [existing] = await tx
    .select({ id: works.id })
    .from(works)
    .where(eq(works.olWorkId, ol.workId))
    .limit(1);
  if (existing) return existing.id;

  const [row] = await tx
    .insert(works)
    .values({
      olWorkId: ol.workId,
      title: ol.title,
      subtitle: ol.subtitle,
      coverUrl: ol.coverUrl,
      pages: ol.pages ?? book.pages,
      firstPublishedYear: ol.firstPublishedYear ?? book.originalPublicationYear,
      subjects: ol.subjects,
      genres: normalizeGenres(ol.subjects, book.tags),
      series: book.series,
      seriesPosition: book.seriesPosition,
    })
    .onConflictDoNothing({ target: works.olWorkId })
    .returning({ id: works.id });

  // Another request created it first.
  if (!row) {
    const [winner] = await tx
      .select({ id: works.id })
      .from(works)
      .where(eq(works.olWorkId, ol.workId));
    return winner.id;
  }

  const authorList = ol.authors.length > 0 ? ol.authors : [{ name: book.author, olAuthorId: null }];
  await linkAuthors(tx, row.id, authorList);
  return row.id;
}

/** No Open Library match: build the work from the Goodreads row, reusing an identical title + author. */
export async function upsertWorkFromGoodreads(tx: Db, book: GoodreadsBook) {
  const [existing] = await tx
    .select({ id: works.id })
    .from(works)
    .innerJoin(workAuthors, eq(workAuthors.workId, works.id))
    .innerJoin(authors, eq(authors.id, workAuthors.authorId))
    .where(
      and(
        sql`lower(${works.title}) = lower(${book.title})`,
        sql`lower(${authors.name}) = lower(${book.author})`,
      ),
    )
    .limit(1);
  if (existing) return existing.id;

  const [row] = await tx
    .insert(works)
    .values({
      title: book.title,
      pages: book.pages,
      firstPublishedYear: book.originalPublicationYear ?? book.yearPublished,
      genres: normalizeGenres([], book.tags),
      series: book.series,
      seriesPosition: book.seriesPosition,
    })
    .returning({ id: works.id });

  const authorList = [book.author, ...book.additionalAuthors]
    .filter(Boolean)
    .map((name) => ({ name, olAuthorId: null }));
  await linkAuthors(tx, row.id, authorList);
  return row.id;
}

/** Editions are keyed by ISBN-13; rows without one are tracked at the work level only. */
export async function upsertEdition(
  tx: Db,
  workId: string,
  book: GoodreadsBook,
  coverUrl: string | null,
) {
  if (!book.isbn13) return null;
  const [row] = await tx
    .insert(editions)
    .values({
      workId,
      isbn13: book.isbn13,
      isbn10: book.isbn10,
      format: book.format,
      pages: book.pages,
      publisher: book.publisher,
      publishedYear: book.yearPublished,
      coverUrl,
    })
    .onConflictDoUpdate({ target: editions.isbn13, set: { updatedAt: new Date() } })
    .returning({ id: editions.id });
  return row.id;
}
