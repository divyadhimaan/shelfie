import "server-only";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { importRows, imports, reads, userBooks } from "@/db/schema";
import { findWork } from "@/lib/catalog/openlibrary";
import { type GoodreadsBook, normalizeRow, parseGoodreadsExport } from "@/lib/goodreads/parse";
import { upsertEdition, upsertWorkFromGoodreads, upsertWorkFromOpenLibrary } from "./catalog";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const BATCH_SIZE = 8;
const CONCURRENCY = 4;
const ACTIVE_STATUSES = ["uploaded", "matching", "review"] as const;

/** What to do with read books that have no "Date Read" (IMP-5). */
export type MissingDateRule = "date_added" | "undated";

export type ImportProgress = {
  id: string;
  status: (typeof imports.$inferSelect)["status"];
  total: number;
  processed: number;
  matched: number;
  needsReview: number;
  failed: number;
};

export class ImportNotFoundError extends Error {}

async function ownedImport(userId: string, importId: string) {
  const [row] = await db
    .select()
    .from(imports)
    .where(and(eq(imports.id, importId), eq(imports.userId, userId)));
  if (!row) throw new ImportNotFoundError("Import not found");
  return row;
}

/** Parses the CSV and stores every row, replacing any unfinished import (IMP-1, IMP-2). */
export async function createImport(userId: string, fileName: string, csv: string) {
  const rows = parseGoodreadsExport(csv);
  if (rows.length === 0) throw new Error("That file has no books in it.");

  return db.transaction(async (tx) => {
    await tx
      .delete(imports)
      .where(and(eq(imports.userId, userId), inArray(imports.status, [...ACTIVE_STATUSES])));

    const [created] = await tx
      .insert(imports)
      .values({ userId, fileName, totalRows: rows.length, status: "matching" })
      .returning({ id: imports.id });

    for (let i = 0; i < rows.length; i += 500) {
      await tx.insert(importRows).values(
        rows.slice(i, i + 500).map((row) => ({
          importId: created.id,
          rowNumber: row.rowNumber,
          raw: row.raw,
          status: row.book ? ("pending" as const) : ("failed" as const),
          message: row.book ? null : "Missing a title",
        })),
      );
    }
    return created.id;
  });
}

async function refreshCounts(importId: string): Promise<ImportProgress> {
  const tallies = await db
    .select({ status: importRows.status, n: count() })
    .from(importRows)
    .where(eq(importRows.importId, importId))
    .groupBy(importRows.status);
  const by = Object.fromEntries(tallies.map((t) => [t.status, t.n])) as Record<string, number>;
  const total = tallies.reduce((sum, t) => sum + t.n, 0);
  const pending = by.pending ?? 0;

  const [updated] = await db
    .update(imports)
    .set({
      matchedRows: by.matched ?? 0,
      needsReviewRows: by.needs_review ?? 0,
      failedRows: by.failed ?? 0,
    })
    .where(eq(imports.id, importId))
    .returning({ id: imports.id, status: imports.status });

  // Every row has been looked up: move on to the review screen.
  if (pending === 0 && updated.status === "matching") {
    await db.update(imports).set({ status: "review" }).where(eq(imports.id, importId));
    updated.status = "review";
  }

  return {
    id: updated.id,
    status: updated.status,
    total,
    processed: total - pending,
    matched: by.matched ?? 0,
    needsReview: by.needs_review ?? 0,
    failed: by.failed ?? 0,
  };
}

async function matchRow(row: typeof importRows.$inferSelect) {
  const book = normalizeRow(row.raw);
  if (!book) {
    await db
      .update(importRows)
      .set({ status: "failed", message: "Missing a title" })
      .where(eq(importRows.id, row.id));
    return;
  }

  try {
    const ol = await findWork(book);
    await db.transaction(async (tx) => {
      const workId = ol
        ? await upsertWorkFromOpenLibrary(tx, ol, book)
        : await upsertWorkFromGoodreads(tx, book);
      const editionId = await upsertEdition(tx, workId, book, ol?.coverUrl ?? null);
      await tx
        .update(importRows)
        .set({
          workId,
          editionId,
          status: ol ? "matched" : "needs_review",
          message: ol ? null : "No Open Library match. Imported with the details from Goodreads.",
        })
        .where(eq(importRows.id, row.id));
    });
  } catch (error) {
    console.error(`[import] row ${row.rowNumber} failed`, error);
    // Marked failed rather than retried forever; the review screen lists it.
    await db
      .update(importRows)
      .set({ status: "failed", message: "Couldn't look this book up. Try importing again later." })
      .where(eq(importRows.id, row.id));
  }
}

/** Matches the next few pending rows against Open Library (CAT-2). Called repeatedly by the client (IMP-7). */
export async function processImportBatch(
  userId: string,
  importId: string,
): Promise<ImportProgress> {
  const current = await ownedImport(userId, importId);
  if (current.status !== "matching") return refreshCounts(importId);

  const pending = await db
    .select()
    .from(importRows)
    .where(and(eq(importRows.importId, importId), eq(importRows.status, "pending")))
    .orderBy(asc(importRows.rowNumber))
    .limit(BATCH_SIZE);

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    await Promise.all(pending.slice(i, i + CONCURRENCY).map(matchRow));
  }
  return refreshCounts(importId);
}

