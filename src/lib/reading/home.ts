import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  authors,
  editions,
  goals,
  progressUpdates,
  reads,
  userBooks,
  users,
  workAuthors,
  works,
} from "@/db/schema";
import { type GoalPace, type Progress, currentProgress, daysLeft, goalPace } from "./progress";

export type HomeBook = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
};

export type ReadingNow = HomeBook & {
  progress: Progress;
  daysLeft: number | null;
  startedAt: string | null;
  lastUpdatedAt: Date | null;
};

export type HomeData = {
  year: number;
  /** 0–23 in the reader's time zone, for the greeting */
  hour: number;
  libraryCount: number;
  readingNow: ReadingNow[];
  goal: GoalPace | null;
  finishedThisYear: number;
  recentlyFinished: (HomeBook & { finishedAt: string; rating: number | null })[];
  upNext: HomeBook[];
};

const firstAuthor = sql<string | null>`(
  select ${authors.name} from ${workAuthors} join ${authors} on ${authors.id} = ${workAuthors.authorId}
  where ${workAuthors.workId} = ${works.id} order by ${workAuthors.position} limit 1)`;

/** "Today" in the reader's time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export async function userTimeZone(userId: string) {
  const [row] = await db
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId));
  return row?.timezone ?? "UTC";
}

function hourIn(timeZone: string) {
  try {
    return Number(
      new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" }).format(
        new Date(),
      ),
    );
  } catch {
    return new Date().getUTCHours();
  }
}

export async function getHomeData(userId: string): Promise<HomeData> {
  const timeZone = await userTimeZone(userId);
  const year = Number(todayIn(timeZone).slice(0, 4));

  const [{ libraryCount }] = await db
    .select({ libraryCount: count() })
    .from(userBooks)
    .where(eq(userBooks.userId, userId));

  // Currently reading: each book with its open read (no finish date) and that read's progress.
  const readingRows = await db
    .select({
      id: userBooks.id,
      title: works.title,
      author: firstAuthor,
      coverUrl: sql<string | null>`coalesce(${editions.coverUrl}, ${works.coverUrl})`,
      totalPages: sql<number | null>`coalesce(${editions.pages}, ${works.pages})`,
      readId: reads.id,
      startedAt: reads.startedAt,
      updatedAt: userBooks.updatedAt,
    })
    .from(userBooks)
    .innerJoin(works, eq(works.id, userBooks.workId))
    .leftJoin(reads, and(eq(reads.userBookId, userBooks.id), isNull(reads.finishedAt)))
    .leftJoin(editions, eq(editions.id, reads.editionId))
    .where(and(eq(userBooks.userId, userId), eq(userBooks.status, "reading")))
    .orderBy(desc(userBooks.updatedAt));

  const readIds = readingRows.map((r) => r.readId).filter((id): id is string => !!id);
  const points = readIds.length
    ? await db
        .select()
        .from(progressUpdates)
        .where(inArray(progressUpdates.readId, readIds))
        .orderBy(asc(progressUpdates.createdAt))
    : [];

  // A book can have several open reads in odd data; keep one card per book.
  const seen = new Set<string>();
  const readingNow: ReadingNow[] = [];
  for (const row of readingRows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const totalPages = row.totalPages === null ? null : Number(row.totalPages);
    const mine = points
      .filter((p) => p.readId === row.readId)
      .map((p) => ({ page: p.page, percent: p.percent, at: p.createdAt }));
    readingNow.push({
      id: row.id,
      title: row.title,
      author: row.author,
      coverUrl: row.coverUrl,
      progress: currentProgress(mine, totalPages),
      daysLeft: daysLeft(mine, totalPages),
      startedAt: row.startedAt,
      lastUpdatedAt: mine.at(-1)?.at ?? null,
    });
  }

  const [{ finishedThisYear }] = await db
    .select({ finishedThisYear: count() })
    .from(reads)
    .innerJoin(userBooks, eq(userBooks.id, reads.userBookId))
    .where(
      and(eq(userBooks.userId, userId), sql`extract(year from ${reads.finishedAt}) = ${year}`),
    );

  const [goalRow] = await db
    .select({ target: goals.target })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.year, year)));

  const recentlyFinished = await db
    .select({
      id: userBooks.id,
      title: works.title,
      author: firstAuthor,
      coverUrl: sql<string | null>`coalesce(${editions.coverUrl}, ${works.coverUrl})`,
      finishedAt: sql<string>`${reads.finishedAt}`,
      rating: reads.rating,
    })
    .from(reads)
    .innerJoin(userBooks, eq(userBooks.id, reads.userBookId))
    .innerJoin(works, eq(works.id, userBooks.workId))
    .leftJoin(editions, eq(editions.id, reads.editionId))
    .where(and(eq(userBooks.userId, userId), isNotNull(reads.finishedAt)))
    .orderBy(desc(reads.finishedAt), desc(reads.createdAt))
    .limit(8);

  const upNext = await db
    .select({ id: userBooks.id, title: works.title, author: firstAuthor, coverUrl: works.coverUrl })
    .from(userBooks)
    .innerJoin(works, eq(works.id, userBooks.workId))
    .where(and(eq(userBooks.userId, userId), eq(userBooks.status, "want_to_read")))
    .orderBy(desc(userBooks.createdAt))
    .limit(8);

  return {
    year,
    hour: hourIn(timeZone),
    libraryCount,
    readingNow,
    goal: goalRow ? goalPace(goalRow.target, finishedThisYear) : null,
    finishedThisYear,
    recentlyFinished: recentlyFinished.map((r) => ({
      ...r,
      rating: r.rating === null ? null : Number(r.rating),
    })),
    upNext,
  };
}
