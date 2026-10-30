import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { editions, goals, importRows, progressUpdates, reads, userBooks, works } from "@/db/schema";
import { todayIn, userTimeZone } from "./home";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ReadingError extends Error {}

async function ownedBook(tx: Tx, userId: string, userBookId: string) {
  const [book] = await tx
    .select({ id: userBooks.id, status: userBooks.status, workPages: works.pages })
    .from(userBooks)
    .innerJoin(works, eq(works.id, userBooks.workId))
    .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)));
  if (!book) throw new ReadingError("That book isn't in your library.");
  return book;
}

/** The open read (not yet finished), creating one that starts today if there isn't one. */
async function openRead(tx: Tx, userBookId: string, today: string) {
  const [existing] = await tx
    .select({ id: reads.id, editionId: reads.editionId })
    .from(reads)
    .where(and(eq(reads.userBookId, userBookId), isNull(reads.finishedAt)))
    .orderBy(desc(reads.createdAt))
    .limit(1);
  if (existing) return existing;

  // Reuse the edition the reader had before (an earlier read, or their Goodreads row), so page counts match it.
  const [previous] = await tx
    .select({ editionId: reads.editionId })
    .from(reads)
    .where(and(eq(reads.userBookId, userBookId), sql`${reads.editionId} is not null`))
    .orderBy(desc(reads.createdAt))
    .limit(1);
  const [imported] = previous
    ? []
    : await tx
        .select({ editionId: importRows.editionId })
        .from(importRows)
        .where(and(eq(importRows.userBookId, userBookId), sql`${importRows.editionId} is not null`))
        .limit(1);

  const [created] = await tx
    .insert(reads)
    .values({
      userBookId,
      startedAt: today,
      editionId: previous?.editionId ?? imported?.editionId ?? null,
    })
    .returning({ id: reads.id, editionId: reads.editionId });
  return created;
}

async function totalPagesFor(tx: Tx, editionId: string | null, workPages: number | null) {
  if (!editionId) return workPages;
  const [edition] = await tx
    .select({ pages: editions.pages })
    .from(editions)
    .where(eq(editions.id, editionId));
  return edition?.pages ?? workPages;
}

/** Records how far the reader is: a page when the length is known, otherwise a percent. */
export async function logProgress(
  userId: string,
  userBookId: string,
  value: { page?: number; percent?: number },
) {
  const today = todayIn(await userTimeZone(userId));
  return db.transaction(async (tx) => {
    const book = await ownedBook(tx, userId, userBookId);
    const read = await openRead(tx, userBookId, today);
    const total = await totalPagesFor(tx, read.editionId, book.workPages);

    let page: number | null = null;
    let percent: number | null = null;
    if (value.page !== undefined) {
      if (!Number.isInteger(value.page) || value.page < 0)
        throw new ReadingError("Enter a page number.");
      if (total && value.page > total) throw new ReadingError(`This edition has ${total} pages.`);
      page = value.page;
      if (total) percent = Math.round((value.page / total) * 100);
    } else if (value.percent !== undefined) {
      if (!Number.isInteger(value.percent) || value.percent < 0 || value.percent > 100) {
        throw new ReadingError("Enter a percentage from 0 to 100.");
      }
      percent = value.percent;
    } else {
      throw new ReadingError("Enter how far you are.");
    }

    await tx.insert(progressUpdates).values({ readId: read.id, page, percent });
    if (book.status !== "reading") {
      await tx.update(userBooks).set({ status: "reading" }).where(eq(userBooks.id, userBookId));
    } else {
      // Bump so the most recently touched book sorts first on Home.
      await tx.update(userBooks).set({ updatedAt: new Date() }).where(eq(userBooks.id, userBookId));
    }
    return { page, percent, total };
  });
}

export async function startReading(userId: string, userBookId: string) {
  const today = todayIn(await userTimeZone(userId));
  await db.transaction(async (tx) => {
    await ownedBook(tx, userId, userBookId);
    await openRead(tx, userBookId, today);
    await tx.update(userBooks).set({ status: "reading" }).where(eq(userBooks.id, userBookId));
  });
}

/** Marks the open read finished today, with an optional rating. */
export async function finishBook(userId: string, userBookId: string, rating: number | null) {
  if (rating !== null && !(rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2))) {
    throw new ReadingError("Ratings go from half a star to 5 stars.");
  }
  const today = todayIn(await userTimeZone(userId));
  await db.transaction(async (tx) => {
    await ownedBook(tx, userId, userBookId);
    const read = await openRead(tx, userBookId, today);
    await tx.update(reads).set({ finishedAt: today, rating }).where(eq(reads.id, read.id));
    await tx.insert(progressUpdates).values({ readId: read.id, percent: 100 });
    await tx.update(userBooks).set({ status: "read" }).where(eq(userBooks.id, userBookId));
  });
}

export async function setGoal(userId: string, target: number) {
  if (!Number.isInteger(target) || target < 1 || target > 1000) {
    throw new ReadingError("Pick a goal between 1 and 1,000 books.");
  }
  const year = Number(todayIn(await userTimeZone(userId)).slice(0, 4));
  await db
    .insert(goals)
    .values({ userId, year, target })
    .onConflictDoUpdate({
      target: [goals.userId, goals.year],
      set: { target, updatedAt: sql`now()` },
    });
}
