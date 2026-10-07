/** Validation for the book edit form. Pure, so it's unit-tested without a database. */

export const STATUSES = ["want_to_read", "reading", "read", "dnf", "paused"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  read: "Read",
  dnf: "Did not finish",
  paused: "Paused",
};

export const MAX_REVIEW_LENGTH = 10_000;

export type BookEdit = {
  status: Status;
  rating: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  review: string | null;
  favourite: boolean;
  hidden: boolean;
};

export type EditErrors = Partial<Record<keyof BookEdit, string>>;

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/** `today` is injectable so tests don't depend on the clock. */
export function parseBookEdit(
  input: Record<string, string | undefined>,
  today = new Date().toISOString().slice(0, 10),
): { ok: true; data: BookEdit } | { ok: false; errors: EditErrors } {
  const errors: EditErrors = {};

  const status = input.status as Status;
  if (!STATUSES.includes(status)) errors.status = "Pick a status.";

  let rating: number | null = null;
  if (input.rating) {
    rating = Number(input.rating);
    if (!(rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2))) {
      errors.rating = "Ratings go from half a star to 5 stars.";
    }
  }

  const date = (key: "startedAt" | "finishedAt") => {
    const value = input[key]?.trim();
    if (!value) return null;
    if (!isIsoDate(value)) errors[key] = "That isn't a valid date.";
    else if (value > today) errors[key] = "That date is in the future.";
    return value;
  };
  const startedAt = date("startedAt");
  const finishedAt = date("finishedAt");
  if (startedAt && finishedAt && finishedAt < startedAt && !errors.finishedAt) {
    errors.finishedAt = "You finished before you started?";
  }

  const review = input.review?.trim() || null;
  if (review && review.length > MAX_REVIEW_LENGTH) {
    errors.review = `Keep reviews under ${MAX_REVIEW_LENGTH.toLocaleString("en")} characters.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      status,
      rating,
      startedAt,
      finishedAt,
      review,
      favourite: input.favourite === "true",
      hidden: input.hidden === "true",
    },
  };
}
