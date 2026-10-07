import "server-only";

import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { authors, editions, reads, userBooks, workAuthors, works } from "@/db/schema";
import type { FinishedRead } from "./compute";

/**
 * Every finished read for the user: dated reads, plus undated reads of books shelved as read.
 * `excludeHidden` drops books the user hid from sharing (SHR-6), for anything that leaves the app.
 */
export async function getFinishedReads(
  userId: string,
  { excludeHidden = false }: { excludeHidden?: boolean } = {},
): Promise<FinishedRead[]> {
  const rows = await db
    .select({
      workId: works.id,
      title: works.title,
      genres: works.genres,
      coverUrl: sql<string | null>`coalesce(${editions.coverUrl}, ${works.coverUrl})`,
      finishedAt: reads.finishedAt,
      rating: reads.rating,
      pages: sql<number | null>`coalesce(${editions.pages}, ${works.pages})`,
      authors: sql<string[]>`coalesce(
        (select array_agg(${authors.name} order by ${workAuthors.position})
         from ${workAuthors} join ${authors} on ${authors.id} = ${workAuthors.authorId}
         where ${workAuthors.workId} = ${works.id}), '{}')`,
    })
    .from(reads)
    .innerJoin(userBooks, eq(userBooks.id, reads.userBookId))
    .innerJoin(works, eq(works.id, userBooks.workId))
    .leftJoin(editions, eq(editions.id, reads.editionId))
    .where(
      and(
        eq(userBooks.userId, userId),
        or(isNotNull(reads.finishedAt), eq(userBooks.status, "read")),
        excludeHidden ? eq(userBooks.hidden, false) : undefined,
      ),
    );

  return rows.map((row) => ({
    ...row,
    rating: row.rating === null ? null : Number(row.rating),
    pages: row.pages === null ? null : Number(row.pages),
  }));
}
