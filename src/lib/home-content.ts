import { DOCWEB } from "./docweb";
import { FAHRSCHULWEB } from "./fahrschulweb";
import { HANDWERKWEB } from "./handwerkweb";
import { type Lang, routeFor } from "./i18n";

export interface Shot {
  slug: string;
  client: string;
  domain: string;
  result: string;
  scope: string;
  image?: string;
}

interface Link {
  label: string;
  href: string;
}

export interface HomeContent {
  hero: {
    statement: string;
    links: Link[];
    facts: string[];
    rail: string[];
    action: Link;
  };
  proof: { title: string; all: Link; shots: Shot[] };
  marquee: string;
  stats: { title: string; figures: { value: string; caption: string }[] };
  search: {
    title: string;
    sub: string;
    defaults: { service: string; place: string; business: string; domain: string };
    note: string;
  };
  niches: { title: string; items: { title: string; body: string; href: string; price?: string }[] };
  process: {
    title: string;
    sub: string;
    steps: { n: string; title: string; body: string }[];
  };
  about: { title: string; lead: string; craft: string; facts: { label: string; value: string }[] };
  cta: {
    lines: [string, string];
    sub: string;
    primary: Link;
    secondary: Link;
  };
}

const shotsDe: Shot[] = [
  {
    slug: "klavierbau-milde",
    client: "Klavierbau Hans Milde",
    domain: "klavierbau-milde.de",
    result: "Position 1–2 für Klavierstimmer in Karlsruhe.",
    scope: "Webdesign & Local SEO",
  },
  {
    slug: "patricks-fahrschule",
    client: "Patricks Fahrschule",
    domain: "patricks-fahrschule.de",
    result: "Platz 1 für fast jeden lokalen Suchbegriff – in zwei Sprachen.",
    scope: "Local SEO & Mehrsprachigkeit",
  },
  {
    slug: "lorenz-logistik",
    client: "Lorenz Logistik",
    domain: "lorenz-logistik.de",
    result: "Neugründung, die vom ersten Tag an Anfragen erzeugt.",
    scope: "Landingpage & Conversion",
  },
  {
    slug: "cleo-coaching",
    client: "CLEO Coaching",
    domain: "cleo-coaching.de",
    result: "SEO-Feintuning plus Workshop-Landingpage, die bucht.",
    scope: "SEO & Workshop-Landingpage",
  },
  {
    slug: "pfotenweb",
    client: "Pfotenweb",
    domain: "pfotenweb.de",
    result: "Vereinswebsite, Tierprofile und Verwaltung an einem Ort.",
    scope: "Tierschutz-Plattform & Produktentwicklung",
    image: "https://pfotenweb.de/images/demo/website.webp",
  },
  {
    slug: "five-rp",
    client: "FiveRP",
    domain: "five-rp.de",
    result: "Serverliste, GTA-RP-Guides und Ressourcen für Betreiber.",
    scope: "Gaming-Portal & Content-Architektur",
    image: "https://five-rp.de/wp-content/uploads/2026/07/fiverp-open-graph.jpg",
  },
  {
    slug: "eichhoernchenberger",
    client: "Eichhörnchen Berger",
    domain: "eichhoernchenberger.de",
    result: "Notfallhilfe und Einblicke in eine ehrenamtliche Auffangstation.",
    scope: "Website & klare Notfall-Kommunikation",
    image: "https://eichhoernchenberger.de/_astro/jungtier-schlafend.DKAZgyRW_Z1KWXhE.jpg",
  },
  {
    slug: "streamerloft",
    client: "StreamerLoft",
    domain: "streamerloft.com",
    result: "Ein WordPress-Website-Kit für Streamer und ihre Community.",
    scope: "Creator-Produkt & WordPress-Entwicklung",
    image: "https://streamerloft.com/og/streamerloft.png",
  },
];

