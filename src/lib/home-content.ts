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

export interface Offer {
  title: string;
  body: string;
  href: string;
  price?: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    lead: string;
    primary: Link;
    secondary: Link;
    facts: string[];
  };
  proof: { title: string; sub: string; all: Link; shots: Shot[] };
  stats: { title: string; figures: { value: string; caption: string }[] };
  search: {
    title: string;
    sub: string;
    defaults: { service: string; place: string; business: string; domain: string };
    note: string;
  };
  offers: {
    title: string;
    sub: string;
    tabs: { value: string; label: string; lead: string; link: Link; items: Offer[] }[];
  };
  process: {
    title: string;
    sub: string;
    steps: { n: string; title: string; body: string }[];
  };
  journal: { title: string; sub: string; all: Link };
  about: { title: string; lead: string; craft: string; facts: { label: string; value: string }[] };
  cta: {
    lines: [string, string];
    sub: string;
    primary: Link;
    secondary: Link;
  };
}

// Reihenfolge = Reihenfolge auf der Startseite bei gleichem Case-Datum (neueste Cases zuerst).
const shotsDe: Shot[] = [
  {
    slug: "eichhoernchenberger",
    client: "Eichhörnchen Berger",
    domain: "eichhoernchenberger.de",
    result: "Notfallhilfe und Einblicke in eine ehrenamtliche Auffangstation.",
    scope: "Website & Notfall-Kommunikation",
    image: "https://eichhoernchenberger.de/_astro/jungtier-schlafend.DKAZgyRW_Z1KWXhE.jpg",
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
    slug: "streamerloft",
    client: "StreamerLoft",
    domain: "streamerloft.com",
    result: "Ein WordPress-Website-Kit für Streamer und ihre Community.",
    scope: "Creator-Produkt & WordPress",
    image: "https://streamerloft.com/og/streamerloft.png",
  },
  {
    slug: "klavierbau-milde",
    client: "Klavierbau Hans Milde",
    domain: "klavierbau-milde.de",
    result: "Leistungen, regionale Informationen und klare Kontaktwege für einen Klavierbauer.",
    scope: "Webdesign & Local SEO",
  },
  {
    slug: "patricks-fahrschule",
    client: "Patricks Fahrschule",
    domain: "patricks-fahrschule.de",
    result: "Standortseiten und rumänischsprachige Informationen für echte Filialen.",
    scope: "Local SEO & Mehrsprachigkeit",
  },
  {
    slug: "cleo-coaching",
    client: "CLEO Coaching",
    domain: "cleo-coaching.de",
    result: "SEO-Feintuning plus Workshop-Landingpage, die bucht.",
    scope: "SEO & Workshop-Landingpage",
  },
  {
    slug: "lorenz-logistik",
    client: "Lorenz Logistik",
    domain: "lorenz-logistik.de",
    result: "Neugründung, die vom ersten Tag an Anfragen erzeugt.",
    scope: "Landingpage & Conversion",
  },
];

