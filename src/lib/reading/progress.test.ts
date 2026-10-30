import { describe, expect, it } from "vitest";
import { currentProgress, daysLeft, goalPace } from "./progress";

const day = (d: number) => new Date(Date.UTC(2026, 9, d, 21));
const now = day(20);

describe("currentProgress", () => {
  it("uses the latest update and converts pages to percent", () => {
    const points = [
      { page: 100, percent: null, at: day(10) },
      { page: 250, percent: null, at: day(18) },
    ];
    expect(currentProgress(points, 500)).toEqual({ percent: 50, page: 250, totalPages: 500 });
  });

  it("works in percent when the length is unknown", () => {
    expect(currentProgress([{ page: null, percent: 37, at: day(1) }], null)).toEqual({
      percent: 37,
      page: null,
      totalPages: null,
    });
  });

  it("starts at zero with no updates", () => {
    expect(currentProgress([], 300).percent).toBe(0);
  });
});

describe("daysLeft", () => {
  it("projects from the recent pace", () => {
    // 100 pages over 4 days = 25 pages/day; 200 pages left -> 8 days.
    const points = [
      { page: 200, percent: null, at: day(14) },
      { page: 300, percent: null, at: day(18) },
    ];
    expect(daysLeft(points, 500, now)).toBe(8);
  });

  it("ignores updates older than two weeks", () => {
    const points = [
      { page: 10, percent: null, at: day(1) },
      { page: 300, percent: null, at: day(18) },
    ];
    expect(daysLeft(points, 500, now)).toBeNull();
  });

  it("returns null without forward progress", () => {
    const points = [
      { page: 300, percent: null, at: day(15) },
      { page: 300, percent: null, at: day(18) },
    ];
    expect(daysLeft(points, 500, now)).toBeNull();
  });

  it("doesn't overpromise from two updates on the same day", () => {
    const points = [
      { page: 100, percent: null, at: new Date(Date.UTC(2026, 9, 18, 9)) },
      { page: 150, percent: null, at: new Date(Date.UTC(2026, 9, 18, 10)) },
    ];
    // Treated as 50 pages/day: 350 left -> 7 days, not "finish in an hour".
    expect(daysLeft(points, 500, now)).toBe(7);
  });
});

describe("goalPace", () => {
  it("compares books done to an even pace through the year", () => {
    const midYear = new Date(2026, 6, 2, 12); // about half way
    expect(goalPace(24, 15, midYear)).toMatchObject({ ahead: 3, percent: 63 });
    expect(goalPace(24, 9, midYear).ahead).toBe(-3);
  });

  it("caps percent at 100", () => {
    expect(goalPace(10, 14, new Date(2026, 11, 1)).percent).toBe(100);
  });
});
