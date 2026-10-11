import { type HomeContent, homeContent } from "./home-content";
import { type Lang, routeFor } from "./i18n";

export interface Service {
  id: "websites" | "seo" | "conversion";
  name: string;
  title: string;
  body: string;
  points: string[];
  link: { label: string; href: string };
}

export interface ServicesContent {
  hero: {
    lines: [string, string];
    sub: string;
    note: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
    workLabel: string;
    navigationLabel: string;
  };
  services: [Service, Service, Service];
  proof: { title: string; body: string; linkLabel: string };
  investment: { title: string; price: string; body: string; note: string };
  faq: { title: string; items: { q: string; a: string }[] };
  cta: HomeContent["cta"];
}

const casesBase = {
  de: routeFor("cases", "de"),
};

const de: ServicesContent = {
  hero: {
    lines: ["Von der ersten Suche", "zur nächsten Anfrage."],
    sub: "Webdesign, SEO und Conversion aus einer Hand. Wir entwickeln Ihren Auftritt, machen Ihr Angebot verständlich und den Weg zur Kontaktaufnahme einfach.",
    note: homeContent.de.hero.note,
    primary: { label: "Projekt starten", href: routeFor("contact", "de") },
    secondary: { label: "15-min-Call buchen", href: `${routeFor("contact", "de")}#termin` },
    workLabel: "Ausgewählte Kundenprojekte",
    navigationLabel: "Unsere Leistungen im Überblick",
  },
  services: [
    {
      id: "websites",
      name: "Website & Development",
      title: "Ein Auftritt, der zu Ihnen passt.",
      body: "Eine Website, die Ihr Angebot klar macht und Vertrauen schafft. Individuell in Astro entwickelt, mit kurzen Ladezeiten und zugänglicher Bedienung.",
      points: [
        "Individuelle Entwicklung mit Astro und modernen Webstandards",
        "Core Web Vitals im grünen Bereich",
        "Barrierefreie Bedienung nach WCAG",
        "Strukturierte Daten mit Schema.org",
      ],
      link: {
        label: "Projekt Klavierbau Milde ansehen",
        href: `${casesBase.de}/klavierbau-milde`,
      },
    },
    {
      id: "seo",
      name: "SEO & Content",
      title: "Gefunden werden, wenn es zählt.",
      body: "Wir richten Struktur und Inhalte auf die Fragen Ihrer Zielgruppe aus. Für Google und KI-Suchen, mit verständlichen Antworten und klar erkennbarer Expertise.",
      points: [
        "Keyword-Strategie nach Themen und Suchabsicht",
        "Präzise Content-Briefings für relevante Inhalte",
        "Expertise, Vertrauenswürdigkeit und Autoren sichtbar machen (E-E-A-T)",
        "Inhalte für AI Overviews und KI-Assistenten aufbereiten",
      ],
      link: {
        label: "Projekt Patricks Fahrschule ansehen",
        href: `${casesBase.de}/patricks-fahrschule`,
      },
    },
    {
      id: "conversion",
      name: "Conversion & Marketing",
      title: "Aus Interesse wird eine Anfrage.",
      body: "Wir machen den Weg vom ersten Besuch bis zur Kontaktaufnahme klar. Fokussierte Seiten, gezielte Tests und verständliche Auswertungen zeigen, wo sich Ihr Auftritt verbessern lässt.",
      points: [
        "Landingpages mit einem klaren Ziel",
        "A/B-Tests auf Basis aussagekräftiger Daten",
        "Kontaktwege und die weitere Ansprache von Interessenten",
        "Verständliche Reports für die nächsten Entscheidungen",
      ],
      link: {
        label: "Projekt CLEO Coaching ansehen",
        href: `${casesBase.de}/cleo-coaching`,
      },
    },
  ],
  proof: {
    title: "So sieht das in der Praxis aus.",
    body: "Ausgewählte Websites und digitale Plattformen für Unternehmen, Tierschutz und Creator. Unterschiedliche Aufgaben, konkrete Umsetzungen.",
    linkLabel: "Alle Projekte ansehen",
  },
  investment: {
    title: "Klarer Umfang. Fester Preis.",
    price: "Projekte ab 25.000 €",
    body: "Der Festpreis richtet sich nach dem vereinbarten Projektumfang.",
    note: "Keine Stundenabrechnung.",
  },
  faq: {
    title: "Vor dem ersten Gespräch.",
    items: [
      {
        q: "Was kostet ein Projekt?",
        a: "Projekte starten ab 25.000 €. Der konkrete Festpreis richtet sich nach dem vereinbarten Umfang. Wir rechnen nicht nach Stunden ab.",
      },
      {
        q: "Können Sie meine bestehende Website verbessern?",
        a: "Ja. Bei CLEO Coaching haben wir die bestehende Website in Struktur, Inhalten, Metadaten und interner Verlinkung optimiert. Dazu kam eine eigene Landingpage für die Workshops.",
      },
      {
        q: "Wie läuft die Zusammenarbeit ab?",
        a: "Wir klären zuerst Ziele und Zielgruppe. Darauf folgen Konzept, klickbarer Prototyp und Texte, anschließend die Entwicklung. Zum Launch gehören Veröffentlichung, Search Console, Monitoring und Feinschliff. Sie arbeiten direkt mit Lucas Kleipoedszus.",
      },
      {
        q: "Berücksichtigen Sie Google und KI-Suchen?",
        a: "Ja. Wir arbeiten an Suchabsichten, verständlichen Inhalten und strukturierten Daten. Das hilft Suchmaschinen und KI-Systemen, Ihr Angebot einzuordnen. Bestimmte Google-Platzierungen oder Zitationen in KI-Antworten können wir nicht garantieren.",
      },
    ],
  },
  cta: homeContent.de.cta,
};

export const servicesContent: Record<Lang, ServicesContent> = { de };
