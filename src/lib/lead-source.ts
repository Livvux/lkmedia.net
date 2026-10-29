const SOURCES = new Set([
  "/",
  "/anwaelte",
  "/privatkliniken",
  "/luxus-immobilien",
  "/docweb",
  "/handwerk",
  "/fahrschule-webdesign",
  "/leistungen",
  "/seo-rastatt",
  "/blog",
]);

/** Only a public offer path is retained, never an arbitrary URL, query or personal data. */
export function leadSource(value: string): string {
  const path = value === "/" ? "/" : value.replace(/\/+$/, "");
  return SOURCES.has(path) ? path : "/kontakt";
}

export const DISCOVERY_CHANNELS = {
  unknown: "Keine Angabe",
  google: "Google",
  bing: "Bing oder andere Suchmaschine",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  other_ai: "Andere KI-Suche",
  referral: "Persönliche Empfehlung",
  social: "Social Media",
  other: "Anderer Weg",
} as const;

/** Optional, self-reported acquisition source; never accept free text or URLs. */
export function discoveryChannel(value: string): keyof typeof DISCOVERY_CHANNELS {
  return Object.hasOwn(DISCOVERY_CHANNELS, value)
    ? (value as keyof typeof DISCOVERY_CHANNELS)
    : "unknown";
}
