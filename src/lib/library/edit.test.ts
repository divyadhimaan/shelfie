import { describe, expect, it } from "vitest";
import { parseBookEdit } from "./edit";

const today = "2026-10-07";
const base = {
  status: "read",
  rating: "4.5",
  startedAt: "2026-03-01",
  finishedAt: "2026-03-20",
  review: " Loved it ",
  favourite: "true",
  hidden: "false",
};

describe("parseBookEdit", () => {
  it("accepts a valid edit and trims the review", () => {
    expect(parseBookEdit(base, today)).toEqual({
      ok: true,
      data: {
        status: "read",
        rating: 4.5,
        startedAt: "2026-03-01",
        finishedAt: "2026-03-20",
        review: "Loved it",
        favourite: true,
        hidden: false,
      },
    });
  });

  it("treats blanks as cleared", () => {
    const result = parseBookEdit(
      { ...base, rating: "", startedAt: "", finishedAt: "", review: "  " },
      today,
    );
    expect(result.ok && result.data).toMatchObject({
      rating: null,
      startedAt: null,
      finishedAt: null,
      review: null,
    });
  });

  it("rejects unknown statuses and off-scale ratings", () => {
    const result = parseBookEdit({ ...base, status: "burned", rating: "4.3" }, today);
    expect(result.ok ? null : Object.keys(result.errors).sort()).toEqual(["rating", "status"]);
  });

  it("rejects impossible, future and backwards dates", () => {
    expect(parseBookEdit({ ...base, finishedAt: "2026-02-30" }, today).ok).toBe(false);
    expect(parseBookEdit({ ...base, finishedAt: "2026-12-01" }, today).ok).toBe(false);
    const backwards = parseBookEdit({ ...base, startedAt: "2026-04-01" }, today);
    expect(backwards.ok ? null : backwards.errors.finishedAt).toMatch(/before you started/);
  });
});
