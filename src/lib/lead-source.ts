const SOURCES = new Set([
  "/",
  "/anwaelte",
  "/privatkliniken",
  "/luxus-immobilien",
  "/docweb",
  "/handwerk",
  "/fahrschule-webdesign",
  "/leistungen",
  "/blog",
]);

/** Only a public offer path is retained, never an arbitrary URL, query or personal data. */
export function leadSource(value: string): string {
  const path = value === "/" ? "/" : value.replace(/\/+$/, "");
  return SOURCES.has(path) ? path : "/kontakt";
}