const de: HomeContent = {
  hero: {
    statement: "Webdesign aus Rastatt. Websites und SEO für Ihr Unternehmen.",
    links: [
      { label: "Arbeiten", href: "#arbeiten" },
      { label: "Leistungen", href: routeFor("services", "de") },
      { label: "Ablauf", href: "#ablauf" },
      { label: "Blog", href: routeFor("blog", "de") },
    ],
    facts: [
      "Webdesign & SEO",
      "Rastatt & remote",
      "Direkt mit Lucas Kleipoedszus",
      "Handgebaut in Astro",
      "Kein WordPress, kein Baukasten",
    ],
    rail: [
      "Platz 1–2 für „Klavierstimmer Karlsruhe“",
      "Lighthouse 100 in allen vier Kategorien",
      "0,7 s, bis der Inhalt steht",
      "15 Minuten Erstgespräch",
    ],
    action: { label: "Projekt starten", href: routeFor("contact", "de") },
  },
  proof: {
    title: "Arbeiten",
    all: { label: "Alle Cases", href: routeFor("cases", "de") },
    shots: shotsDe,
  },
  marquee: "Websites, die gefunden werden.",
  stats: {
    title: "Gemessen, nicht versprochen",
    figures: [
      { value: "Platz 1", caption: "für „Klavierstimmer Karlsruhe“ – Klavierbau Hans Milde" },
      {
        value: "0,7 s",
        caption: "Largest Contentful Paint auf klavierbau-milde.de, mobil gemessen",
      },
      {
        value: "100",
        caption: "Lighthouse in Performance, Barrierefreiheit, Best Practices und SEO",
      },
    ],
  },
  search: {
    title: "Wo Ihre Kunden suchen",
    sub: "Tragen Sie Ihre Leistung und Ihren Ort ein. Die Beispiele zeigen, wie verständliche Informationen aussehen können; sie rufen keine Suchergebnisse ab.",
    defaults: {
      service: "Klavierstimmer",
      place: "Karlsruhe",
      business: "Klavierbau Hans Milde",
      domain: "klavierbau-milde.de",
    },
    note: "Klare Antworten und passende strukturierte Daten helfen bei der Einordnung Ihrer Inhalte. llms.txt bietet zusätzliche Orientierung; Rankings und KI-Zitationen lassen sich damit nicht garantieren.",
  },
  niches: {
    title: "Branchen",
    items: [
      {
        title: "Kanzleien",
        body: "Seriöse Auftritte, die Mandanten aus der Region gewinnen – berufsrechtskonform.",
        href: routeFor("lawFirms", "de"),
      },
      {
        title: "Luxus-Immobilien",
        body: "Exposés mit Wirkung und Websites, die Käufer und Eigentümer gleichermaßen überzeugen.",
        href: routeFor("realEstate", "de"),
      },
      {
        title: "Privatkliniken",
        body: "Vertrauen auf den ersten Blick und Terminanfragen, die ohne Umwege ankommen.",
        href: routeFor("clinics", "de"),
      },
      {
        title: "Arztpraxen mit docweb",
        body: "Das Website-Paket für Arzt-, Psychotherapie- und Zahnarztpraxen. Vorschau in der Regel nach 7 Werktagen.",
        href: routeFor("doctors", "de"),
        price: `${DOCWEB.setupPrice} + ${DOCWEB.monthlyPrice} im Monat`,
      },
      {
        title: "Handwerk mit handwerkweb",
        body: "Das Website-Paket für Handwerksbetriebe, mit Formularen für Projektanfragen und Bewerbungen.",
        href: routeFor("craftsmen", "de"),
        price: `${HANDWERKWEB.setupPrice} + ${HANDWERKWEB.monthlyPrice} im Monat`,
      },
      {
        title: "Fahrschulen mit fahrschulweb",
        body: "Das Website-Paket für Fahrschulen, mit Online-Anmeldung direkt auf der Seite.",
        href: routeFor("drivingSchools", "de"),
        price: `${FAHRSCHULWEB.setupPrice} + ${FAHRSCHULWEB.monthlyPrice} im Monat`,
      },
      {
        title: "Lokale Unternehmen",
        body: "Dienstleister und Betriebe aus der Region: Platz 1 in der Region statt Seite 3.",
        href: routeFor("services", "de"),
      },
    ],
  },
  process: {
    title: "Ihr Auftrag",
    sub: "Ein klarer Ablauf, ein Ansprechpartner, keine Überraschungen.",
    steps: [
      { n: "01", title: "Zuerst reden wir 15 Minuten.", body: "Ziele, Zielgruppe und Kennzahlen" },
      { n: "02", title: "Dann sehen Sie das Konzept.", body: "Prototyp und Texte, die verkaufen" },
      { n: "03", title: "Dann baue ich es von Hand.", body: "Astro, auf Tempo und SEO gebaut" },
      { n: "04", title: "Am Ende geht es live.", body: "Search Console, Monitoring, Feinschliff" },
    ],
  },
  about: {
    title: "Direkt mit Lucas",
    lead: "Ich bin Lucas Kleipoedszus und baue jede Website selbst, aus Rastatt oder remote. Vom ersten Call bis zum Launch sprechen Sie mit derselben Person.",
    craft:
      "Handgeschriebener Code statt 40 Plugins, datensparsame Analytics statt Cookie-Banner, Kontraste und Tastaturbedienung für alle Besucher.",
    facts: [
      { label: "Standort", value: "Rastatt" },
      { label: "Arbeitsweise", value: "Vor Ort & remote" },
      { label: "Technik", value: "Astro, statisch" },
      { label: "Analytics", value: "Selbst gehostet" },
    ],
  },
  cta: {
    lines: ["Lassen Sie sich", "finden."],
    sub: "Erzählen Sie kurz von Ihrem Projekt. Sie bekommen eine ehrliche Einschätzung, kein Verkaufsgespräch.",
    primary: { label: "Projekt starten", href: routeFor("contact", "de") },
    secondary: { label: "15-Minuten-Call buchen", href: `${routeFor("contact", "de")}#termin` },
  },
};

export const homeContent: Record<Lang, HomeContent> = { de };
