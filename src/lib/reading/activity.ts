/**
 * Reading activity: which days you read and how much (profile heatmap, streaks, "this week").
 * Pure, so it's unit-tested without a database. Dates are YYYY-MM-DD in the reader's time zone.
 */

export type ActivityEvent = { date: string; pages: number };

export type ActivityDay = {
  date: string;
  pages: number;
  /** 0 = no reading, 1–4 = more reading */
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
};

const DAY_MS = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => toIso(toTime(iso) + days * DAY_MS);

/** Monday of the week containing `iso`. */
export function weekStart(iso: string) {
  const weekday = (new Date(toTime(iso)).getUTCDay() + 6) % 7; // Mon = 0
  return addDays(iso, -weekday);
}

export function pagesByDay(events: ActivityEvent[]) {
  const days = new Map<string, number>();
  for (const e of events) days.set(e.date, (days.get(e.date) ?? 0) + Math.max(0, e.pages));
  return days;
}

/** A logged day with no page count (percent-only books, finishes) still counts as reading. */
export function levelFor(pages: number, active: boolean): ActivityDay["level"] {
  if (!active) return 0;
  if (pages >= 100) return 4;
  if (pages >= 50) return 3;
  if (pages >= 20) return 2;
  return 1;
}

/** Days in a row with reading, ending today, or yesterday if today has nothing yet. */
export function currentStreak(days: Map<string, number>, today: string) {
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(days: Map<string, number>) {
  const sorted = [...days.keys()].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sorted) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

function dayFor(days: Map<string, number>, date: string, today: string): ActivityDay {
  const pages = days.get(date) ?? 0;
  return { date, pages, level: levelFor(pages, days.has(date)), future: date > today };
}

/** Monday to Sunday of the current week. */
export function thisWeek(days: Map<string, number>, today: string): ActivityDay[] {
  const monday = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => dayFor(days, addDays(monday, i), today));
}

/** `weeks` columns of Monday-to-Sunday days, oldest first, ending with the current week. */
export function heatmap(days: Map<string, number>, today: string, weeks = 52): ActivityDay[][] {
  const firstMonday = addDays(weekStart(today), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => dayFor(days, addDays(firstMonday, w * 7 + d), today)),
  );
}

/** Turns a read's progress updates into pages gained per update (never negative). */
export function pagesGained(
  updates: { date: string; page: number | null; percent: number | null }[],
  totalPages: number | null,
) {
  let previous = 0;
  return updates.map((u) => {
    const page =
      u.page ??
      (u.percent !== null && totalPages ? Math.round((u.percent / 100) * totalPages) : null);
    if (page === null) return { date: u.date, pages: 0 };
    const gained = Math.max(0, page - previous);
    previous = Math.max(previous, page);
    return { date: u.date, pages: gained };
  });
}
