import { type Lang, routeFor } from "../i18n";
import type { ServicePage } from "./types";

const stack = "WordPress, WooCommerce, PHP, REST API";

export const wordpress: Record<Lang, ServicePage> = {
  de: {
    route: "wordpress",
    service: "wordpress",
    seo: {
      title: "WordPress Agentur Rastatt: Entwicklung & Wartung",
      description:
        "WordPress-Entwicklung aus Rastatt: eigene Themes, WooCommerce, Plugins, Performance, Wartung, Migrationen und Schnittstellen. Festpreis nach Erstgespräch.",
    },
    hero: {
      label: "WordPress",
      title: ["WordPress, sauber gebaut.", "Und danach gepflegt."],
      lede: "Wir entwickeln WordPress-Websites, Shops und Plugins ohne Page-Builder-Ballast, übernehmen bestehende Installationen und halten sie schnell, sicher und aktuell. Vom Erstgespräch bis zum Launch haben Sie einen Ansprechpartner.",
      primary: "Projekt besprechen",
      secondary: { label: "Arbeiten ansehen", href: routeFor("cases", "de") },
      facts: [
        { label: "Standort", value: "Rastatt, Projekte auch remote" },
        { label: "Kontakt", value: "Lucas Kleipoedszus" },
        { label: "Stack", value: stack },
        { label: "Erfahrung", value: "Websites seit 2015" },
        { label: "Angebot", value: "Festpreis nach Erstgespräch" },
      ],
    },
    problem: {
      title: "Wenn jede Änderung an WordPress zum Risiko wird.",
      intro:
        "WordPress ist flexibel. Ohne klare Struktur sammeln sich über die Jahre Plugins, Page-Builder-Layouts und offene Updates an, bis sich niemand mehr an die Website traut.",
      points: [
        {
          title: "Langsame Seiten",
          body: "Page-Builder und Plugin-Stapel laden Code, den kaum eine Seite braucht. Das kostet Ladezeit und verschlechtert die Core Web Vitals.",
        },
        {
          title: "Updates, die niemand einspielt",
          body: "Veraltete Plugins und Themes sind ein häufiger Angriffsweg. Ohne aktuelles Backup bleibt das Update liegen.",
        },
        {
          title: "Neue Funktionen nur über Umwege",
          body: "Ein zusätzliches Feld, eine Schnittstelle oder ein angepasster Bestellablauf endet im Workaround, weil der Aufbau nicht dafür gedacht war.",
        },
        {
          title: "Niemand kennt den Stand",
          body: "Die frühere Agentur ist nicht mehr erreichbar, eine Dokumentation fehlt. Unklar ist, was installiert ist und warum.",
        },
      ],
    },
    solution: {
      title: "Klarer Code, wenige Abhängigkeiten, ein Ansprechpartner.",
      intro:
        "Wir bauen Themes und Blöcke passend zu Ihren Inhalten, setzen Plugins gezielt ein und dokumentieren, was installiert ist. Ihr Team pflegt Inhalte im Block-Editor, ohne das Layout zu zerlegen. Bestehende Websites prüfen wir zuerst und entscheiden mit Ihnen, ob Aufräumen oder Neuaufbau sinnvoller ist.",
    },
    deliverables: {
      title: "Was wir für Ihre WordPress-Website übernehmen",
      items: [
        {
          title: "Eigene Themes und Blöcke",
          body: "Ein Theme mit Gutenberg-Blöcken für Ihre Inhalte. Ohne Page-Builder, mit sauberem Markup und schlankem Frontend.",
        },
        {
          title: "WooCommerce",
          body: "Shops mit Produktstruktur, Versand- und Steuerregeln, Zahlungsanbietern und angepassten Abläufen im Checkout.",
        },
        {
          title: "Plugin-Entwicklung",
          body: "Eigene Plugins für Funktionen, die es nicht fertig gibt, oder als schlanker Ersatz für ein überladenes Plugin.",
        },
        {
          title: "Performance und Core Web Vitals",
          body: "Messen, Ursachen finden, beheben: Bilder, Skripte, Caching, Datenbank und Server-Konfiguration.",
        },
        {
          title: "Sicherheit und Wartung",
          body: "Updates mit Backup vorher und Prüfung danach, Uptime-Monitoring und Reaktion, wenn etwas ausfällt.",
        },
        {
          title: "Migrationen",
          body: "Hosting-Umzug, Wechsel vom Page-Builder zum eigenen Theme oder von einem anderen CMS zu WordPress. Bestehende URLs leiten wir weiter.",
        },
        {
          title: "Schnittstellen",
          body: "Anbindung an CRM, Buchungssystem, Zahlungsanbieter oder ERP über REST API und Webhooks.",
        },
        {
          title: "KI in WordPress",
          body: "KI-Funktionen dort, wo sie Arbeit abnehmen, etwa Entwürfe oder Zusammenfassungen für Ihre Redaktion. Veröffentlicht wird erst nach menschlicher Prüfung.",
        },
      ],
    },
    useCases: {
      title: "Typische Ausgangslagen",
      intro: "So beginnen die meisten WordPress-Projekte bei uns.",
      items: [
        {
          title: "Page-Builder-Website ablösen",
          body: "Die Seite ist langsam und mühsam zu pflegen. Wir übertragen die Inhalte in ein eigenes Theme und leiten bestehende URLs weiter.",
        },
        {
          title: "Shop mit WooCommerce",
          body: "Produkte, Varianten, Versand und Zahlungsarten so eingerichtet, dass Bestellungen ohne Nacharbeit ankommen.",
        },
        {
          title: "Bestehende Installation übernehmen",
          body: "Wir prüfen Theme, Plugins, Hosting und Backups, dokumentieren den Stand und übernehmen Wartung und Weiterentwicklung.",
        },
        {
          title: "Daten zwischen Systemen",
          body: "Anfragen landen im CRM, Termine im Buchungssystem, Bestellungen im ERP, ohne dass jemand sie abtippt.",
        },
        {
          title: "Umzug zu WordPress",
          body: "Inhalte aus einem anderen CMS übernehmen, die Struktur bereinigen und Weiterleitungen setzen, damit bestehende Links weiter funktionieren.",
        },
        {
          title: "KI-Funktionen ergänzen",
          body: "Entwürfe, Zusammenfassungen oder Assistenzfunktionen direkt im WordPress-Backend. Was darüber hinausgeht, beschreibt unsere Seite zu KI & Automatisierung.",
        },
      ],
    },
    process: {
      title: "Vier Schritte vom Gespräch zur laufenden Website.",
      steps: [
        {
          title: "Verstehen",
          body: "Im kostenlosen 15-Minuten-Gespräch klären wir Ziel, Ausgangslage und Rahmen. Bestehende Websites sehen wir uns vorab an.",
        },
        {
          title: "Entwerfen",
          body: "Wir beschreiben Umfang, Struktur und Technik schriftlich. Daraus entsteht Ihr Festpreisangebot.",
        },
        {
          title: "Bauen",
          body: "Nach Ihrer schriftlichen Freigabe beginnt die Umsetzung. Sie prüfen Zwischenstände, bevor etwas live geht.",
        },
        {
          title: "Launch & Weiterentwickeln",
          body: "Livegang mit Prüfung von Formularen, Weiterleitungen und Ladezeit. Danach auf Wunsch Wartung und Weiterentwicklung.",
        },
      ],
    },
    pricing: {
      title: "Festpreis nach dem Erstgespräch",
      body: "WordPress-Projekte unterscheiden sich stark im Umfang. Der Preis steht deshalb fest, sobald der Umfang schriftlich beschrieben ist. Sie erhalten ein Festpreisangebot; die Arbeit beginnt erst nach Ihrer Freigabe.",
      points: [
        "Kostenloses 15-Minuten-Gespräch zum Einstieg",
        "Umfang schriftlich beschrieben, Festpreis im Angebot",
        "Arbeitsbeginn erst nach schriftlicher Freigabe",
        "Wartung als monatliche Vereinbarung, Leistungsumfang im Angebot festgelegt",
      ],
    },
    proof: {
      title: "WordPress-Projekte, die live sind.",
      intro:
        "Zwei Beispiele aus unserer WordPress-Arbeit. Die Fallstudien beschreiben, was umgesetzt wurde.",
      items: [
        {
          client: "FiveRP",
          body: "Aus einer früheren GTA-Roleplay-Marke wurde ein WordPress-Portal: getrennte Einstiege für Spieler und Serverbetreiber, eine FiveM-Serverliste mit Weg zum eigenen Eintrag sowie Guides und Hosting-Vergleiche.",
          href: "/cases/five-rp",
          hrefLang: "de",
        },
        {
          client: "StreamerLoft",
          body: "Ein WordPress-Website-Kit für Streamer: Creator-Bereich, Sendeplan und ein Stream-Embed, das erst nach Interaktion lädt. Die Pro-Version ergänzt Clips, VODs, Chat und Community-Links.",
          href: "/cases/streamerloft",
          hrefLang: "de",
        },
      ],
    },
    faq: {
      title: "Häufige Fragen zu WordPress",
      items: [
        {
          q: "Was kostet eine WordPress-Website?",
          a: "Das hängt vom Umfang ab: Seitentypen, Shop, Schnittstellen, Migration. Nach einem kostenlosen 15-Minuten-Gespräch beschreiben wir den Umfang, und Sie erhalten ein schriftliches Festpreisangebot. Für Praxen, Fahrschulen und Handwerksbetriebe gibt es außerdem Website-Pakete mit festen Preisen.",
        },
        {
          q: "Wie lange dauert ein WordPress-Projekt?",
          a: "Das hängt vom Umfang ab. Den Zeitplan legen wir im Angebot fest, zusammen mit den Inhalten, die wir von Ihnen brauchen. Eine Anpassung an einer bestehenden Website ist schneller umgesetzt als ein Shop mit Schnittstellen.",
        },
        {
          q: "Können Sie unsere bestehende WordPress-Website übernehmen?",
          a: "Ja. Zuerst prüfen wir Theme, Plugins, Hosting, Backups und offene Updates und dokumentieren den Stand. Danach entscheiden wir gemeinsam, ob Wartung, schrittweises Aufräumen oder ein Neuaufbau sinnvoll ist.",
        },
        {
          q: "Arbeiten Sie mit Page-Buildern wie Elementor oder Divi?",
          a: "Neue Projekte bauen wir mit eigenem Theme und dem Block-Editor. Das hält die Seiten schlank und die Pflege einfach. Bestehende Page-Builder-Websites übernehmen wir und überführen sie auf Wunsch schrittweise in ein eigenes Theme.",
        },
        {
          q: "Wo wird die Website gehostet?",
          a: "Bei Ihrem bestehenden Hoster oder bei einem Anbieter, den wir passend zu Last und Anforderungen gemeinsam auswählen. Ein Serverstandort in der EU vereinfacht den Datenschutz.",
        },
        {
          q: "Ist WordPress DSGVO-konform?",
          a: "WordPress lässt sich datenschutzfreundlich betreiben. Entscheidend sind Plugins, eingebundene Dienste wie Schriften, Videos oder Karten und das Hosting. Wir binden externe Inhalte so ein, dass sie erst nach Zustimmung oder Interaktion laden, und listen die eingesetzten Dienste für Ihre Datenschutzerklärung auf. Eine Rechtsberatung ersetzt das nicht.",
        },
        {
          q: "Was gehört zur Wartung?",
          a: "Updates von WordPress, Theme und Plugins mit Backup vorher und Prüfung danach, Uptime-Monitoring und Reaktion bei Störungen. Umfang und Reaktionszeiten legen wir im Angebot fest, abgerechnet wird monatlich.",
        },
      ],
    },
    cta: {
      title: "Erzählen Sie uns von Ihrem WordPress-Projekt.",
      body: "Ein paar Sätze zu Ziel und Ausgangslage genügen. Sie bekommen eine persönliche Antwort von Lucas Kleipoedszus.",
      formTitle: "WordPress-Projekt anfragen",
      next: [
        "Sie schildern kurz Ziel und Ausgangslage.",
        "Wir klären Details in einem kostenlosen 15-Minuten-Gespräch.",
        "Sie erhalten ein schriftliches Festpreisangebot.",
        "Nach Ihrer Freigabe beginnt die Umsetzung.",
      ],
    },
  },
  en: {
    route: "wordpress",
    service: "wordpress",
    seo: {
      title: "WordPress development & maintenance",
      description:
        "Custom WordPress themes, WooCommerce, plugins, Core Web Vitals, maintenance, migrations and API integrations. Fixed-price quote after a free 15-minute call.",
    },
    hero: {
      label: "WordPress",
      title: ["WordPress, built properly.", "And looked after once it ships."],
      lede: "We build WordPress sites, shops and plugins without page-builder bloat, take over existing installs and keep them fast, secure and up to date. You deal with one person from the first call to launch.",
      primary: "Discuss your project",
      secondary: { label: "See AI integrations", href: routeFor("ai", "en") },
      facts: [
        { label: "Based in", value: "Rastatt, Germany, and remote" },
        { label: "Contact", value: "Lucas Kleipoedszus" },
        { label: "Stack", value: stack },
        { label: "Since", value: "Building websites since 2015" },
        { label: "Pricing", value: "Fixed price after a first call" },
      ],
    },
    problem: {
      title: "When every WordPress change feels risky.",
      intro:
        "WordPress can do almost anything. Without a clear structure, years of plugins, page-builder layouts and skipped updates pile up until nobody wants to touch the site.",
      points: [
        {
          title: "Slow pages",
          body: "Page builders and stacks of plugins load code most pages never use. That costs load time and drags down Core Web Vitals.",
        },
        {
          title: "Updates nobody runs",
          body: "Outdated plugins and themes are a common way in for attackers. Without a recent backup, the update keeps getting postponed.",
        },
        {
          title: "Every new feature is a workaround",
          body: "An extra field, an integration or a custom checkout step turns into a hack because the site was never built for it.",
        },
        {
          title: "Nobody knows what's installed",
          body: "The original agency is gone and there's no documentation. No one can say what runs on the site or why.",
        },
      ],
    },
    solution: {
      title: "Clean code, few dependencies, one person to talk to.",
      intro:
        "We build themes and blocks around your content, add plugins only where they earn their place and document what's installed. Your team edits content in the block editor without breaking the layout. For existing sites we start with an audit, then decide with you whether a cleanup or a rebuild makes more sense.",
    },
    deliverables: {
      title: "What we handle for your WordPress site",
      items: [
        {
          title: "Custom themes and blocks",
          body: "A theme with Gutenberg blocks designed for your content. No page builder, clean markup, a lean front end.",
        },
        {
          title: "WooCommerce",
          body: "Shops with a clear product structure, shipping and tax rules, payment providers and checkout flows that fit how you sell.",
        },
        {
          title: "Plugin development",
          body: "Custom plugins for features you can't buy off the shelf, or as a lean replacement for a bloated one.",
        },
        {
          title: "Performance and Core Web Vitals",
          body: "Measure, find the cause, fix it: images, scripts, caching, database and server configuration.",
        },
        {
          title: "Security and maintenance",
          body: "Updates with a backup before and a check after, uptime monitoring, and someone who responds when something breaks.",
        },
        {
          title: "Migrations",
          body: "Moving hosts, replacing a page builder with a custom theme, or moving from another CMS to WordPress, with redirects for existing URLs.",
        },
        {
          title: "API integrations",
          body: "Connecting your CRM, booking system, payment provider or ERP through the REST API and webhooks.",
        },
        {
          title: "AI inside WordPress",
          body: "AI features where they save real work, such as drafts or summaries for your editors. Nothing is published until a person has reviewed it.",
        },
      ],
    },
    useCases: {
      title: "Where projects usually start",
      intro: "Most WordPress work we take on begins with one of these.",
      items: [
        {
          title: "Replacing a page-builder site",
          body: "The site is slow and painful to edit. We move the content into a custom theme and redirect existing URLs.",
        },
        {
          title: "A WooCommerce shop",
          body: "Products, variants, shipping and payment methods set up so orders arrive without manual cleanup.",
        },
        {
          title: "Taking over an existing install",
          body: "We review theme, plugins, hosting and backups, document what we find and take over maintenance and development.",
        },
        {
          title: "Connecting your systems",
          body: "Enquiries go to your CRM, bookings to your scheduling tool, orders to your ERP, without anyone retyping them.",
        },
        {
          title: "Moving to WordPress",
          body: "Bringing content over from another CMS, tidying up the structure and setting redirects so existing links keep working.",
        },
        {
          title: "Adding AI features",
          body: "Drafts, summaries or assistant features right in the WordPress admin. For anything beyond that, see our AI & automation page.",
        },
      ],
    },
    process: {
      title: "Four steps from first call to a site that keeps running.",
      steps: [
        {
          title: "Discover",
          body: "A free 15-minute call to clarify goals, starting point and constraints. If you have a site, we look at it beforehand.",
        },
        {
          title: "Design",
          body: "We write down scope, structure and technical approach. That becomes your fixed-price quote.",
        },
        {
          title: "Build",
          body: "Work starts once you've approved the quote in writing. You review progress before anything goes live.",
        },
        {
          title: "Launch & Improve",
          body: "Go-live with checks on forms, redirects and load times. After that, maintenance and further development if you want it.",
        },
      ],
    },
    pricing: {
      title: "A fixed price, agreed before we start",
      body: "WordPress projects vary a lot in scope, so the price is set once the scope is written down. You get a fixed-price quote, and work only starts after you approve it.",
      points: [
        "Free 15-minute call to start",
        "Scope in writing, fixed price in the quote",
        "Work starts only after your written approval",
        "Maintenance as a monthly agreement, scope defined in the quote",
      ],
    },
    proof: {
      title: "WordPress projects you can visit.",
      intro: "Two examples of our WordPress work. The case studies describe what was built.",
      items: [
        {
          client: "FiveRP",
          body: "A former GTA roleplay brand turned into a WordPress portal: separate paths for players and server owners, a FiveM server list with a way to add your own server, plus guides and hosting comparisons.",
          href: "/cases/five-rp",
          hrefLang: "de",
        },
        {
          client: "StreamerLoft",
          body: "A WordPress website kit for streamers: creator section, stream schedule and a stream embed that only loads on interaction. The Pro version adds clips, VODs, chat and community links.",
          href: "/cases/streamerloft",
          hrefLang: "de",
        },
      ],
    },
    faq: {
      title: "WordPress questions we get asked",
      items: [
        {
          q: "How much does a WordPress project cost?",
          a: "It depends on scope: page types, a shop, integrations, a migration. After a free 15-minute call we write down the scope and send you a fixed-price quote.",
        },
        {
          q: "How long does it take?",
          a: "That depends on scope too. The timeline goes into the quote, together with the content we need from you. A change to an existing site is done much sooner than a shop with integrations.",
        },
        {
          q: "Can you take over our existing WordPress site?",
          a: "Yes. We first review theme, plugins, hosting, backups and pending updates and document what we find. Then we decide together whether maintenance, a gradual cleanup or a rebuild makes sense.",
        },
        {
          q: "Do you work with page builders like Elementor or Divi?",
          a: "New projects get a custom theme built on the block editor, which keeps pages lean and editing simple. We do take over page-builder sites and can move them to a custom theme step by step.",
        },
        {
          q: "Where will the site be hosted?",
          a: "With your current host, or with a provider we choose together based on traffic and requirements. For EU visitors, hosting inside the EU makes data protection simpler.",
        },
        {
          q: "Can WordPress be GDPR compliant?",
          a: "WordPress can be run in a privacy-friendly way. What matters are the plugins, embedded services such as fonts, videos or maps, and the hosting. We load third-party content only after consent or interaction and list the services in use for your privacy policy. This is not legal advice.",
        },
        {
          q: "What does maintenance include?",
          a: "Updates to WordPress core, theme and plugins with a backup before and a check after, uptime monitoring and a response when something goes wrong. Scope and response times are set in the quote and billed monthly.",
        },
      ],
    },
    cta: {
      title: "Tell us about your WordPress project.",
      body: "A few sentences on your goal and where things stand are enough. You'll get a personal reply from Lucas Kleipoedszus.",
      formTitle: "Start a WordPress project",
      next: [
        "You tell us briefly what you need.",
        "We go through the details in a free 15-minute call.",
        "You receive a fixed-price quote in writing.",
        "Work starts once you approve it.",
      ],
    },
  },
};
