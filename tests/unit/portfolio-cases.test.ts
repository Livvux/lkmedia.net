import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeContent } from "../../src/lib/home-content";

const newCases = ["pfotenweb", "five-rp", "eichhoernchenberger", "streamerloft"];

describe("Portfolio cases and proof", () => {
  it("lists all four projects once in German with real imagery", () => {
    const shots = homeContent.de.proof.shots;
    for (const slug of newCases) {
      const entries = shots.filter((shot) => shot.slug === slug);
      expect(entries).toHaveLength(1);
      expect(entries[0].image).toMatch(/^https:\/\//);
      expect(entries[0].scope.length).toBeGreaterThan(5);
    }
  });

  it("provides German MDX cases with working website links and images", () => {
    for (const slug of newCases) {
      const entry = readFileSync(new URL(`../../src/content/cases/${slug}.mdx`, import.meta.url), "utf8");
      expect(entry).toMatch(/heroImage: "(?:https:\/\/|\/cases\/)/);
      expect(entry).toMatch(/website: "https:\/\//);
      expect(entry).toContain("## Herausforderung");
      expect(entry).toContain("## Lösung");
      expect(entry).toContain("## Ergebnis");
    }
  });
});
