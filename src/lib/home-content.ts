import { DOCWEB } from "./docweb";
import { FAHRSCHULWEB } from "./fahrschulweb";
import { HANDWERKWEB } from "./handwerkweb";
import { type Lang, routeFor } from "./i18n";

interface Link {
  label: string;
  href: string;
}

/** Ein Projekt aus src/content/cases; Texte nur aus der jeweiligen Case-Datei. */
export interface Shot {
  slug: string;
  client: string;
  scope: string;
  image?: string;
  problem: string;
  solution: string;
  deliverable: string;
}

interface Head {
  label: string;
  title: string;
  quiet: string;
}

export interface HomeContent {
  hero: Head & {
    lede: string;
    primary: Link;
    secondary: Link;
  };
  services: Head & {
    sub: string;
    items: { title: string; outcome: string; keywords: [string, string, string]; href: string }[];
    packages?: Head & {
      all: Link;
      items: { name: string; audience: string; price: string; href: string }[];
    };
  };
  showcase: Head & { body: [string, string]; evidence: string };
  proof: Head & {
    all: Link;
    /** Hinweis an Case-Links, wenn die Case-Seiten nicht in der Seitensprache vorliegen. */
    langNote?: string;
    steps: [string, string, string];
    shots: Shot[];
  };
  why: Head & { items: { title: string; body: string }[]; metrics: string[] };
  process: { title: string; sub: string; steps: { n: string; title: string; body: string }[] };
  journal?: Head & { all: Link };
  about: Head & {
    lead: string;
    body: string;
    facts: { label: string; value: string }[];
    link: Link & { hreflang?: Lang };
    photoAlt: string;
  };
  cta: Head & {
    sub: string;
    promises: string[];
    primary: Link;
    secondary: Link;
    email: string;
  };
}

const EMAIL = "lucas@lkmedia.net";

// Reihenfolge = Reihenfolge auf der Startseite bei gleichem Case-Datum (neueste Cases zuerst).
const shotsDe: Shot[] = [
  {
    slug: "eichhoernchenberger",
    client: "Eichhörnchen Berger",
    scope: "Website & Notfall-Kommunikation",
    image: "/cases/eichhoernchenberger/desktop.webp",
    problem: "Wer ein verletztes Tier findet, braucht sofort Orientierung und eine Telefonnummer.",
    solution: "Notfallkontakt als erster Einstieg, Erste Hilfe in vier Schritten.",
    deliverable: "Astro-Website mit Notfallseite, Tiergeschichten und Spendenwegen.",
  },
  {
    slug: "pfotenweb",
    client: "Pfotenweb",
    scope: "Tierschutz-Plattform & Produktentwicklung",
    image: "https://pfotenweb.de/images/demo/website.webp",
    problem: "Ehrenamtliche Teams pflegen Website, Tiere und Anfragen an getrennten Orten.",
    solution: "Vereinswebsite und Verwaltung in einer Plattform, auch mobil.",
    deliverable: "Live-Produkt mit Tierprofilen, Postfach und Schutzverträgen.",
  },
  {
    slug: "five-rp",
    client: "FiveRP",
    scope: "WordPress-Portal & Content-Architektur",
    image: "https://five-rp.de/wp-content/uploads/2026/07/fiverp-open-graph.jpg",
    problem: "Aus einem ehemaligen GTA-RP-Server sollte ein Portal für zwei Zielgruppen werden.",
    solution: "Getrennte Einstiege für Spieler und Serverbetreiber.",
    deliverable: "WordPress-Portal mit FiveM-Serverliste, Guides und Ressourcen.",
  },
  {
    slug: "streamerloft",
    client: "StreamerLoft",
    scope: "Creator-Produkt & WordPress",
    image: "/cases/streamerloft.webp",
    problem: "Streamer verteilen Livestream, Clips und Sendeplan auf viele Plattformen.",
    solution: "Die Bausteine als WordPress-Website-Kit gebündelt.",
    deliverable: "Website-Kit mit Demo, kostenlosem Einstieg und Erweiterungen.",
  },
  {
    slug: "klavierbau-milde",
    client: "Klavierbau Hans Milde",
    scope: "Webdesign & Local SEO",
    problem: "Ein Klavierbauer mit Empfehlungskundschaft war online kaum zu finden.",
    solution: "Reduziertes Design und eine lokale SEO-Struktur.",
    deliverable: "Website mit Leistungen, regionalen Informationen und Kontaktwegen.",
  },
  {
    slug: "patricks-fahrschule",
    client: "Patricks Fahrschule",
    scope: "Local SEO & Mehrsprachigkeit",
    problem: "Interessenten suchen nach einem konkreten Standort.",
    solution: "Eigene Informationen je echter Filiale, dazu Inhalte auf Rumänisch.",
    deliverable: "Standortseiten mit Anschrift, Zeiten und Anmeldung.",
  },
  {
    slug: "cleo-coaching",
    client: "CLEO Coaching",
    scope: "SEO & Workshop-Landingpage",
    problem: "Die bestehende Website wurde in der Suche kaum gefunden.",
    solution: "Feintuning an Struktur, Inhalten, Meta-Daten und Verlinkung.",
    deliverable: "Optimierte Website und eine neue Landingpage für Workshops.",
  },
  {
    slug: "lorenz-logistik",
    client: "Lorenz Logistik",
    scope: "Landingpage & Conversion",
    problem: "Eine Neugründung ohne bekannte Marke braucht trotzdem Anfragen.",
    solution: "Die Anfrage sitzt direkt im ersten Bildschirm.",
    deliverable: "Landingpage für Umzüge und Transporte mit Schnellanfrage.",
  },
];

