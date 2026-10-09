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
  en: routeFor("cases", "en"),
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

const en: ServicesContent = {
  hero: {
    lines: ["From the first search", "to the next enquiry."],
    sub: "Web design, SEO and conversion in one place. We build your website, make your offer clear and give visitors a straightforward way to get in touch.",
    note: homeContent.en.hero.note,
    primary: { label: "Start a project", href: routeFor("contact", "en") },
    secondary: { label: "Book a 15 min call", href: `${routeFor("contact", "en")}#termin` },
    workLabel: "Selected client projects",
    navigationLabel: "Explore our services",
  },
  services: [
    {
      id: "websites",
      name: "Website & Development",
      title: "A website that feels like you.",
      body: "A website that makes your offer clear and builds trust. Individually developed in Astro, with fast load times and accessible navigation.",
      points: [
        "Custom development with Astro and modern web standards",
        "Core Web Vitals in the green",
        "Accessible interactions following WCAG",
        "Structured data with Schema.org",
      ],
      link: {
        label: "View the Klavierbau Milde project",
        href: `${casesBase.en}/klavierbau-milde`,
      },
    },
    {
      id: "seo",
      name: "SEO & Content",
      title: "Get found when it matters.",
      body: "We shape your site structure and content around your audience's questions. For Google and AI search, with useful answers and clearly established expertise.",
      points: [
        "Keyword strategy based on topics and search intent",
        "Detailed editorial briefs for relevant content",
        "Visible expertise, trustworthiness and authorship (E-E-A-T)",
        "Content prepared for AI Overviews and AI assistants",
      ],
      link: {
        label: "View the Patricks Fahrschule project",
        href: `${casesBase.en}/patricks-fahrschule`,
      },
    },
    {
      id: "conversion",
      name: "Conversion & Marketing",
      title: "Turn interest into enquiries.",
      body: "We make the path from a first visit to getting in touch clear. Focused pages, targeted tests and useful reporting reveal where your website can improve.",
      points: [
        "Landing pages with a clear goal",
        "A/B tests based on meaningful data",
        "Enquiry journeys and lead nurturing",
        "Clear reporting to guide your next decisions",
      ],
      link: {
        label: "View the CLEO Coaching project",
        href: `${casesBase.en}/cleo-coaching`,
      },
    },
  ],
  proof: {
    title: "See what that looks like in practice.",
    body: "Selected websites and digital platforms for businesses, animal rescue and creators. Different needs, practical solutions.",
    linkLabel: "View all projects",
  },
  investment: {
    title: "Clear scope. Fixed price.",
    price: "Projects from €25,000",
    body: "Your fixed price is based on the agreed project scope.",
    note: "No hourly billing.",
  },
  faq: {
    title: "Before our first conversation.",
    items: [
      {
        q: "What does a project cost?",
        a: "Projects start at €25,000. The fixed price depends on the agreed scope. We do not bill by the hour.",
      },
      {
        q: "Can you improve my existing website?",
        a: "Yes. For CLEO Coaching, we improved the existing site's structure, content, metadata and internal links. We also created a dedicated landing page for their workshops.",
      },
      {
        q: "What does working together involve?",
        a: "We start with your goals and audience, then develop the concept, clickable prototype and copy before building the site. Launch includes publishing, Search Console, monitoring and final refinements. You work directly with Lucas Kleipoedszus.",
      },
      {
        q: "Do you account for Google and AI search?",
        a: "Yes. We work on search intent, clear content and structured data to help search engines and AI systems understand your offer. We cannot guarantee specific Google rankings or citations in AI answers.",
      },
    ],
  },
  cta: homeContent.en.cta,
};

export const servicesContent: Record<Lang, ServicesContent> = { de, en };