function readsFor(book: GoodreadsBook, rule: MissingDateRule, editionId: string | null) {
  const base = { editionId, format: book.format };
  const finishedAt = book.dateRead ?? (rule === "date_added" ? book.dateAdded : null);

  if (book.status === "read") {
    const earlier = Array.from({ length: Math.max(0, book.readCount - 1) }, () => ({ ...base }));
    return [
      ...earlier,
      { ...base, finishedAt, rating: book.rating, review: book.review, notes: book.privateNotes },
    ];
  }
  if (book.status === "reading") {
    return [{ ...base, startedAt: book.dateAdded, notes: book.privateNotes }];
  }
  if ((book.status === "dnf" || book.status === "paused") && (book.review || book.privateNotes)) {
    return [{ ...base, review: book.review, notes: book.privateNotes }];
  }
  return [];
}

/** Adds the reviewed rows to the user's library (IMP-6). Books already in the library are skipped. */
export async function commitImport(userId: string, importId: string, rule: MissingDateRule) {
  const current = await ownedImport(userId, importId);
  if (current.status !== "review") throw new Error("This import isn't ready to save yet.");

  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(importRows)
      .where(
        and(
          eq(importRows.importId, importId),
          inArray(importRows.status, ["matched", "needs_review"]),
        ),
      )
      .orderBy(asc(importRows.rowNumber));

    let added = 0;
    let skipped = 0;

    for (const row of rows) {
      const book = normalizeRow(row.raw);
      if (!book || !row.workId) continue;

      const [userBook] = await tx
        .insert(userBooks)
        .values({
          userId,
          workId: row.workId,
          status: book.status,
          favourite: book.tags.some((t) => t === "favorites" || t === "favourites"),
          tags: book.tags,
          createdAt: book.dateAdded ? new Date(`${book.dateAdded}T00:00:00Z`) : undefined,
        })
        .onConflictDoNothing({ target: [userBooks.userId, userBooks.workId] })
        .returning({ id: userBooks.id });

      if (!userBook) {
        skipped++;
        await tx
          .update(importRows)
          .set({ status: "skipped", message: "Already in your library" })
          .where(eq(importRows.id, row.id));
        continue;
      }

      const newReads = readsFor(book, rule, row.editionId);
      if (newReads.length > 0) {
        await tx.insert(reads).values(newReads.map((r) => ({ ...r, userBookId: userBook.id })));
      }
      await tx.update(importRows).set({ userBookId: userBook.id }).where(eq(importRows.id, row.id));
      added++;
    }

    await tx
      .update(imports)
      .set({ status: "committed", committedAt: new Date() })
      .where(eq(imports.id, importId));

    return { added, skipped };
  });
}

export async function discardImport(userId: string, importId: string) {
  await ownedImport(userId, importId);
  await db.delete(imports).where(eq(imports.id, importId));
}

export type ImportIssue = {
  rowNumber: number;
  title: string;
  author: string;
  message: string | null;
};

export type ImportView =
  | { state: "none" }
  | { state: "matching"; progress: ImportProgress; fileName: string | null }
  | {
      state: "review";
      progress: ImportProgress;
      fileName: string | null;
      issues: ImportIssue[];
      missingDateCount: number;
      readCount: number;
    }
  | {
      state: "committed";
      fileName: string | null;
      added: number;
      skipped: number;
      committedAt: Date | null;
    };

/** Everything the /import page needs for the user's latest import. */
export async function getImportView(userId: string): Promise<ImportView> {
  const [latest] = await db
    .select()
    .from(imports)
    .where(eq(imports.userId, userId))
    .orderBy(desc(imports.createdAt))
    .limit(1);
  if (!latest || latest.status === "failed" || latest.status === "undone") return { state: "none" };

  if (latest.status === "committed") {
    const tallies = await db
      .select({
        added: sql<number>`count(${importRows.userBookId})::int`,
        skipped: sql<number>`count(*) filter (where ${importRows.status} = 'skipped')::int`,
      })
      .from(importRows)
      .where(eq(importRows.importId, latest.id));
    return {
      state: "committed",
      fileName: latest.fileName,
      added: tallies[0]?.added ?? 0,
      skipped: tallies[0]?.skipped ?? 0,
      committedAt: latest.committedAt,
    };
  }

  const progress = await refreshCounts(latest.id);
  if (progress.status !== "review")
    return { state: "matching", progress, fileName: latest.fileName };

  const rows = await db
    .select({
      rowNumber: importRows.rowNumber,
      raw: importRows.raw,
      status: importRows.status,
      message: importRows.message,
    })
    .from(importRows)
    .where(eq(importRows.importId, latest.id))
    .orderBy(asc(importRows.rowNumber));

  const issues: ImportIssue[] = [];
  let missingDateCount = 0;
  let readCount = 0;
  for (const row of rows) {
    const book = normalizeRow(row.raw);
    if (row.status === "needs_review" || row.status === "failed") {
      issues.push({
        rowNumber: row.rowNumber,
        title: book?.title ?? row.raw.Title ?? "Untitled",
        author: book?.author ?? "",
        message: row.message,
      });
    }
    if (book?.status === "read" && row.status !== "failed") {
      readCount++;
      if (!book.dateRead) missingDateCount++;
    }
  }

  return {
    state: "review",
    progress,
    fileName: latest.fileName,
    issues,
    missingDateCount,
    readCount,
  };
}