const shotsEn: Shot[] = [
  {
    ...shotsDe[0],
    scope: "Website & emergency guidance",
    problem: "People who find an injured squirrel need a phone number and clear steps, fast.",
    solution: "Emergency contact as the first entry point, first aid in four steps.",
    deliverable: "Astro website with an emergency page, animal stories and ways to donate.",
  },
  {
    ...shotsDe[1],
    scope: "Animal-welfare platform & product development",
    problem: "Volunteer teams kept their website, animals and enquiries in separate places.",
    solution: "Club website and admin in one platform that also works on a phone.",
    deliverable: "Live product with animal profiles, an inbox and adoption contracts.",
  },
  {
    ...shotsDe[2],
    scope: "WordPress portal & content architecture",
    problem: "A former GTA roleplay server wanted to become a portal for two audiences.",
    solution: "Separate entry points for players and server operators.",
    deliverable: "WordPress portal with a FiveM server list, guides and resources.",
  },
  {
    ...shotsDe[3],
    scope: "Creator product & WordPress",
    problem: "Streamers spread their stream, clips and schedule across many platforms.",
    solution: "The building blocks packaged as a WordPress website kit.",
    deliverable: "Website kit with a demo, a free tier and add-on packages.",
  },
  {
    ...shotsDe[4],
    scope: "Web design & local SEO",
    problem: "A piano maker who lived on referrals was hard to find online.",
    solution: "A restrained design and a local SEO structure.",
    deliverable: "Website with services, regional information and clear contact options.",
  },
  {
    ...shotsDe[5],
    scope: "Local SEO & multilingual content",
    problem: "Prospective students search for one specific branch.",
    solution: "Separate information for each real branch, plus content in Romanian.",
    deliverable: "Branch pages with address, opening hours and sign-up.",
  },
  {
    ...shotsDe[6],
    scope: "SEO & workshop landing page",
    problem: "The existing website barely showed up in search.",
    solution: "Fine-tuning of structure, content, metadata and internal links.",
    deliverable: "Optimised website and a new landing page for workshops.",
  },
  {
    ...shotsDe[7],
    scope: "Landing page & conversion",
    problem: "A new business without a known brand still needs enquiries.",
    solution: "The enquiry form sits right in the first screen.",
    deliverable: "Landing page for removals and transport with a quick enquiry.",
  },
];

const contactDe = routeFor("contact", "de");
const contactEn = routeFor("contact", "en");

