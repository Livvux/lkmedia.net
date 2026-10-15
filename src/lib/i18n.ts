export type Lang = "de";

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
} as const;

export const routes = {
  home: "/",
  services: "/leistungen",
  cases: "/cases",
  blog: "/blog",
  about: "/ueber",
  contact: "/kontakt",
  lawFirms: "/anwaelte",
  realEstate: "/luxus-immobilien",
  clinics: "/privatkliniken",
  drivingSchools: "/fahrschule-webdesign",
  doctors: "/docweb",
  craftsmen: "/handwerk",
  imprint: "/imprint",
  privacy: "/datenschutz",
} as const;

export type RouteName = keyof typeof routes;

export function routeFor(name: RouteName, _lang: Lang): string {
  return routes[name];
}

export function useTranslations(_lang: Lang) {
  return (key: keyof (typeof ui)["de"]) => ui.de[key];
}
