import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeContent } from "../../src/lib/home-content";

const newCases = ["pfotenweb", "five-rp", "eichhoernchenberger", "streamerloft"];

describe("Portfolio cases and proof", () => {
  it("lists all four projects once in German with real imagery", () => {
    const shots = homeContent.de.proof.shots;
    for (const slug of newCases) {
      const entries = shots.filter((shot) => shot.slug === slug);
      expect(entries).toHaveLength(1);
      expect(entries[0].image).toMatch(/^(?:https:\/\/|\/cases\/)/);
      expect(entries[0].scope.length).toBeGreaterThan(5);
    }
  });

  it("tells every case as problem, solution and deliverable in both languages", () => {
    const de = homeContent.de.proof.shots;
    const en = homeContent.en.proof.shots;
    expect(en.map((shot) => shot.slug)).toEqual(de.map((shot) => shot.slug));
    for (const shot of [...de, ...en]) {
      expect(existsSync(new URL(`../../src/content/cases/${shot.slug}.mdx`, import.meta.url))).toBe(true);
      for (const text of [shot.problem, shot.solution, shot.deliverable]) {
        expect(text.length).toBeGreaterThan(10);
        expect(text.length).toBeLessThan(110);
      }
      const image = shot.image ?? `/landing/shots/${shot.slug}-1440.webp`;
      if (image.startsWith("/")) {
        expect(existsSync(new URL(`../../public${image}`, import.meta.url)), image).toBe(true);
      }
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
