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

  it("needs a strong signal for Children's and Young Adult", () => {
    const fellowship = [
      "Fiction",
      "Fantasy",
      "Middle Earth",
      "young adult fiction",
      "Children's fiction",
      ...Array(38).fill("Elves"),
    ];
    expect(normalizeGenres(fellowship)).toEqual(["Fantasy"]);

    const nameOfTheWind = [
      "Fantasy fiction",
      "Adult books for young adults",
      "Juvenile audience",
      "Homeless children",
      ...Array(51).fill("Magic"),
    ];
    expect(normalizeGenres(nameOfTheWind)).not.toContain("Children's");

    const hobbit = [
      "Fantasy",
      "juvenile fantasy",
      "Juvenile fiction",
      "children's books",
      "juvenile works",
      "YOUNG ADULT FICTION",
      ...Array(20).fill("Dragons"),
    ];
    expect(normalizeGenres(hobbit)).toEqual(["Fantasy", "Children's"]);
  });

  it("ignores a single stray subject on well-catalogued books", () => {
    const subjects = [
      "Fiction",
      "Fantasy fiction",
      "Magic",
      "Mystery and detective stories",
      "Graphic novels",
      ...Array(20).fill("Wizards"),
    ];
    expect(normalizeGenres(subjects)).toEqual(["Fantasy"]);
  });

  it("trusts the reader's own audience shelf", () => {
    expect(normalizeGenres(["Fiction", "Fantasy"], ["young-adult"])).toEqual([
      "Fantasy",
      "Young Adult",
    ]);
  });

  it("doesn't match 'teen' inside other words", () => {
    expect(normalizeGenres(["Nineteenth century"])).toEqual([]);
  });
});