const de: HomeContent = {
  hero: {
    label: "WordPress & KI-Entwicklung · Rastatt",
    title: "Vom ersten Klick",
    quiet: "zur Anfrage.",
    lede: "Ich entwickle Websites, die Kunden zum richtigen Angebot führen, und KI-Abläufe, die Ihrem Team Arbeit abnehmen.",
    primary: { label: "Mein Vorhaben besprechen", href: "#vorhaben" },
    secondary: { label: "Projekt ansehen", href: "#arbeit" },
  },
  services: {
    label: "Leistungen",
    title: "Vier Leistungen,",
    quiet: "ein Ansprechpartner.",
    sub: "Das Werkzeug folgt der Aufgabe: WordPress, wo Ihr Team Inhalte selbst pflegt. Astro oder eigener Code, wo Tempo und Kontrolle zählen.",
    items: [
      {
        title: "WordPress",
        outcome: "Websites, die Ihr Team ohne Entwickler pflegt und die trotzdem schnell bleiben.",
        keywords: ["Eigene Themes", "Gutenberg-Blöcke", "Migration"],
        href: routeFor("wordpress", "de"),
      },
      {
        title: "KI-Automatisierung",
        outcome: "Wiederkehrende Abläufe, die ein System vorbereitet und ein Mensch freigibt.",
        keywords: ["Formulare zu Tickets", "Entwürfe mit KI", "Freigabe-Schritte"],
        href: routeFor("ai", "de"),
      },
      {
        title: "Webentwicklung",
        outcome: "Websites und Web-Anwendungen nach Maß, wenn ein Baukasten nicht mehr reicht.",
        keywords: ["Astro & TypeScript", "Schnittstellen", "Web-Apps"],
        href: routeFor("development", "de"),
      },
      {
        title: "Optimierung & Wartung",
        outcome:
          "Bestehende Websites, die schneller laden, besser gefunden werden und sicher laufen.",
        keywords: ["Local SEO Rastatt", "Ladezeit", "Updates"],
        href: routeFor("seo", "de"),
      },
    ],
    packages: {
      label: "Website-Pakete zum Festpreis",
      title: "Für Praxen, Handwerk und Fahrschulen:",
      quiet: "feste Leistung, fester Monatspreis.",
      all: { label: "Pakete vergleichen", href: routeFor("services", "de") },
      items: [
        {
          name: "docweb",
          audience: "Arztpraxen",
          price: `${DOCWEB.setupPrice} + ${DOCWEB.monthlyPrice}/Monat`,
          href: routeFor("doctors", "de"),
        },
        {
          name: "handwerkweb",
          audience: "Handwerk",
          price: `${HANDWERKWEB.setupPrice} + ${HANDWERKWEB.monthlyPrice}/Monat`,
          href: routeFor("craftsmen", "de"),
        },
        {
          name: "fahrschulweb",
          audience: "Fahrschulen",
          price: `${FAHRSCHULWEB.setupPrice} + ${FAHRSCHULWEB.monthlyPrice}/Monat`,
          href: routeFor("drivingSchools", "de"),
        },
      ],
    },
  },
  showcase: {
    label: "KI in der Praxis",
    title: "Aus dem Briefing wird ein Entwurf.",
    quiet: "Veröffentlicht wird erst nach Ihrer Freigabe.",
    body: [
      "Probieren Sie es aus: Aus ein paar Stichpunkten entsteht ein gegliederter WordPress-Entwurf mit Titel, Meta-Beschreibung und Fragen zur Prüfung.",
      "So setzen wir KI ein: als Vorarbeit in festen Schritten, mit einem Menschen am Ende.",
    ],
    evidence:
      "Im eigenen Betrieb: Änderungswünsche aus dem Kundenformular werden zu Tickets. Den Stand sehen Kunden auf einer eigenen Statusseite.",
  },
  proof: {
    label: "Arbeiten",
    title: "Ausgewählte Projekte",
    quiet: "und was dabei herauskam.",
    all: { label: "Alle Projekte", href: routeFor("cases", "de") },
    steps: ["Ausgangslage", "Lösung", "Ergebnis"],
    shots: shotsDe,
  },
  why: {
    label: "Warum lk media",
    title: "Was Sie bekommen",
    quiet: "und woran Sie es prüfen können.",
    items: [
      {
        title: "Saubere Technik",
        body: "Typisierter Code und automatische Tests, auch für diese Website. Die Tests prüfen Formulare, Weiterleitungen und Barrierefreiheit.",
      },
      {
        title: "Technische Tiefe",
        body: "Von WordPress bis zur eigenen Anwendung: Die Website-Pakete hier laufen mit Stripe-Bestellung und Auftragsverwaltung über GitHub.",
      },
      {
        title: "Performance",
        body: "Diese Seite wird statisch ausgeliefert und kommt ohne Cookie-Banner aus, weil die Besucheranalyse selbst gehostet und cookiefrei läuft.",
      },
      {
        title: "Wartbarkeit",
        body: "Inhalte getrennt vom Code, jede Änderung versioniert in Git. Ihre Website bleibt auch in Jahren nachvollziehbar.",
      },
      {
        title: "KI mit Augenmaß",
        body: "KI bereitet vor, ein Mensch gibt frei. Im eigenen Kundenprozess entsteht aus jedem Änderungswunsch ein Ticket mit sichtbarem Status.",
      },
      {
        title: "Persönliche Zusammenarbeit",
        body: `Ein Ansprechpartner vom ersten Gespräch bis zum Launch: Lucas Kleipoedszus, erreichbar unter ${EMAIL}.`,
      },
    ],
    metrics: ["Jahre Websites aus Rastatt", "veröffentlichte Projekte", "Fachartikel im Blog"],
  },
  process: {
    title: "So läuft ein Projekt",
    sub: "Vier Schritte, feste Freigaben, ein Ansprechpartner.",
    steps: [
      {
        n: "01",
        title: "Verstehen",
        body: "15 Minuten Gespräch, dann Ziele, Umfang und ein Angebot zum Festpreis.",
      },
      {
        n: "02",
        title: "Entwerfen",
        body: "Struktur, Texte und Gestaltung als Prototyp, den Sie freigeben.",
      },
      {
        n: "03",
        title: "Bauen",
        body: "WordPress, Astro oder eigener Code, je nach Aufgabe. Sie prüfen jeden Zwischenstand.",
      },
      {
        n: "04",
        title: "Launch & Weiterentwickeln",
        body: "Livegang, Messung und Verbesserungen auf Basis echter Daten.",
      },
    ],
  },
  journal: {
    label: "Insights",
    title: "Neu im Blog.",
    quiet: "Webdesign, SEO und Marketing aus der Praxis.",
    all: { label: "Alle Artikel", href: routeFor("blog", "de") },
  },
  about: {
    label: "Wer dahintersteht",
    title: "Lucas Kleipoedszus,",
    quiet: "Rastatt.",
    lead: "Ich plane, gestalte und entwickle jedes Projekt selbst. Vom ersten Gespräch bis zum Launch sprechen Sie mit derselben Person.",
    body: "Seit 2015 baue ich Websites für Unternehmen in Rastatt, Mittelbaden und der Südpfalz, vor Ort oder remote.",
    facts: [
      { label: "Standort", value: "Rastatt" },
      { label: "Region", value: "Mittelbaden & Südpfalz" },
    ],
    link: { label: "Mehr über Lucas", href: routeFor("about", "de") },
    photoAlt:
      "Lucas Kleipoedszus lächelt am Schreibtisch, im Hintergrund ein zweiter Bildschirm mit Code",
  },
  cta: {
    label: "Kontakt",
    title: "Erzählen Sie von Ihrem Projekt.",
    quiet: "Sie bekommen eine ehrliche Einschätzung.",
    sub: "Ein paar Sätze genügen: was Sie vorhaben, bis wann und was es schon gibt.",
    promises: [
      "Antwort innerhalb eines Werktags",
      "Kostenloses 15-Minuten-Gespräch",
      "Angebot zum Festpreis",
      "Start erst nach Ihrer schriftlichen Freigabe",
    ],
    primary: { label: "Projekt starten", href: `${contactDe}#anfrage` },
    secondary: { label: "15-Minuten-Call buchen", href: `${contactDe}#termin` },
    email: EMAIL,
  },
};

