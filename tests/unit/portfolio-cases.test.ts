import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeContent } from "../../src/lib/home-content";

const newCases = ["pfotenweb","five-rp","eichhoernchenberger","streamerloft"];

describe("Portfolio cases and proof", () => {
  it("lists all four projects exactly once in both languages with real project imagery", () => {
    for (const lang of ["de", "en"] as const) {
      const shots = homeContent[lang].proof.shots;
      for (const slug of newCases) {
        const entries = shots.filter((shot) => shot.slug === slug);
        expect(entries).toHaveLength(1);
        expect(entries[0].image).toMatch(/^https:\/\//);
        expect(entries[0].scope.length).toBeGreaterThan(5);
      }
    }
  });

  it("provides MDX cases with website links, images and English sections", () => {
    for (const slug of newCases) {
      const entry = readFileSync(new URL(`../../src/content/cases/${slug}.mdx`, import.meta.url), "utf8");
      expect(entry).toMatch(/heroImage: "https:\/\//);
      expect(entry).toMatch(/website: "https:\/\//);
      expect(entry).toContain("sectionsEn:");
      expect(entry).toContain("## Herausforderung");
      expect(entry).toContain("## Lösung");
      expect(entry).toContain("## Ergebnis");
    }
  });
});
