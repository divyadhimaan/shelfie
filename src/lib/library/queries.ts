import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { authors, editions, reads, userBooks, workAuthors, works } from "@/db/schema";

export type LibraryBook = {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  status: (typeof userBooks.$inferSelect)["status"];
  rating: number | null;
  finishedAt: string | null;
};

/** The user's books with their latest read, newest first (TRK-8). */
export async function getLibrary(userId: string): Promise<LibraryBook[]> {
  const latestRead = db
    .selectDistinctOn([reads.userBookId], {
      userBookId: reads.userBookId,
      rating: reads.rating,
      finishedAt: reads.finishedAt,
      editionId: reads.editionId,
    })
    .from(reads)
    .orderBy(reads.userBookId, sql`${reads.finishedAt} desc nulls last`, desc(reads.createdAt))
    .as("latest_read");

  const rows = await db
    .select({
      id: userBooks.id,
      title: works.title,
      status: userBooks.status,
      workCover: works.coverUrl,
      editionCover: editions.coverUrl,
      rating: latestRead.rating,
      finishedAt: latestRead.finishedAt,
      addedAt: userBooks.createdAt,
      authors: sql<string[]>`coalesce(
        (select array_agg(${authors.name} order by ${workAuthors.position})
         from ${workAuthors} join ${authors} on ${authors.id} = ${workAuthors.authorId}
         where ${workAuthors.workId} = ${works.id}), '{}')`,
    })
    .from(userBooks)
    .innerJoin(works, eq(works.id, userBooks.workId))
    .leftJoin(latestRead, eq(latestRead.userBookId, userBooks.id))
    .leftJoin(editions, eq(editions.id, latestRead.editionId))
    .where(eq(userBooks.userId, userId))
    .orderBy(sql`${latestRead.finishedAt} desc nulls last`, desc(userBooks.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    authors: row.authors,
    coverUrl: row.editionCover ?? row.workCover,
    status: row.status,
    rating: row.rating === null ? null : Number(row.rating),
    finishedAt: row.finishedAt,
  }));
}