const de: HomeContent = {
  hero: {
    eyebrow: "Webdesign & SEO · Rastatt & remote",
    title: "Webdesign aus Rastatt.",
    subtitle: "Klar für Ihre Kunden. Betreut von Lucas.",
    lead: "Ich plane und entwickle Ihre Website, strukturiere Leistungen und Kontaktwege und übernehme die technische Betreuung. Für Praxen, Fahrschulen und Handwerksbetriebe gibt es feste Pakete; besondere Anforderungen besprechen wir individuell.",
    primary: { label: "Website-Pakete vergleichen", href: routeFor("services", "de") },
    secondary: {
      label: "Individuelles Projekt besprechen",
      href: `${routeFor("contact", "de")}#termin`,
    },
    facts: [
      "Direkt mit Lucas",
      "Feste Paketleistungen",
      "Individuell ab 25.000 €",
      "15 Minuten Erstgespräch",
    ],
  },
  proof: {
    title: "Arbeiten",
    sub: "Neueste Projekte zuerst: Plattformen, Portale und lokale Websites.",
    all: { label: "Alle Cases", href: routeFor("cases", "de") },
    shots: shotsDe,
  },
  stats: {
    title: "Was Sie von der Zusammenarbeit erwarten können",
    figures: [
      { value: "Persönlich", caption: "Konzept, Gestaltung und Entwicklung direkt mit Lucas" },
      {
        value: "Definiert",
        caption: "Paketleistungen, laufende Kosten und Mindestlaufzeit vor der Bestellung",
      },
      {
        value: "Betreut",
        caption: "Hosting und vereinbarte Inhaltsänderungen in den Branchenpaketen",
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
  offers: {
    title: "Zwei Wege zu Ihrer Website",
    sub: "Ein Festpreis-Paket für typische Branchen oder ein individuelles Projekt mit eigenem Konzept.",
    tabs: [
      {
        value: "pakete",
        label: "Branchenpakete",
        lead: "Bewährte Seitenstruktur, definierte Funktionen und laufende Betreuung. Einrichtung ab 1.490 € plus Monatspreis, inkl. USt., 12 Monate Mindestlaufzeit und zusätzliche Domainkosten laut Angebot.",
        link: { label: "Pakete und Gesamtkosten vergleichen", href: routeFor("services", "de") },
        items: [
          {
            title: "Arztpraxen mit docweb",
            body: "Für Arzt-, Psychotherapie- und Zahnarztpraxen. Vorschau in der Regel nach 7 Werktagen.",
            href: routeFor("doctors", "de"),
            price: `${DOCWEB.setupPrice} + ${DOCWEB.monthlyPrice} im Monat`,
          },
          {
            title: "Handwerk mit handwerkweb",
            body: "Für Handwerksbetriebe, mit Formularen für Projektanfragen und Bewerbungen.",
            href: routeFor("craftsmen", "de"),
            price: `${HANDWERKWEB.setupPrice} + ${HANDWERKWEB.monthlyPrice} im Monat`,
          },
          {
            title: "Fahrschulen mit fahrschulweb",
            body: "Für Fahrschulen, mit Online-Anmeldung direkt auf der Seite.",
            href: routeFor("drivingSchools", "de"),
            price: `${FAHRSCHULWEB.setupPrice} + ${FAHRSCHULWEB.monthlyPrice} im Monat`,
          },
        ],
      },
      {
        value: "individuell",
        label: "Individuell ab 25.000 €",
        lead: "Für umfangreiche Kanzlei-, Klinik- und Immobilienprojekte. Konzept, Design und Entwicklung richten sich nach Ihren Anforderungen. Schnittstellen, Inhalte und Betreuung werden im Angebot festgelegt.",
        link: { label: "Individuelles Projekt besprechen", href: routeFor("contact", "de") },
        items: [
          {
            title: "Kanzleien",
            body: "Seriöse Auftritte, die Mandanten aus der Region gewinnen, berufsrechtskonform.",
            href: routeFor("lawFirms", "de"),
          },
          {
            title: "Luxus-Immobilien",
            body: "Exposés mit Wirkung und Websites, die Käufer und Eigentümer überzeugen.",
            href: routeFor("realEstate", "de"),
          },
          {
            title: "Privatkliniken",
            body: "Vertrauen auf den ersten Blick und Terminanfragen, die ohne Umwege ankommen.",
            href: routeFor("clinics", "de"),
          },
          {
            title: "Lokale Unternehmen",
            body: "Dienstleister und Betriebe aus der Region, mit Local SEO von Anfang an.",
            href: routeFor("services", "de"),
          },
        ],
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
  journal: {
    title: "Aus dem Blog",
    sub: "Praxiswissen zu Webdesign, lokalem SEO und Marketing.",
    all: { label: "Alle Artikel", href: routeFor("blog", "de") },
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
