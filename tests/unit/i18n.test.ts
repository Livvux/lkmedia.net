import { describe, it, expect } from "vitest";
import { routeFor, useTranslations } from "../../src/lib/i18n";

describe("German-only routing", () => {
  it("builds paths without locale prefixes", () => {
    expect(routeFor("contact", "de")).toBe("/kontakt");
    expect(routeFor("about", "de")).toBe("/ueber");
    expect(routeFor("home", "de")).toBe("/");
    expect(routeFor("craftsmen", "de")).toBe("/handwerk");
  });

  it("keeps German UI strings", () => {
    expect(useTranslations("de")("nav.services")).toBe("Leistungen");
  });
});
