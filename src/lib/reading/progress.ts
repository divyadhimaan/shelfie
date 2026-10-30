/** Reading progress, pace and goal maths (TRK-3, TRK-7). Pure, so it's unit-tested without a database. */

export type ProgressPoint = { page: number | null; percent: number | null; at: Date };

export type Progress = {
  /** 0–100 */
  percent: number;
  page: number | null;
  totalPages: number | null;
};

const DAY_MS = 86_400_000;
/** Pace looks at recent reading only, so a slow start doesn't haunt the estimate. */
const PACE_WINDOW_DAYS = 14;

const clampPercent = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function percentOf(point: ProgressPoint, totalPages: number | null) {
  if (point.page !== null && totalPages) return (point.page / totalPages) * 100;
  return point.percent ?? 0;
}

/** Where the reader is now: the latest update, in pages when the length is known. */
export function currentProgress(points: ProgressPoint[], totalPages: number | null): Progress {
  const latest = [...points].sort((a, b) => b.at.getTime() - a.at.getTime())[0];
  if (!latest) return { percent: 0, page: totalPages ? 0 : null, totalPages };
  const percent = clampPercent(percentOf(latest, totalPages));
  const page = latest.page ?? (totalPages ? Math.round((percent / 100) * totalPages) : null);
  return { percent, page, totalPages };
}

/**
 * Days left at the recent pace, or null when there isn't enough to go on
 * (fewer than two updates in the window, or no forward progress).
 */
export function daysLeft(
  points: ProgressPoint[],
  totalPages: number | null,
  now = new Date(),
): number | null {
  const since = now.getTime() - PACE_WINDOW_DAYS * DAY_MS;
  const recent = points
    .filter((p) => p.at.getTime() >= since)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  if (recent.length < 2) return null;

  const first = recent[0];
  const last = recent[recent.length - 1];
  const gained = percentOf(last, totalPages) - percentOf(first, totalPages);
  // Measure over at least one day so two updates minutes apart don't promise a finish tonight.
  const days = Math.max(1, (last.at.getTime() - first.at.getTime()) / DAY_MS);
  if (gained <= 0) return null;

  const remaining = 100 - percentOf(last, totalPages);
  if (remaining <= 0) return 0;
  return Math.max(1, Math.ceil(remaining / (gained / days)));
}

export type GoalPace = {
  target: number;
  done: number;
  /** Books ahead (+) or behind (−) an even pace through the year. */
  ahead: number;
  percent: number;
};

export function goalPace(target: number, done: number, now = new Date()): GoalPace {
  const year = now.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const expected = (target * (now.getTime() - start)) / (end - start);
  return {
    target,
    done,
    ahead: Math.round(done - expected),
    percent: clampPercent((done / target) * 100),
  };
}
