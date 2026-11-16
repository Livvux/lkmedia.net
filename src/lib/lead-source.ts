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
  "/wordpress",
  "/ki-automatisierung",
  "/webentwicklung",
  "/en",
  "/en/wordpress",
  "/en/ai-automation",
  "/en/web-development",
  "/en/grok-bot-wordpress",
]);

// Anliegen im Kontaktformular; der Schlüssel landet in der Anfrage-Mail, nie freier Text.
export const SERVICES = {
  unknown: { de: "Noch offen", en: "Not sure yet" },
  wordpress: { de: "WordPress", en: "WordPress" },
  ai: { de: "KI & Automation", en: "AI & automation" },
  development: { de: "Website oder Web-Anwendung", en: "Website or web application" },
  package: { de: "Website-Paket (Praxis, Handwerk, Fahrschule)", en: "Website package (Germany)" },
  seo: { de: "SEO & Optimierung", en: "SEO & optimization" },
} as const;

export function serviceInterest(value: string): keyof typeof SERVICES {
  return Object.hasOwn(SERVICES, value) ? (value as keyof typeof SERVICES) : "unknown";
}

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
