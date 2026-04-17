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

export function useTranslations(lang: Lang) {
  return (key: keyof (typeof ui)["de"]) => ui[lang][key] ?? ui.de[key];
}
