import { type Lang, routeFor } from "./i18n";

export interface Shot {
  slug: string;
  client: string;
  domain: string;
  result: string;
  scope: string;
  image?: string;
}

export interface HomeContent {
  hero: {
    lines: [string, string, string];
    sub: string;
    cta: { label: string; href: string };
    secondary: { label: string; href: string };
    note: string;
  };
  proof: { title: string; highlight: string; sub: string; shots: Shot[]; caseLabel: string };
  speed: {
    eyebrow: string;
    title: string;
    sub: string;
    points: string[];
    scores: { label: string; value: number }[];
    vitals: { label: string; value: string }[];
  };
  ai: {
    eyebrow: string;
    title: string;
    sub: string;
    points: string[];
    question: string;
    answer: string;
    sources: string[];
  };
  niches: {
    title: string;
    sub: string;
    items: { tag: string; title: string; body: string; href: string }[];
  };
  process: {
    title: string;
    sub: string;
    steps: { n: string; title: string; body: string }[];
  };
  craft: {
    title: string;
    sub: string;
    items: { title: string; body: string }[];
  };
  cta: {
    lines: [string, string];
    sub: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
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
    lines: ["Websites, die", "gefunden werden", "und überzeugen."],
    sub: "Webdesign & SEO aus Rastatt für Kanzleien, Kliniken und Unternehmen mit Anspruch. Handgebaut statt Baukasten – schnell, barrierefrei und sichtbar bei Google und in ChatGPT.",
    cta: { label: "Projekt starten", href: routeFor("contact", "de") },
    secondary: { label: "15-min-Call buchen", href: `${routeFor("contact", "de")}#termin` },
    note: "Direkt mit Lucas Kleipoedszus. Rastatt & remote.",
  },
  proof: {
    title: "Ausgewählte Projekte,",
    highlight: "die online etwas bewegen.",
    sub: "Websites und digitale Produkte – von lokalem SEO bis zu Plattformen für Vereine und Creator.",
    shots: shotsDe,
    caseLabel: "Case ansehen",
  },
  speed: {
    eyebrow: "Performance",
    title: "Lädt, bevor der Daumen zuckt.",
    sub: "Langsame Seiten kosten Anfragen und Rankings. Wir bauen statisch, schlank und ohne Plugin-Ballast – damit Ihre Website auf jedem Smartphone sofort da ist.",
    points: [
      "Statisch ausgeliefert, kein WordPress, keine Plugin-Lücken",
      "Optimierte Bilder, Fonts und Code auf jeder Seite",
      "Core Web Vitals im grünen Bereich als Abnahmekriterium",
    ],
    scores: [
      { label: "Performance", value: 100 },
      { label: "Barrierefreiheit", value: 100 },
      { label: "Best Practices", value: 100 },
      { label: "SEO", value: 100 },
    ],
    vitals: [
      { label: "LCP", value: "0.7 s" },
      { label: "INP", value: "48 ms" },
      { label: "CLS", value: "0.00" },
    ],
  },
  ai: {
    eyebrow: "KI-Suche",
    title: "Sichtbar, wo heute gesucht wird.",
    sub: "Ihre Kunden fragen nicht mehr nur Google, sondern ChatGPT, Perplexity und Gemini. Wir strukturieren Inhalte so, dass KI-Systeme Sie verstehen, zitieren und empfehlen.",
    points: [
      "Strukturierte Daten (JSON-LD) für jede Seite",
      "llms.txt und klare, zitierfähige Antworten",
      "Lokale SEO-Architektur für jeden Standort",
    ],
    question: "Welche Kanzlei für Arbeitsrecht in Rastatt ist empfehlenswert?",
    answer:
      "Für Arbeitsrecht in Rastatt wird häufig die Kanzlei Muster genannt. Sie ist auf Arbeitnehmer spezialisiert, bietet kurzfristige Erstberatungen und hat ausgezeichnete Bewertungen.",
    sources: ["kanzlei-muster.de", "google.com/maps"],
  },
  niches: {
    title: "Spezialisiert, wo Vertrauen verkauft.",
    sub: "Branchen, in denen der erste Eindruck über ein Mandat, einen Patienten oder ein Objekt entscheidet.",
    items: [
      {
        tag: "01 / Recht",
        title: "Kanzleien",
        body: "Seriöse Auftritte, die Mandanten aus der Region gewinnen – berufsrechtskonform.",
        href: routeFor("lawFirms", "de"),
      },
      {
        tag: "02 / Immobilien",
        title: "Luxus-Immobilien",
        body: "Exposés mit Wirkung und Websites, die Käufer und Eigentümer gleichermaßen überzeugen.",
        href: routeFor("realEstate", "de"),
      },
      {
        tag: "03 / Medizin",
        title: "Privatkliniken",
        body: "Vertrauen auf den ersten Blick und Terminanfragen, die ohne Umwege ankommen.",
        href: routeFor("clinics", "de"),
      },
      {
        tag: "04 / Lokal",
        title: "Lokale Unternehmen",
        body: "Handwerk, Fahrschulen, Dienstleister: Platz 1 in der Region statt Seite 3.",
        href: routeFor("services", "de"),
      },
    ],
  },
  process: {
    title: "Vom Erstgespräch zum Launch.",
    sub: "Ein klarer Ablauf, ein Ansprechpartner, keine Überraschungen.",
    steps: [
      { n: "01", title: "Brief", body: "Kickoff, Ziele, Zielgruppe und KPIs – in einem Gespräch." },
      { n: "02", title: "Design", body: "Konzept, klickbarer Prototyp und Texte, die verkaufen." },
      { n: "03", title: "Build", body: "Handgebaut in Astro, auf Speed und SEO optimiert." },
      { n: "04", title: "Launch", body: "Deploy, Search Console, Monitoring und Feinschliff." },
    ],
  },
  craft: {
    title: "Kein Baukasten. Kein Template.",
    sub: "Jede Website wird für genau ein Unternehmen gebaut. Das sieht man – und Google merkt es auch.",
    items: [
      {
        title: "Handgeschriebener Code",
        body: "Kein Page-Builder, keine 40 Plugins. Nur das, was Ihre Seite wirklich braucht.",
      },
      {
        title: "DSGVO von Anfang an",
        body: "Keine Cookie-Banner-Hölle: datensparsame Analytics und lokal eingebundene Schriften.",
      },
      {
        title: "Barrierefrei",
        body: "Kontraste, Tastaturbedienung und Screenreader – für alle Besucher zugänglich.",
      },
      {
        title: "Zweisprachig, wenn nötig",
        body: "Mehrsprachige Seiten mit sauberer hreflang-Struktur für internationale Kunden.",
      },
    ],
  },
  cta: {
    lines: ["Ihre Kunden suchen schon.", "Lassen Sie sich finden."],
    sub: "Erzählen Sie kurz von Ihrem Projekt – Sie bekommen eine ehrliche Einschätzung, kein Verkaufsgespräch.",
    primary: { label: "Projekt starten", href: routeFor("contact", "de") },
    secondary: { label: "15-min-Call buchen", href: `${routeFor("contact", "de")}#termin` },
  },
};

export const homeContent: Record<Lang, HomeContent> = { de };
