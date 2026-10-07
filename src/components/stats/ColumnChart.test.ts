import { describe, expect, it } from "vitest";
import { tickStep } from "./ColumnChart";

describe("tickStep", () => {
  it("uses whole numbers for small counts", () => {
    expect(tickStep(0)).toBe(1);
    expect(tickStep(2)).toBe(1);
    expect(tickStep(5)).toBe(1);
  });

  it("picks 1/2/5 steps for larger counts", () => {
    expect(tickStep(8)).toBe(2);
    expect(tickStep(17)).toBe(5);
    expect(tickStep(60)).toBe(20);
    expect(tickStep(130)).toBe(50);
  });
});
