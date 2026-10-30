import { describe, expect, it } from "vitest";
import {
  currentStreak,
  heatmap,
  levelFor,
  longestStreak,
  pagesByDay,
  pagesGained,
  thisWeek,
  weekStart,
} from "./activity";

const today = "2026-10-30"; // a Friday

describe("streaks", () => {
  const days = pagesByDay([
    { date: "2026-10-27", pages: 40 },
    { date: "2026-10-28", pages: 60 },
    { date: "2026-10-29", pages: 48 },
    { date: "2026-10-01", pages: 10 },
    { date: "2026-10-02", pages: 10 },
    { date: "2026-10-03", pages: 10 },
    { date: "2026-10-04", pages: 10 },
  ]);

  it("counts back from yesterday when today has nothing yet", () => {
    expect(currentStreak(days, today)).toBe(3);
  });

  it("is zero after a missed day", () => {
    expect(currentStreak(days, "2026-11-01")).toBe(0);
  });

  it("finds the longest run", () => {
    expect(longestStreak(days)).toBe(4);
  });
});

describe("calendar", () => {
  it("starts weeks on Monday", () => {
    expect(weekStart(today)).toBe("2026-10-26");
    expect(weekStart("2026-10-26")).toBe("2026-10-26");
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
  });

  it("marks this week's days, including future ones", () => {
    const week = thisWeek(pagesByDay([{ date: "2026-10-28", pages: 60 }]), today);
    expect(week.map((d) => d.date)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(week[2].level).toBe(3);
    expect(week.filter((d) => d.future).length).toBe(2);
  });

  it("lays out 52 Monday-first weeks ending this week", () => {
    const grid = heatmap(new Map(), today);
    expect(grid).toHaveLength(52);
    expect(grid[51][0].date).toBe("2026-10-26");
    expect(grid[0][0].date).toBe("2025-11-03");
  });
});

describe("levels and pages", () => {
  it("grades days by pages, counting page-less days as light reading", () => {
    expect([
      levelFor(0, false),
      levelFor(0, true),
      levelFor(25, true),
      levelFor(60, true),
      levelFor(150, true),
    ]).toEqual([0, 1, 2, 3, 4]);
  });

  it("turns page updates into pages gained, ignoring going backwards", () => {
    const updates = [
      { date: "2026-10-28", page: 100, percent: null },
      { date: "2026-10-29", page: 150, percent: null },
      { date: "2026-10-29", page: 140, percent: null },
      { date: "2026-10-30", page: null, percent: 50 },
    ];
    expect(pagesGained(updates, 400).map((u) => u.pages)).toEqual([100, 50, 0, 50]);
  });
});
