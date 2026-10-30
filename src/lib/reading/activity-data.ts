import "server-only";

import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { editions, progressUpdates, reads, userBooks, works } from "@/db/schema";
import { type ActivityEvent, pagesGained } from "./activity";
import { todayIn, userTimeZone } from "./home";

/** Every reading day for the user: progress updates (with pages gained) and finish dates. */
export async function getActivity(
  userId: string,
): Promise<{ today: string; events: ActivityEvent[] }> {
  const timeZone = await userTimeZone(userId);
  const dateIn = new Intl.DateTimeFormat("en-CA", { timeZone });

  const updates = await db
    .select({
      readId: progressUpdates.readId,
      page: progressUpdates.page,
      percent: progressUpdates.percent,
      at: progressUpdates.createdAt,
      totalPages: sql<number | null>`coalesce(${editions.pages}, ${works.pages})`,
    })
    .from(progressUpdates)
    .innerJoin(reads, eq(reads.id, progressUpdates.readId))
    .innerJoin(userBooks, eq(userBooks.id, reads.userBookId))
    .innerJoin(works, eq(works.id, userBooks.workId))
    .leftJoin(editions, eq(editions.id, reads.editionId))
    .where(eq(userBooks.userId, userId))
    .orderBy(asc(progressUpdates.readId), asc(progressUpdates.createdAt));

  const byRead = new Map<string, typeof updates>();
  for (const u of updates) byRead.set(u.readId, [...(byRead.get(u.readId) ?? []), u]);

  const events: ActivityEvent[] = [];
  for (const rows of byRead.values()) {
    const total = rows[0].totalPages === null ? null : Number(rows[0].totalPages);
    events.push(
      ...pagesGained(
        rows.map((r) => ({ date: dateIn.format(r.at), page: r.page, percent: r.percent })),
        total,
      ),
    );
  }

  // Finishing a book counts as a reading day, including books imported from Goodreads.
  const finishes = await db
    .select({ finishedAt: reads.finishedAt })
    .from(reads)
    .innerJoin(userBooks, eq(userBooks.id, reads.userBookId))
    .where(and(eq(userBooks.userId, userId), isNotNull(reads.finishedAt)));
  for (const f of finishes) if (f.finishedAt) events.push({ date: f.finishedAt, pages: 0 });

  return { today: todayIn(timeZone), events };
}
