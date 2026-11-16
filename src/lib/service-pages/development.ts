import { type Lang, routeFor } from "../i18n";
import type { ServicePage } from "./types";

export const development: Record<Lang, ServicePage> = {
  de: {
    route: "development",
    service: "development",
    seo: {
      title: "Webentwicklung: Websites & Web-Anwendungen nach Maß",
      description:
        "Schnelle Websites mit Astro, Web-Anwendungen, API-Integrationen und Stripe-Zahlungen. Entwickelt in Rastatt, individuelle Projekte ab 25.000 €.",
    },
    hero: {
      label: "Webentwicklung",
      title: ["Webentwicklung", "für Websites und Web-Anwendungen nach Maß"],
      lede: "Wir entwickeln schnelle Websites, Web-Anwendungen und Schnittstellen zu den Systemen, mit denen Sie arbeiten. Das Werkzeug richtet sich nach der Aufgabe: Astro für schnelle Seiten, WordPress, wo Ihr Team selbst pflegt, eigener Code, wo Abläufe es verlangen.",
      primary: "Projekt besprechen",
      secondary: { label: "Arbeiten ansehen", href: routeFor("cases", "de") },
      facts: [
        { label: "Seit", value: "2015 Websites gebaut" },
        { label: "Projekte", value: "Individuell ab 25.000 €" },
        { label: "Technik", value: "Astro, TypeScript, WordPress, Stripe" },
        { label: "Kontakt", value: "Ein Ansprechpartner bis zum Launch" },
      ],
    },
    problem: {
      title: "Wann eine Website nach Maß nötig wird",
      intro:
        "Ein Baukasten oder ein Standard-Theme reicht, bis die Website mehr können muss als Inhalte zeigen.",
      points: [
        {
          title: "Langsame Seiten",
          body: "Viele Plugins, schwere Themes und Skripte von Drittanbietern bremsen die Seite, vor allem auf dem Smartphone.",
        },
        {
          title: "Getrennte Systeme",
          body: "Formulare, Zahlungen, Kalender und CRM laufen nebeneinander her. Daten werden von Hand übertragen.",
        },
        {
          title: "Abläufe ohne passende Software",
          body: "Für einen Prozess Ihres Geschäfts gibt es keine fertige Lösung, oder die fertige Lösung passt nur halb.",
        },
        {
          title: "Unklarer Bestand",
          body: "Niemand weiß mehr genau, wie die bestehende Website gebaut ist. Jede Änderung wird zum Risiko.",
        },
      ],
    },
    solution: {
      title: "Statisch, wo es geht. Server-Logik, wo sie nötig ist.",
      intro:
        "Seiten werden vorab erzeugt und schnell ausgeliefert. Formulare, Zahlungen und Kundenbereiche laufen auf dem Server und prüfen jede Eingabe. Inhalte, die Ihr Team selbst pflegen soll, bekommen ein passendes System, bei Bedarf WordPress. Vor dem Launch messen wir Ladezeit und Barrierefreiheit.",
    },
    deliverables: {
      title: "Was wir entwickeln",
      items: [
        {
          title: "Moderne Websites",
          body: "Statisch erzeugte Seiten mit Astro: kurze Ladezeiten, wenig JavaScript, eine saubere Struktur für Suchmaschinen.",
        },
        {
          title: "Web-Anwendungen",
          body: "Eigene Anwendungen für Prozesse ohne passende Standardsoftware, mit Verwaltung, Rollen und Datenhaltung.",
        },
        {
          title: "API-Integrationen",
          body: "Anbindung an CRM, Newsletter, Kalender oder Warenwirtschaft, damit Daten nicht doppelt gepflegt werden.",
        },
        {
          title: "Zahlungen mit Stripe",
          body: "Bezahlung über Stripe, Prüfung der Zahlung auf dem Server und Zugang zum Stripe-Kundenportal für Rechnungen und Zahlungsarten.",
        },
        {
          title: "Onboarding-Strecken",
          body: "Mehrstufige Formulare mit Zwischenspeichern im Browser, Datei-Uploads mit Typprüfung und Bestätigung per E-Mail.",
        },
        {
          title: "Kundenbereiche",
          body: "Statusseiten, Aufträge und Rückfragen für Ihre Kundschaft, auch ohne Passwort über einen persönlichen Link.",
        },
        {
          title: "Performance und Barrierefreiheit",
          body: "Core Web Vitals im Blick, automatisierte Tests im Browser und eine Prüfung nach WCAG 2.2 AA vor dem Launch.",
        },
      ],
    },
    useCases: {
      title: "Typische Vorhaben",
      intro: "Projekte, bei denen Entwicklung mehr ist als Gestaltung.",
      items: [
        {
          title: "Relaunch auf schneller Technik",
          body: "Bestehende Inhalte ziehen in eine schnellere, wartbare Website um. Alte Adressen werden sauber weitergeleitet.",
        },
        {
          title: "Produkt mit Online-Bestellung",
          body: "Paket wählen, per Stripe bezahlen, Daten im Onboarding erfassen. Der Auftrag wird automatisch angelegt.",
        },
        {
          title: "Plattform für eine Zielgruppe",
          body: "Öffentliche Website und Verwaltung in einem System, wie bei Pfotenweb für Tierschutzvereine.",
        },
        {
          title: "Kundenportal",
          body: "Ihre Kundschaft sieht den Stand ihrer Aufträge, beantwortet Rückfragen und lädt Dateien hoch.",
        },
        {
          title: "Formular-Dienst für mehrere Websites",
          body: "Ein zentraler Dienst nimmt Formulare mehrerer Websites an, prüft Herkunft und Spam und stellt per E-Mail zu.",
        },
      ],
    },
    process: {
      title: "In vier Schritten zum Launch",
      steps: [
        {
          title: "Verstehen",
          body: "Ziele, Zielgruppe, vorhandene Systeme und Inhalte. Bei bestehenden Projekten sehen wir uns zuerst den Code an.",
        },
        {
          title: "Entwerfen",
          body: "Seitenstruktur, Datenmodell und Schnittstellen werden festgelegt, bevor die erste Zeile Code entsteht.",
        },
        {
          title: "Bauen",
          body: "Entwicklung in überprüfbaren Etappen mit Vorschau-Link. Sie sehen den Stand, bevor er live geht.",
        },
        {
          title: "Launch & Weiterentwickeln",
          body: "Livegang mit Weiterleitungen, Messung und Tests. Danach entwickeln wir weiter, was Ihr Geschäft braucht.",
        },
      ],
    },
    pricing: {
      title: "Individuelle Projekte ab 25.000 €",
      body: "Individuelle Website-Projekte beginnen bei 25.000 €. Für Web-Anwendungen und Integrationen erstellen wir ein Festpreis-Angebot nach Umfang. Für Praxen, Handwerksbetriebe und Fahrschulen gibt es fertige Website-Pakete mit festen Preisen auf unserer Leistungsseite.",
      points: [
        "Kostenloses Erstgespräch, 15 Minuten",
        "Ziel und Umfang schriftlich festhalten",
        "Festpreis-Angebot mit Meilensteinen",
        "Arbeitsbeginn erst nach Ihrer schriftlichen Freigabe",
      ],
    },
    proof: {
      title: "Projekte, die das zeigen",
      intro:
        "Eine eigene Plattform, eine individuelle Website und unsere Produktseiten mit Bezahlung und Onboarding.",
      items: [
        {
          client: "Pfotenweb",
          body: "Eigenständige Plattform für Tierschutzvereine: Vereinswebsite, Tierprofile mit Vermittlungsstatus, Postfach für Anfragen und Schutzverträge. Mobil nutzbar, mit kostenlosem Einstieg.",
          href: "/cases/pfotenweb",
          hrefLang: "de",
        },
        {
          client: "Eichhörnchen Berger",
          body: "Website mit Astro und Tailwind CSS für eine ehrenamtliche Auffangstation: Notfallkontakt auf jeder Seite, antippbare Telefonnummern, Tiergeschichten mit Status.",
          href: "/cases/eichhoernchenberger",
          hrefLang: "de",
        },
        {
          client: "docweb, handwerkweb, fahrschulweb",
          body: "Eigene Website-Pakete mit Bezahlung über Stripe, Zahlungsprüfung auf dem Server, Onboarding mit Bild-Upload und einer Statusseite für Änderungsaufträge.",
          href: routeFor("doctors", "de"),
          hrefLang: "de",
        },
      ],
    },
    faq: {
      title: "Häufige Fragen zur Webentwicklung",
      items: [
        {
          q: "Astro oder WordPress?",
          a: "Das entscheidet die Aufgabe. Astro eignet sich für schnelle Websites, deren Inhalte selten wechseln oder über Code gepflegt werden. WordPress passt, wenn Ihr Team regelmäßig selbst Inhalte pflegt oder viele fertige Erweiterungen braucht. Mehr dazu auf unserer Seite zur WordPress-Entwicklung.",
        },
        {
          q: "Was kostet eine individuelle Website?",
          a: "Individuelle Website-Projekte beginnen bei 25.000 €. Den genauen Preis nennen wir als Festpreis, sobald der Umfang geklärt ist.",
        },
        {
          q: "Können Sie unsere bestehende Software anbinden?",
          a: "Wenn sie eine Schnittstelle (API), Webhooks oder einen Import bietet, in der Regel ja. Das prüfen wir, bevor Sie ein Angebot bekommen.",
        },
        {
          q: "Übernehmen Sie bestehende Projekte?",
          a: "Wir sehen uns den vorhandenen Code zuerst an und sagen Ihnen dann, ob Weiterbauen oder ein Neubau sinnvoller ist.",
        },
        {
          q: "Wie lange dauert ein Projekt?",
          a: "Das hängt vom Umfang ab. Im Angebot steht ein Zeitplan mit Meilensteinen, den wir vor Arbeitsbeginn gemeinsam festlegen.",
        },
        {
          q: "Wer betreut die Website nach dem Launch?",
          a: "Ihr Ansprechpartner bleibt derselbe. Wartung und Weiterentwicklung vereinbaren wir nach Bedarf im Angebot.",
        },
      ],
    },
    cta: {
      title: "Erzählen Sie uns von Ihrem Vorhaben",
      body: "Ein paar Sätze reichen: was die Website oder Anwendung können soll und welche Systeme schon im Einsatz sind.",
      formTitle: "Projekt anfragen",
      next: [
        "Antwort von Lucas persönlich per E-Mail",
        "Kostenloses 15-Minuten-Gespräch zu Ihrem Vorhaben",
        "Festpreis-Angebot mit Meilensteinen",
        "Start nach Ihrer schriftlichen Freigabe",
      ],
    },
  },
  en: {
    route: "development",
    service: "development",
    seo: {
      title: "Custom web development: websites & web applications",
      description:
        "Fast Astro websites, custom web applications, API integrations and Stripe payments, built by a studio in Germany. Custom projects from €25,000.",
    },
    hero: {
      label: "Web Development",
      title: ["Custom web development", "for websites and web applications"],
      lede: "We build fast websites, web applications and integrations with the systems you already use. The job decides the tool: Astro for fast sites, WordPress where your team edits content, custom code where your processes need it.",
      primary: "Discuss your project",
      secondary: { label: "See the proof", href: "#sd-proof" },
      facts: [
        { label: "Since", value: "Building websites since 2015" },
        { label: "Projects", value: "Custom work from €25,000" },
        { label: "Stack", value: "Astro, TypeScript, WordPress, Stripe" },
        { label: "Contact", value: "One person from first call to launch" },
      ],
    },
    problem: {
      title: "When off-the-shelf stops working",
      intro:
        "A site builder or a stock theme is fine until your website has to do more than show content.",
      points: [
        {
          title: "Slow pages",
          body: "Stacks of plugins, heavy themes and third-party scripts slow the site down, especially on phones.",
        },
        {
          title: "Disconnected systems",
          body: "Forms, payments, calendar and CRM each live on their own. Someone moves the data by hand.",
        },
        {
          title: "No software that fits",
          body: "There is no ready-made tool for one of your processes, or the one you have only half fits.",
        },
        {
          title: "A codebase nobody knows",
          body: "Nobody remembers how the current site was built. Every change feels risky.",
        },
      ],
    },
    solution: {
      title: "Static where possible. Server logic where needed.",
      intro:
        "Pages are generated ahead of time and served fast. Forms, payments and customer areas run on the server and validate every input. Content your team needs to edit gets a suitable system, WordPress if that fits. Before launch we measure load times and accessibility.",
    },
    deliverables: {
      title: "What we build",
      items: [
        {
          title: "Modern websites",
          body: "Statically generated sites with Astro: fast loading, little JavaScript, a clean structure for search engines.",
        },
        {
          title: "Web applications",
          body: "Custom applications for processes without suitable off-the-shelf software, with admin, roles and data storage.",
        },
        {
          title: "API integrations",
          body: "Connections to your CRM, newsletter, calendar or inventory system, so nobody maintains the same data twice.",
        },
        {
          title: "Stripe payments",
          body: "Checkout via Stripe, payment verification on the server and access to the Stripe customer portal for invoices and payment methods.",
        },
        {
          title: "Onboarding flows",
          body: "Multi-step forms that save progress in the browser, file uploads with type checks, and email confirmation.",
        },
        {
          title: "Customer portals",
          body: "Status pages, orders and follow-up questions for your customers, even without a password via a personal link.",
        },
        {
          title: "Performance and accessibility",
          body: "Core Web Vitals in view, automated browser tests and a WCAG 2.2 AA check before launch.",
        },
      ],
    },
    useCases: {
      title: "Typical projects",
      intro: "Work where development matters as much as design.",
      items: [
        {
          title: "Relaunch on faster technology",
          body: "Your existing content moves to a faster, maintainable site. Old URLs redirect properly.",
        },
        {
          title: "A product sold online",
          body: "Pick a package, pay with Stripe, fill in the onboarding. The order is created automatically.",
        },
        {
          title: "A platform for one audience",
          body: "Public website and admin in one system, like Pfotenweb for animal-welfare groups.",
        },
        {
          title: "Customer portal",
          body: "Your customers see where their orders stand, answer follow-up questions and upload files.",
        },
        {
          title: "One form service for many sites",
          body: "A central service accepts forms from several websites, checks origin and spam, and delivers by email.",
        },
      ],
    },
    process: {
      title: "Four steps to launch",
      steps: [
        {
          title: "Discover",
          body: "Goals, audience, existing systems and content. For existing projects, we read the code first.",
        },
        {
          title: "Design",
          body: "Page structure, data model and integrations are settled before the first line of code.",
        },
        {
          title: "Build",
          body: "Development in reviewable stages with a preview link. You see each stage before it goes live.",
        },
        {
          title: "Launch & Improve",
          body: "Go-live with redirects, measurement and tests. After that we keep building what your business needs.",
        },
      ],
    },
    pricing: {
      title: "Custom projects from €25,000",
      body: "Custom website projects start at €25,000. For web applications and integrations we quote a fixed price based on scope. For medical practices, trades and driving schools in Germany there are website packages with set prices on our services page (in German).",
      points: [
        "Free 15-minute intro call",
        "Goals and scope agreed in writing",
        "Fixed-price quote with milestones",
        "Work starts only after your written approval",
      ],
    },
    proof: {
      title: "Work that shows it",
      intro:
        "A platform of our own, a custom website, and our product sites with payment and onboarding.",
      items: [
        {
          client: "Pfotenweb",
          body: "A standalone platform for animal-welfare groups: club website, animal profiles with adoption status, an inquiry inbox and contracts. Works on mobile, free to start.",
          href: "/cases/pfotenweb",
          hrefLang: "de",
        },
        {
          client: "Eichhörnchen Berger",
          body: "An Astro and Tailwind CSS website for a volunteer squirrel rescue: emergency contact on every page, tap-to-call numbers, animal stories with status.",
          href: "/cases/eichhoernchenberger",
          hrefLang: "de",
        },
        {
          client: "docweb, handwerkweb, fahrschulweb",
          body: "Our own website packages with Stripe checkout, server-side payment checks, onboarding with image upload and a status page for change requests.",
          href: routeFor("doctors", "de"),
          hrefLang: "de",
        },
      ],
    },
    faq: {
      title: "Questions about web development",
      items: [
        {
          q: "Astro or WordPress?",
          a: "The job decides. Astro suits fast websites whose content changes rarely or is managed in code. WordPress fits when your team edits content regularly or needs a wide range of ready-made extensions. Our WordPress development page goes into more detail.",
        },
        {
          q: "What does a custom website cost?",
          a: "Custom website projects start at €25,000. You get a fixed price once the scope is clear.",
        },
        {
          q: "Can you connect our existing software?",
          a: "If it offers an API, webhooks or an import, usually yes. We check this before you get a quote.",
        },
        {
          q: "Do you take over existing projects?",
          a: "We review the existing code first and then tell you whether building on it or starting fresh makes more sense.",
        },
        {
          q: "How long does a project take?",
          a: "It depends on scope. The quote includes a schedule with milestones that we agree on before work starts.",
        },
        {
          q: "Who looks after the site after launch?",
          a: "The same person you worked with. Maintenance and further development are agreed in the quote as needed.",
        },
      ],
    },
    cta: {
      title: "Tell us about your project",
      body: "A few sentences are enough: what the website or application should do and which systems you already use.",
      formTitle: "Project inquiry",
      next: [
        "A personal reply from Lucas by email",
        "A free 15-minute call about your project",
        "A fixed-price quote with milestones",
        "Work starts after your written approval",
      ],
    },
  },
};