const en: HomeContent = {
  hero: {
    label: "WordPress & AI development · Rastatt, Germany",
    title: "From the first click",
    quiet: "to an enquiry.",
    lede: "I build websites that guide customers to the right offer and AI workflows that take repetitive work off your team’s hands.",
    primary: { label: "Discuss my project", href: "#vorhaben" },
    secondary: { label: "See the project", href: "#arbeit" },
  },
  services: {
    label: "Services",
    title: "Four services,",
    quiet: "one contact person.",
    sub: "The tool follows the job: WordPress where your team edits content itself. Astro or custom code where speed and control matter.",
    items: [
      {
        title: "WordPress",
        outcome: "Websites your team can run without a developer, and that stay fast.",
        keywords: ["Custom themes", "Gutenberg blocks", "Migration"],
        href: routeFor("wordpress", "en"),
      },
      {
        title: "AI automation",
        outcome: "Repetitive workflows that a system prepares and a person approves.",
        keywords: ["Forms to tickets", "AI drafts", "Approval steps"],
        href: routeFor("ai", "en"),
      },
      {
        title: "Web development",
        outcome: "Custom websites and web apps for when a site builder no longer fits.",
        keywords: ["Astro & TypeScript", "APIs", "Web apps"],
        href: routeFor("development", "en"),
      },
      {
        title: "Care & optimisation",
        outcome: "Your existing WordPress site, kept fast, up to date and secure.",
        keywords: ["Updates", "Load time", "Security"],
        href: routeFor("wordpress", "en"),
      },
    ],
  },
  showcase: {
    label: "AI in practice",
    title: "A brief becomes a draft.",
    quiet: "Nothing goes live until you approve it.",
    body: [
      "Try it: a few bullet points turn into a structured WordPress draft with a title, a meta description and questions for review.",
      "That is how we use AI: as groundwork in fixed steps, with a person at the end.",
    ],
    evidence:
      "In our own business: change requests from the client form become tickets, and clients follow their status on a dedicated page.",
  },
  proof: {
    label: "Work",
    title: "Selected projects",
    quiet: "and what they delivered.",
    all: { label: "All projects (in German)", href: routeFor("cases", "en") },
    langNote: "(in German)",
    steps: ["Problem", "Solution", "Delivered"],
    shots: shotsEn,
  },
  why: {
    label: "Why lk media",
    title: "What you get",
    quiet: "and how you can check it.",
    items: [
      {
        title: "Engineering quality",
        body: "Typed code and automated tests, including for this website: they check forms, redirects and accessibility.",
      },
      {
        title: "Technical depth",
        body: "From WordPress to custom applications: the website packages on this site run on Stripe checkout and GitHub-based order handling.",
      },
      {
        title: "Performance",
        body: "This site is served as static pages and needs no cookie banner, because visitor analytics are self-hosted and cookieless.",
      },
      {
        title: "Maintainability",
        body: "Content kept apart from code, every change versioned in Git. Your website stays understandable years from now.",
      },
      {
        title: "Practical AI",
        body: "AI prepares, a person approves. In our own client process every change request becomes a ticket with a visible status.",
      },
      {
        title: "Personal collaboration",
        body: `One contact person from the first call to launch: Lucas Kleipoedszus, at ${EMAIL}.`,
      },
    ],
    metrics: ["years building websites", "published case studies", "articles (in German)"],
  },
  process: {
    title: "How a project runs",
    sub: "Four steps, clear approvals, one contact person.",
    steps: [
      {
        n: "01",
        title: "Discover",
        body: "A 15-minute call, then goals, scope and a fixed-price quote.",
      },
      {
        n: "02",
        title: "Design",
        body: "Structure, copy and design as a prototype for you to approve.",
      },
      {
        n: "03",
        title: "Build",
        body: "WordPress, Astro or custom code, depending on the job. You review every stage.",
      },
      {
        n: "04",
        title: "Launch & improve",
        body: "Go live, measure, and improve based on real data.",
      },
    ],
  },
  about: {
    label: "Who is behind it",
    title: "Lucas Kleipoedszus,",
    quiet: "Rastatt, Germany.",
    lead: "I plan, design and build every project myself. From the first call to launch you talk to the same person.",
    body: "Building websites since 2015 for businesses in and around Rastatt, on site or remotely.",
    facts: [
      { label: "Based in", value: "Rastatt, Germany" },
      { label: "Languages", value: "German, English" },
    ],
    link: { label: "About Lucas (in German)", href: routeFor("about", "en"), hreflang: "de" },
    photoAlt: "Lucas Kleipoedszus smiling at his desk, a second screen with code behind him",
  },
  cta: {
    label: "Contact",
    title: "Tell us about your project.",
    quiet: "You get an honest assessment.",
    sub: "A few sentences are enough: what you have in mind, by when, and what already exists.",
    promises: [
      "Reply within one business day",
      "Free 15-minute call",
      "Fixed-price quote",
      "Work starts only after your written approval",
    ],
    primary: { label: "Start a project", href: `${contactEn}#anfrage` },
    secondary: { label: "Book a 15-min call", href: `${contactEn}#termin` },
    email: EMAIL,
  },
};

export const homeContent: Record<Lang, HomeContent> = { de, en };
