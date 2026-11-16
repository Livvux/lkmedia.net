import { describe, it, expect } from "vitest";
import { alternatesFor, hasRoute, routeFor, useTranslations } from "../../src/lib/i18n";

describe("bilingual routing", () => {
  it("builds paths without locale prefixes", () => {
    expect(routeFor("contact", "de")).toBe("/kontakt");
    expect(routeFor("about", "de")).toBe("/ueber");
    expect(routeFor("home", "de")).toBe("/");
    expect(routeFor("craftsmen", "de")).toBe("/handwerk");
  });

  it("keeps German UI strings", () => {
    expect(useTranslations("de")("nav.services")).toBe("Leistungen");
    expect(useTranslations("de")("nav.cases")).toBe("Arbeiten");
    expect(useTranslations("de")("nav.blog")).toBe("Insights");
  });

  it("serves English only where an English page exists", () => {
    expect(routeFor("home", "en")).toBe("/en");
    expect(routeFor("contact", "en")).toBe("/en/contact");
    expect(hasRoute("about", "en")).toBe(false);
    expect(routeFor("about", "en")).toBe("/ueber");
  });

  it("pairs language versions for hreflang only when both exist", () => {
    expect(alternatesFor("/")).toEqual({ de: "/", en: "/en" });
    expect(alternatesFor("/en/")).toEqual({ de: "/", en: "/en" });
    expect(alternatesFor("/ueber")).toEqual({});
  });
});
