import { describe, expect, it } from "vitest";
import { normalizeGenres } from "./genres";

describe("normalizeGenres", () => {
  it("doesn't read 'Science-fiction' as Science", () => {
    expect(normalizeGenres(["Fiction", "Science fiction", "Science-fiction"])).toEqual([
      "Science Fiction",
    ]);
  });

  it("drops non-fiction genres for novels", () => {
    const babel = ["Fiction", "Magic", "History", "Fiction, fantasy, historical", "Imperialism"];
    expect(normalizeGenres(babel)).not.toContain("History");
    expect(normalizeGenres(babel)).toContain("Fantasy");
  });

  it("keeps History for non-fiction", () => {
    expect(normalizeGenres(["History", "World War, 1939-1945"])).toEqual(["History"]);
  });

  it("weights the reader's shelves above catalog subjects", () => {
    expect(normalizeGenres(["Modern fiction", "Fiction"], ["literary-fiction"])[0]).toBe(
      "Literary Fiction",
    );
    expect(normalizeGenres(["Fiction", "Romance", "Fantasy"], ["romantasy"])).toEqual([
      "Romantasy",
      "Fantasy",
    ]);
  });

  it("keeps non-fiction books non-fiction and reads hyphenated shelves", () => {
    expect(normalizeGenres(["Non-fiction", "Habits", "Success"], ["non-fiction"])).toContain(
      "Self-Help",
    );
    expect(normalizeGenres([], ["sci-fi"])).toEqual(["Science Fiction"]);
    expect(normalizeGenres([], ["young-adult"])).toEqual(["Young Adult"]);
  });

  it("doesn't match 'teen' inside other words", () => {
    expect(normalizeGenres(["Nineteenth century"])).toEqual([]);
  });
});
