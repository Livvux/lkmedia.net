export type Lang = "de" | "en";

export const languages = { de: "Deutsch", en: "English" } as const;

export const ui = {
  de: {
    "nav.home": "Start",
    "nav.services": "Leistungen",
    "nav.cases": "Cases",
    "nav.about": "Über",
    "nav.contact": "Kontakt",
    "nav.blog": "Blog",
    "cta.start": "Projekt starten",
    "cta.call": "15 min Call buchen",
  },
  en: {
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.cases": "Cases",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.blog": "Blog",
    "cta.start": "Start a project",
    "cta.call": "Book a 15 min call",
  },
} as const;

export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split("/")[1];
  return seg === "en" ? "en" : "de";
}

export function pathFor(path: string, lang: Lang): string {
  const clean = path.replace(/^\//, "");
  return lang === "de" ? `/${clean}` : `/en/${clean}`;
}

/** Named routes → real localized paths (EN slugs differ from DE for some pages). */
export const routes = {
  home: { de: "/", en: "/en/" },
  services: { de: "/leistungen", en: "/en/leistungen" },
  cases: { de: "/cases", en: "/en/cases" },
  blog: { de: "/blog", en: "/en/blog" },
  about: { de: "/ueber", en: "/en/about" },
  contact: { de: "/kontakt", en: "/en/contact" },
  lawFirms: { de: "/anwaelte", en: "/en/anwaelte" },
  realEstate: { de: "/luxus-immobilien", en: "/en/luxus-immobilien" },
  clinics: { de: "/privatkliniken", en: "/privatkliniken" },
  imprint: { de: "/imprint", en: "/imprint" },
  privacy: { de: "/datenschutz", en: "/datenschutz" },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteName = keyof typeof routes;

export function routeFor(name: RouteName, lang: Lang): string {
  return routes[name][lang];
}

export function useTranslations(lang: Lang) {
  return (key: keyof (typeof ui)["de"]) => ui[lang][key] ?? ui.de[key];
}
