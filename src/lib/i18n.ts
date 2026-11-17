export type Lang = "de" | "en";

export const ui = {
  de: {
    "nav.home": "Start",
    "nav.services": "Leistungen",
    "nav.cases": "Arbeiten",
    "nav.about": "Über",
    "nav.contact": "Kontakt",
    "nav.blog": "Insights",
    "nav.wordpress": "WordPress",
    "nav.ai": "KI & Automation",
    "nav.development": "Webentwicklung",
    "cta.start": "Projekt starten",
    "cta.call": "15 min Call buchen",
  },
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.cases": "Work",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.blog": "Insights",
    "nav.wordpress": "WordPress",
    "nav.ai": "AI & Automation",
    "nav.development": "Web Development",
    "cta.start": "Start a project",
    "cta.call": "Book a 15-min call",
  },
} as const;

/**
 * Die eine Routentabelle: Nav, hreflang, Sitemap und die /en/-Weiterleitungen lesen hier.
 * Eine Seite ist nur dann englisch erreichbar, wenn sie hier einen `en`-Pfad hat.
 */
export const routes = {
  home: { de: "/", en: "/en" },
  wordpress: { de: "/wordpress", en: "/en/wordpress" },
  ai: { de: "/ki-automatisierung", en: "/en/ai-automation" },
  development: { de: "/webentwicklung", en: "/en/web-development" },
  contact: { de: "/kontakt", en: "/en/contact" },
  thanks: { de: "/danke", en: "/en/thanks" },
  grokBot: { de: "/grok-bot-wordpress", en: "/en/grok-bot-wordpress" },
  services: { de: "/leistungen" },
  seo: { de: "/seo-rastatt" },
  cases: { de: "/cases" },
  blog: { de: "/blog" },
  about: { de: "/ueber" },
  lawFirms: { de: "/anwaelte" },
  realEstate: { de: "/luxus-immobilien" },
  clinics: { de: "/privatkliniken" },
  drivingSchools: { de: "/fahrschule-webdesign" },
  doctors: { de: "/docweb" },
  craftsmen: { de: "/handwerk" },
  imprint: { de: "/imprint" },
  privacy: { de: "/datenschutz" },
} as const satisfies Record<string, Partial<Record<Lang, string>>>;

export type RouteName = keyof typeof routes;

const table: Record<string, Partial<Record<Lang, string>>> = routes;
const normalize = (path: string) => path.replace(/\/+$/, "") || "/";

/** Fällt auf die andere Sprache zurück, wenn die Seite in `lang` nicht existiert. */
export function routeFor(name: RouteName, lang: Lang): string {
  const entry = table[name];
  return entry[lang] ?? entry.de ?? entry.en ?? "/";
}

/** True, wenn `routeFor(name, lang)` eine Seite in genau dieser Sprache liefert. */
export function hasRoute(name: RouteName, lang: Lang): boolean {
  return table[name][lang] !== undefined;
}

/** Alle Sprachfassungen einer Seite; leer, wenn es nur eine gibt (dann kein hreflang). */
export function alternatesFor(path: string): Partial<Record<Lang, string>> {
  const current = normalize(path);
  const entry = Object.values(table).find((r) => r.de === current || r.en === current);
  return entry?.de && entry.en ? entry : {};
}

export const englishPaths: ReadonlySet<string> = new Set(
  Object.values(table).flatMap((r) => (r.en ? [r.en] : [])),
);

export const germanPaths: string[] = Object.values(table).flatMap((r) => (r.de ? [r.de] : []));

export function useTranslations(lang: Lang) {
  return (key: keyof (typeof ui)["de"]) => ui[lang][key];
}
