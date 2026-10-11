import { describe, it, expect } from "vitest";
import { getLangFromUrl, pathFor, routeFor, useTranslations } from "../../src/lib/i18n";

describe("German-only routing", () => {
  it("uses German for the entire site", () => {
    expect(getLangFromUrl(new URL("https://lkmedia.net/leistungen"))).toBe("de");
    expect(getLangFromUrl(new URL("https://lkmedia.net/en/blog"))).toBe("de");
  });

  it("builds paths without locale prefixes", () => {
    expect(pathFor("leistungen", "de")).toBe("/leistungen");
    expect(pathFor("/blog", "de")).toBe("/blog");
    expect(routeFor("contact", "de")).toBe("/kontakt");
    expect(routeFor("about", "de")).toBe("/ueber");
    expect(routeFor("home", "de")).toBe("/");
    expect(routeFor("craftsmen", "de")).toBe("/handwerk");
  });

  it("keeps German UI strings", () => {
    expect(useTranslations("de")("nav.services")).toBe("Leistungen");
  });
});
