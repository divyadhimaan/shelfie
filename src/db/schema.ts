import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

const timestamps = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const profilePrivacy = pgEnum("profile_privacy", ["public", "followers", "private"]);

export const readingStatus = pgEnum("reading_status", [
  "want_to_read",
  "reading",
  "read",
  "dnf",
  "paused",
]);

export const bookFormat = pgEnum("book_format", ["print", "ebook", "audio", "unknown"]);

export const bookSource = pgEnum("book_source", [
  "owned",
  "library",
  "arc",
  "gift",
  "subscription",
  "other",
]);

export const importSource = pgEnum("import_source", ["goodreads"]);

export const importStatus = pgEnum("import_status", [
  "uploaded",
  "parsing",
  "matching",
  "review",
  "committed",
  "failed",
  "undone",
]);

export const importRowStatus = pgEnum("import_row_status", [
  "pending",
  "matched",
  "needs_review",
  "failed",
  "skipped",
]);

/* ------------------------------------------------------------------ */
/* Auth.js tables (shape required by @auth/drizzle-adapter)            */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  // Shelfie profile fields (ACC-2, ACC-3, ACC-4)
  username: text("username").unique(),
  bio: text("bio"),
  privacy: profilePrivacy("privacy").notNull().default("public"),
  timezone: text("timezone").notNull().default("UTC"),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ------------------------------------------------------------------ */
/* Shared catalog: one work, many editions (CAT-1)                     */
/* ------------------------------------------------------------------ */

export const works = pgTable(
  "works",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    olWorkId: text("ol_work_id").unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    firstPublishedYear: integer("first_published_year"),
    // Default cover; an edition's own cover wins when the reader picked that edition.
    coverUrl: text("cover_url"),
    // Typical page count across editions; an edition's own count wins when known.
    pages: integer("pages"),
    // Raw catalog subjects, kept so genres can be recomputed when the mapping improves.
    subjects: text("subjects").array().notNull().default(sql`'{}'::text[]`),
    // Normalised to Shelfie's fixed genre list (CAT-4)
    genres: text("genres").array().notNull().default(sql`'{}'::text[]`),
    series: text("series"),
    seriesPosition: real("series_position"),
    ...timestamps,
  },
  (t) => [index("works_title_idx").on(t.title)],
);

export const editions = pgTable(
  "editions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    olEditionId: text("ol_edition_id").unique(),
    isbn13: text("isbn13").unique(),
    isbn10: text("isbn10"),
    format: bookFormat("format").notNull().default("unknown"),
    pages: integer("pages"),
    coverUrl: text("cover_url"),
    publisher: text("publisher"),
    publishedYear: integer("published_year"),
    ...timestamps,
  },
  (t) => [index("editions_work_idx").on(t.workId)],
);

export const authors = pgTable(
  "authors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    olAuthorId: text("ol_author_id").unique(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [index("authors_name_idx").on(t.name)],
);

export const workAuthors = pgTable(
  "work_authors",
  {
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.workId, t.authorId] })],
);

/* ------------------------------------------------------------------ */
/* A user's books and reads (TRK)                                      */
/* ------------------------------------------------------------------ */

export const userBooks = pgTable(
  "user_books",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workId: uuid("work_id")
      .notNull()
      .references(() => works.id, { onDelete: "restrict" }),
    status: readingStatus("status").notNull(),
    favourite: boolean("favourite").notNull().default(false),
    // Hidden from public profile, feeds and share cards (ACC-3, SHR-6)
    hidden: boolean("hidden").notNull().default(false),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("user_books_user_work_idx").on(t.userId, t.workId),
    index("user_books_user_status_idx").on(t.userId, t.status),
  ],
);

// One row per read; re-reads are extra rows (TRK-4).
export const reads = pgTable(
  "reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userBookId: uuid("user_book_id")
      .notNull()
      .references(() => userBooks.id, { onDelete: "cascade" }),
    editionId: uuid("edition_id").references(() => editions.id, { onDelete: "set null" }),
    startedAt: date("started_at", { mode: "string" }),
    finishedAt: date("finished_at", { mode: "string" }),
    format: bookFormat("format").notNull().default("unknown"),
    source: bookSource("source"),
    // 0.5 to 5 in half-star steps (TRK-5)
    rating: numeric("rating", { precision: 2, scale: 1, mode: "number" }),
    review: text("review"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("reads_user_book_idx").on(t.userBookId),
    index("reads_finished_idx").on(t.finishedAt),
    check(
      "reads_rating_half_stars",
      sql`${t.rating} is null or (${t.rating} between 0.5 and 5 and mod(${t.rating} * 2, 1) = 0)`,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Goodreads import (IMP)                                              */
/* ------------------------------------------------------------------ */

export const imports = pgTable(
  "imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: importSource("source").notNull().default("goodreads"),
    status: importStatus("status").notNull().default("uploaded"),
    fileName: text("file_name"),
    totalRows: integer("total_rows").notNull().default(0),
    matchedRows: integer("matched_rows").notNull().default(0),
    needsReviewRows: integer("needs_review_rows").notNull().default(0),
    failedRows: integer("failed_rows").notNull().default(0),
    error: text("error"),
    committedAt: timestamp("committed_at", { mode: "date", withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("imports_user_idx").on(t.userId)],
);

// Each CSV row, kept until the import is committed so it can be reviewed and undone (IMP-6, IMP-8).
export const importRows = pgTable(
  "import_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importId: uuid("import_id")
      .notNull()
      .references(() => imports.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    raw: jsonb("raw").$type<Record<string, string>>().notNull(),
    status: importRowStatus("status").notNull().default("pending"),
    workId: uuid("work_id").references(() => works.id, { onDelete: "set null" }),
    editionId: uuid("edition_id").references(() => editions.id, { onDelete: "set null" }),
    userBookId: uuid("user_book_id").references(() => userBooks.id, { onDelete: "set null" }),
    message: text("message"),
    ...timestamps,
  },
  (t) => [uniqueIndex("import_rows_import_row_idx").on(t.importId, t.rowNumber)],
);
