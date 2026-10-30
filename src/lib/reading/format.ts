import type { ReadingNow } from "./home";

/** "Page 260 of 724 · 36%", or just the percent when the length is unknown. */
export function progressLine(book: ReadingNow) {
  const { page, totalPages, percent } = book.progress;
  return page !== null && totalPages
    ? `Page ${page} of ${totalPages} · ${percent}%`
    : `${percent}%`;
}

/** Estimated time left, or when it was started if there's no pace yet. */
export function paceLine(book: ReadingNow) {
  if (book.daysLeft !== null)
    return book.daysLeft <= 1 ? "Done in about a day" : `About ${book.daysLeft} days left`;
  if (book.startedAt) {
    const started = new Date(`${book.startedAt}T00:00:00Z`).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return `Started ${started}`;
  }
  return "Log a page to see your pace";
}
