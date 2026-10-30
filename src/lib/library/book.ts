import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  authors,
  editions,
  progressUpdates,
  reads,
  userBooks,
  workAuthors,
  works,
} from "@/db/schema";
import { pagesGained } from "@/lib/reading/activity";
import { userTimeZone } from "@/lib/reading/home";
import { type Progress, currentProgress, daysLeft } from "@/lib/reading/progress";
import type { BookEdit } from "./edit";

export type BookDetail = {
  id: string;
  title: string;
  authors: string[];
  genres: string[];
  coverUrl: string | null;
  pages: number | null;
  firstPublishedYear: number | null;
  readCount: number;
  edit: BookEdit;
};

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** The latest read is the one the edit form changes: most recently finished, then most recently created. */
async function latestRead(userBookId: string, executor: Executor = db) {
  const [read] = await executor
    .select()
    .from(reads)
    .where(eq(reads.userBookId, userBookId))
    .orderBy(sql`${reads.finishedAt} desc nulls last`, desc(reads.createdAt))
    .limit(1);
  return read ?? null;
}

export async function getBookDetail(
  userId: string,
  userBookId: string,
): Promise<BookDetail | null> {
  // Guard against malformed ids before they reach a uuid column.
  if (!/^[0-9a-f-]{36}$/i.test(userBookId)) return null;

  const [row] = await db
    .select({
      id: userBooks.id,
      status: userBooks.status,
      favourite: userBooks.favourite,
      hidden: userBooks.hidden,
      title: works.title,
      genres: works.genres,
      workCover: works.coverUrl,
      workPages: works.pages,
      firstPublishedYear: works.firstPublishedYear,
      authors: sql<string[]>`coalesce(
        (select array_agg(${authors.name} order by ${workAuthors.position})
         from ${workAuthors} join ${authors} on ${authors.id} = ${workAuthors.authorId}
         where ${workAuthors.workId} = ${works.id}), '{}')`,
    })
    .from(userBooks)
    .innerJoin(works, eq(works.id, userBooks.workId))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)));
  if (!row) return null;

  const read = await latestRead(row.id);
  const [edition] = read?.editionId
    ? await db.select().from(editions).where(eq(editions.id, read.editionId))
    : [];
  const [{ n }] = await db.select({ n: count() }).from(reads).where(eq(reads.userBookId, row.id));

  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    genres: row.genres,
    coverUrl: edition?.coverUrl ?? row.workCover,
    pages: edition?.pages ?? row.workPages,
    firstPublishedYear: row.firstPublishedYear,
    readCount: n,
    edit: {
      status: row.status,
      rating: read?.rating === null || read?.rating === undefined ? null : Number(read.rating),
      startedAt: read?.startedAt ?? null,
      finishedAt: read?.finishedAt ?? null,
      review: read?.review ?? null,
      favourite: row.favourite,
      hidden: row.hidden,
    },
  };
}

/** Saves the edit to the book and its latest read, creating a read when there's something to record. */
export async function saveBookEdit(userId: string, userBookId: string, edit: BookEdit) {
  return db.transaction(async (tx) => {
    const [owned] = await tx
      .update(userBooks)
      .set({ status: edit.status, favourite: edit.favourite, hidden: edit.hidden })
      .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)))
      .returning({ id: userBooks.id });
    if (!owned) return false;

    const readFields = {
      rating: edit.rating,
      startedAt: edit.startedAt,
      finishedAt: edit.finishedAt,
      review: edit.review,
    };
    const read = await latestRead(userBookId, tx);
    if (read) {
      await tx.update(reads).set(readFields).where(eq(reads.id, read.id));
    } else if (Object.values(readFields).some((v) => v !== null) || edit.status === "read") {
      await tx.insert(reads).values({ userBookId, ...readFields });
    }
    return true;
  });
}

export type BookSession = {
  date: string;
  page: number | null;
  percent: number | null;
  gained: number;
};

export type BookReading = {
  progress: Progress;
  daysLeft: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** Newest first */
  sessions: BookSession[];
};

/** Progress and session history for the book's latest read (TRK-3). */
export async function getBookReading(
  userId: string,
  userBookId: string,
): Promise<BookReading | null> {
  if (!/^[0-9a-f-]{36}$/i.test(userBookId)) return null;
  const [owned] = await db
    .select({ workPages: works.pages })
    .from(userBooks)
    .innerJoin(works, eq(works.id, userBooks.workId))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)));
  if (!owned) return null;

  const read = await latestRead(userBookId);
  if (!read) return null;
  const [edition] = read.editionId
    ? await db.select().from(editions).where(eq(editions.id, read.editionId))
    : [];
  const totalPages = edition?.pages ?? owned.workPages;

  const updates = await db
    .select()
    .from(progressUpdates)
    .where(eq(progressUpdates.readId, read.id))
    .orderBy(progressUpdates.createdAt);
  const dateIn = new Intl.DateTimeFormat("en-CA", { timeZone: await userTimeZone(userId) });
  const points = updates.map((u) => ({ page: u.page, percent: u.percent, at: u.createdAt }));
  const gained = pagesGained(
    updates.map((u) => ({ date: dateIn.format(u.createdAt), page: u.page, percent: u.percent })),
    totalPages,
  );

  return {
    progress: currentProgress(points, totalPages),
    daysLeft: daysLeft(points, totalPages),
    startedAt: read.startedAt,
    finishedAt: read.finishedAt,
    sessions: updates
      .map((u, i) => ({
        date: gained[i].date,
        page: u.page,
        percent: u.percent,
        gained: gained[i].pages,
      }))
      .reverse(),
  };
}
