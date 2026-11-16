import { type Lang, routeFor } from "../i18n";
import type { ServicePage } from "./types";

export const ai: Record<Lang, ServicePage> = {
  de: {
    route: "ai",
    service: "ai",
    seo: {
      title: "KI-Automatisierung für Unternehmen: Agenten & Workflows",
      description:
        "KI-Assistenten, KI-Agenten mit Freigabe und Workflow-Automatisierung für Ihre bestehenden Systeme. Mit Festpreis-Angebot und Datenschutz von Anfang an.",
    },
    hero: {
      label: "KI & Automation",
      title: ["KI-Automatisierung", "für Abläufe, die heute Zeit kosten"],
      lede: "Wir setzen KI dort ein, wo sie Arbeit spart: Anfragen sortieren, Entwürfe vorbereiten, Fragen aus Ihren eigenen Inhalten beantworten. Bevor etwas nach außen geht, prüft ein Mensch.",
      primary: "Pilot besprechen",
      secondary: { label: "Demo ansehen", href: "#demo" },
      facts: [
        { label: "Einstieg", value: "Kleiner Pilot mit festem Umfang" },
        { label: "Freigabe", value: "Ein Mensch prüft, bevor etwas rausgeht" },
        { label: "Kosten", value: "Festpreis für den Bau, Modellkosten nach Nutzung" },
        { label: "Kontakt", value: "Lucas Kleipoedszus, vom Erstgespräch bis zum Launch" },
      ],
    },
    problem: {
      title: "Wo im Alltag Zeit verloren geht",
      intro:
        "Die Abläufe, die sich für Automatisierung eignen, sind meist unspektakulär. Sie kosten trotzdem jede Woche Stunden.",
      points: [
        {
          title: "Wiederkehrende Handarbeit",
          body: "Dieselben Schritte jeden Tag: Daten kopieren, Dateien umbenennen, Statusmails schreiben. Fehler entstehen beim Abtippen.",
        },
        {
          title: "Anfragen, die zweimal getippt werden",
          body: "Eine Anfrage kommt per Formular oder Mail und wird von Hand ins CRM, in eine Tabelle oder ins Ticketsystem übertragen.",
        },
        {
          title: "Liegengebliebene Inhalte",
          body: "Produkttexte, Beiträge und Beschreibungen stehen auf der Liste. Für den ersten Entwurf fehlt die Zeit.",
        },
        {
          title: "Immer dieselben Fragen",
          body: "Support und Vertrieb beantworten Fragen, deren Antwort längst auf der Website, im Handbuch oder in den FAQ steht.",
        },
      ],
    },
    solution: {
      title: "Erst der Ablauf, dann das Werkzeug",
      intro:
        "Wir sehen uns zuerst an, welche Schritte heute Zeit kosten. Danach entscheiden wir, ob feste Regeln reichen oder ein Sprachmodell nötig ist; viele Automatisierungen kommen ohne KI aus. Wo KI Texte erzeugt oder Entscheidungen vorschlägt, gibt Ihr Team frei. Ungeeignet ist KI dort, wo jede Antwort exakt stimmen muss und niemand sie prüft, etwa bei Rechtsauskünften oder verbindlichen Preisen.",
    },
    deliverables: {
      title: "Was wir bauen",
      items: [
        {
          title: "KI in bestehenden Websites",
          body: "Zusammenfassungen, Formulierungshilfen oder Klassifizierung als Funktion Ihrer vorhandenen Website. Der API-Schlüssel bleibt auf dem Server.",
        },
        {
          title: "Assistenten auf Basis Ihrer Inhalte",
          body: "Ein Assistent ruft Antworten aus Ihren Seiten, Dokumenten und FAQ ab (Retrieval) und nennt die Quelle. Was dort nicht steht, gibt er an Ihr Team weiter.",
        },
        {
          title: "KI-Agenten mit Freigabeschritten",
          body: "Agenten erledigen mehrere Schritte selbst, etwa Daten nachschlagen und einen Entwurf anlegen. Vor jeder Aktion mit Außenwirkung warten sie auf eine Freigabe.",
        },
        {
          title: "Workflow-Automatisierung",
          body: "Feste Abläufe zwischen Formular, Postfach, Tabelle und Kalender. Mit Regeln, wo Regeln reichen.",
        },
        {
          title: "Anfragen als strukturierte Daten",
          body: "Eingehende Anfragen werden ausgelesen, in Felder zerlegt und an CRM, Postfach oder Ticketsystem übergeben. Unklare Fälle landen bei einem Menschen.",
        },
        {
          title: "KI in WordPress",
          body: "Entwürfe für die Redaktion, Antworten auf Produktfragen, eine interne Suche über Ihre Inhalte. Zur Plattform selbst lesen Sie mehr auf unserer WordPress-Seite.",
        },
        {
          title: "Protokoll und Kostengrenzen",
          body: "Nachvollziehbare Protokolle der KI-Aufrufe ohne unnötige personenbezogene Daten. Nutzungsgrenzen halten die Modellkosten im geplanten Rahmen.",
        },
      ],
    },
    useCases: {
      title: "Typische Einsatzfälle",
      intro:
        "Abläufe, die sich als Pilot eignen. Welcher bei Ihnen passt, klären wir im Erstgespräch.",
      items: [
        {
          title: "Anfrage-Eingang",
          body: "Kontaktformular → Anliegen, Budget und Frist als Felder → Eintrag im CRM und Antwortentwurf im Postfach.",
        },
        {
          title: "Support-Assistent",
          body: "Beantwortet häufige Fragen aus Handbuch und FAQ, nennt die Quelle und übergibt alles Unklare an Ihr Team.",
        },
        {
          title: "Redaktions-Entwürfe",
          body: "Aus einem kurzen Briefing entsteht ein gegliederter Entwurf in WordPress, den die Redaktion prüft und freigibt.",
        },
        {
          title: "Produktfragen im Shop",
          body: "Kundschaft fragt nach Maßen, Material oder Kompatibilität. Die Antwort stützt sich auf Ihre Produktdaten.",
        },
        {
          title: "Interne Suche",
          body: "Ihr Team findet Richtlinien, Vorlagen und frühere Antworten mit einer Frage in normaler Sprache.",
        },
        {
          title: "Dokumente vorsortieren",
          body: "Eingehende PDFs und Mails werden nach Art erkannt, benannt und dem richtigen Vorgang zugeordnet.",
        },
      ],
    },
    process: {
      title: "In vier Schritten zum laufenden System",
      steps: [
        {
          title: "Verstehen",
          body: "Wir sehen uns den Ablauf an, wie er heute läuft: wer was tut, welche Daten fließen, wo Fehler entstehen.",
        },
        {
          title: "Entwerfen",
          body: "Wir legen fest, was automatisch läuft, wo KI hilft, wo ein Mensch freigibt und welche Daten das System sehen darf.",
        },
        {
          title: "Bauen",
          body: "Umsetzung als Pilot mit echten Beispielen aus Ihrem Alltag. Sie testen, bevor das System produktiv geht.",
        },
        {
          title: "Launch & Weiterentwickeln",
          body: "Livegang mit Protokoll und Kostenübersicht. Danach bauen wir aus, was sich bewährt hat.",
        },
      ],
    },
    pricing: {
      title: "Festpreis für den Bau, Modellkosten nach Nutzung",
      body: "Für KI- und Automatisierungsprojekte gibt es keine Pauschalpreise, dafür unterscheiden sich Abläufe und Systeme zu stark. Den Bau bieten wir zum Festpreis an. Dazu kommen laufende Kosten beim Modellanbieter, die nach Nutzung (Tokens) abgerechnet werden. Diese schätzen wir im Angebot anhand Ihres erwarteten Volumens.",
      points: [
        "Kostenloses Erstgespräch, 15 Minuten",
        "Ziel und Umfang schriftlich festhalten",
        "Festpreis-Angebot mit Schätzung der laufenden Modellkosten",
        "Arbeitsbeginn erst nach Ihrer schriftlichen Freigabe",
      ],
    },
    proof: {
      title: "Was belegt ist",
      intro:
        "KI-Projekte für Kundschaft, auf die wir verweisen könnten, gibt es bisher nicht. Belegt sind Automatisierung im Produktivbetrieb sowie Plattformen und WordPress-Websites. Deshalb beginnen wir mit einem kleinen Pilot mit festem Umfang.",
      items: [
        {
          client: "Eigene Kundenpipeline",
          body: "Für unsere Website-Pakete läuft eine Automatisierung in Produktion: Bestellung über Stripe, Onboarding-Formular mit Bild-Upload, jeder Auftrag als Vorgang in GitHub, eine Statusseite mit Rückfragen und Bestätigungsmails. Scheitert die Ablage, geht der Auftrag per Mail an uns. Die Pipeline arbeitet mit festen Regeln, ohne KI.",
          href: routeFor("doctors", "de"),
          hrefLang: "de",
        },
        {
          client: "Pfotenweb",
          body: "Plattform für Tierschutzvereine: Vereinswebsite, Tierprofile, ein Postfach für Vermittlungsanfragen und Schutzverträge an einem Ort.",
          href: "/cases/pfotenweb",
          hrefLang: "de",
        },
        {
          client: "FiveRP",
          body: "WordPress-Portal mit FiveM-Serverliste, Anleitungen und Ressourcen für Spieler und Serverbetreiber.",
          href: "/cases/five-rp",
          hrefLang: "de",
        },
      ],
    },
    faq: {
      title: "Häufige Fragen zu KI und Automatisierung",
      items: [
        {
          q: "Braucht jede Automatisierung KI?",
          a: "Nein. Viele Abläufe lassen sich mit festen Regeln zuverlässiger und günstiger automatisieren. KI setzen wir ein, wenn Text verstanden oder formuliert werden muss, etwa bei frei geschriebenen Anfragen.",
        },
        {
          q: "Wie gehen Sie mit Datenschutz um?",
          a: "API-Schlüssel liegen nur auf dem Server. An das Modell gehen nur die Daten, die für die Aufgabe nötig sind. Mit dem Modellanbieter schließen Sie einen Vertrag zur Auftragsverarbeitung; wo der Anbieter Verarbeitung in der EU anbietet, nutzen wir sie. Ob ein Anbieter für Ihren Fall zulässig ist, klären Sie mit Ihrem Datenschutzbeauftragten. Rechtsberatung leisten wir nicht.",
        },
        {
          q: "Kann die KI Fehler machen?",
          a: "Ja. Sprachmodelle können falsche Aussagen überzeugend formulieren. Deshalb prüft standardmäßig ein Mensch, bevor etwas an Kundschaft geht, und Assistenten stützen sich auf Ihre freigegebenen Inhalte und nennen die Quelle.",
        },
        {
          q: "Welches KI-Modell setzen Sie ein?",
          a: "Das hängt von Aufgabe, Datenschutzanforderungen und Kosten ab. Wir binden das Modell so an, dass es sich später austauschen lässt.",
        },
        {
          q: "Was kostet der laufende Betrieb?",
          a: "Modellanbieter rechnen nach Nutzung ab, meist nach verarbeitetem Textumfang (Tokens). Die Höhe hängt davon ab, wie oft das System läuft und wie viel Text es verarbeitet. Wir schätzen die Kosten im Angebot und setzen Nutzungsgrenzen.",
        },
        {
          q: "Funktioniert das mit unserer bestehenden Software?",
          a: "Wenn Ihr CRM, Ticketsystem oder Shop eine Schnittstelle (API) oder einen Import bietet, meistens ja. Das klären wir im ersten Schritt, bevor ein Angebot entsteht.",
        },
        {
          q: "Wie fangen wir am besten an?",
          a: "Mit einem Ablauf, der häufig vorkommt und dessen Ergebnis sich gut prüfen lässt. Daraus wird ein Pilot mit festem Umfang. Bewährt er sich, bauen wir weiter.",
        },
      ],
    },
    cta: {
      title: "Welcher Ablauf kostet Sie die meiste Zeit?",
      body: "Beschreiben Sie kurz, was heute von Hand passiert. Sie bekommen eine ehrliche Einschätzung, ob sich KI, einfache Automatisierung oder keins von beidem lohnt.",
      formTitle: "Ablauf beschreiben",
      next: [
        "Antwort von Lucas persönlich per E-Mail",
        "Kostenloses 15-Minuten-Gespräch zu Ihrem Ablauf",
        "Festpreis-Angebot mit Schätzung der Modellkosten",
        "Start nach Ihrer schriftlichen Freigabe",
      ],
    },
  },
  en: {
    route: "ai",
    service: "ai",
    seo: {
      title: "AI automation & AI agents for business workflows",
      description:
        "AI assistants, AI agents with human approval and workflow automation for the systems you already use. Fixed-price quotes, data protection built in.",
    },
    hero: {
      label: "AI & Automation",
      title: ["AI automation", "for the work your team repeats every day"],
      lede: "We use AI where it saves real work: sorting inquiries, preparing drafts, answering questions from your own content. A person reviews anything before it reaches a customer.",
      primary: "Discuss a pilot",
      secondary: { label: "Grok Bot for WordPress", href: routeFor("grokBot", "en") },
      facts: [
        { label: "Start", value: "A small pilot with a fixed scope" },
        { label: "Review", value: "A person approves before anything goes out" },
        { label: "Cost", value: "Fixed price to build, model usage billed as used" },
        { label: "Contact", value: "Lucas Kleipoedszus, from first call to launch" },
      ],
    },
    problem: {
      title: "Where the hours go",
      intro: "The processes worth automating are rarely exciting. They still eat hours every week.",
      points: [
        {
          title: "Repetitive manual work",
          body: "The same steps every day: copying data, renaming files, writing status emails. Mistakes creep in while retyping.",
        },
        {
          title: "Inquiries typed in twice",
          body: "A request arrives by form or email and someone copies it by hand into the CRM, a spreadsheet or the ticket system.",
        },
        {
          title: "A growing content backlog",
          body: "Product copy, articles and descriptions sit on the list. Nobody has time for the first draft.",
        },
        {
          title: "The same questions, again",
          body: "Support and sales answer questions that are already covered on the website, in the manual or in the FAQ.",
        },
      ],
    },
    solution: {
      title: "Start with the process, then pick the tool",
      intro:
        "First we look at which steps cost you time today. Then we decide whether fixed rules are enough or a language model is needed; plenty of automation works without AI. Where AI writes text or suggests decisions, your team approves it. AI is the wrong tool where every answer has to be exactly right and nobody checks it, such as legal advice or binding prices.",
    },
    deliverables: {
      title: "What we build",
      items: [
        {
          title: "AI inside your existing website",
          body: "Summaries, writing help or classification as a feature of the site you already have. API keys stay on the server.",
        },
        {
          title: "Assistants grounded in your content",
          body: "An assistant retrieves answers from your pages, documents and FAQ and cites the source. Anything not covered there goes to your team.",
        },
        {
          title: "AI agents with approval steps",
          body: "Agents handle several steps on their own, such as looking up data and preparing a draft. Before any action that leaves the building, they wait for approval.",
        },
        {
          title: "Workflow automation",
          body: "Fixed flows between forms, inbox, spreadsheets and calendar. Plain rules wherever rules will do.",
        },
        {
          title: "Inquiries as structured data",
          body: "Incoming requests are read, split into fields and passed to your CRM, inbox or ticket system. Unclear cases go to a person.",
        },
        {
          title: "AI in WordPress",
          body: "Drafts for editors, answers to product questions, internal search across your content. For the platform itself, see our WordPress page.",
        },
        {
          title: "Logging and cost limits",
          body: "Traceable logs of AI calls without unnecessary personal data. Usage limits keep model costs within the agreed budget.",
        },
      ],
    },
    useCases: {
      title: "Typical use cases",
      intro:
        "Processes that work well as a pilot. We figure out which one fits you on the first call.",
      items: [
        {
          title: "Inquiry intake",
          body: "Contact form → request, budget and deadline as fields → CRM entry plus a reply draft in your inbox.",
        },
        {
          title: "Support assistant",
          body: "Answers common questions from your manual and FAQ, cites the source and hands anything unclear to your team.",
        },
        {
          title: "Editorial drafts",
          body: "A short brief becomes a structured draft in WordPress, which an editor reviews and publishes.",
        },
        {
          title: "Product questions in your shop",
          body: "Customers ask about size, material or compatibility. The answer is based on your product data.",
        },
        {
          title: "Internal search",
          body: "Your team finds policies, templates and past answers by asking a question in plain language.",
        },
        {
          title: "Document triage",
          body: "Incoming PDFs and emails are recognised by type, named and attached to the right case.",
        },
      ],
    },
    process: {
      title: "Four steps to a working system",
      steps: [
        {
          title: "Discover",
          body: "We map the process as it runs today: who does what, which data moves where, and where errors happen.",
        },
        {
          title: "Design",
          body: "We decide what runs automatically, where AI helps, where a person approves and which data the system may see.",
        },
        {
          title: "Build",
          body: "We build a pilot using real examples from your day-to-day work. You test it before it goes live.",
        },
        {
          title: "Launch & Improve",
          body: "Go-live with logging and a cost overview. Then we extend what has proven useful.",
        },
      ],
    },
    pricing: {
      title: "Fixed price to build, usage-based model costs",
      body: "There are no package prices for AI and automation work; processes and systems differ too much. We quote the build at a fixed price. On top of that, the model provider bills usage (tokens). We estimate those running costs in the quote based on the volume you expect.",
      points: [
        "Free 15-minute intro call",
        "Goals and scope agreed in writing",
        "Fixed-price quote including an estimate of running model costs",
        "Work starts only after your written approval",
      ],
    },
    proof: {
      title: "What we can show",
      intro:
        "We have no client AI projects to point to yet. What we can show is automation running in production, plus platforms and WordPress sites we built. That is why we start with a small, fixed-scope pilot.",
      items: [
        {
          client: "Our own customer pipeline",
          body: "Our website packages run on an automation in production: Stripe checkout, an onboarding form with image upload, every order logged as an issue in GitHub, a status page with follow-up questions, and confirmation emails. If filing fails, the order reaches us by email. The pipeline runs on fixed rules, without AI.",
          href: routeFor("doctors", "de"),
          hrefLang: "de",
        },
        {
          client: "Pfotenweb",
          body: "A platform for animal-welfare groups: club website, animal profiles, an inbox for adoption inquiries and contracts in one place.",
          href: "/cases/pfotenweb",
          hrefLang: "de",
        },
        {
          client: "FiveRP",
          body: "A WordPress portal with a FiveM server list, guides and resources for players and server owners.",
          href: "/cases/five-rp",
          hrefLang: "de",
        },
      ],
    },
    faq: {
      title: "Questions about AI and automation",
      items: [
        {
          q: "Does every automation need AI?",
          a: "No. Many processes are automated more reliably and more cheaply with fixed rules. We use AI when text has to be understood or written, for example free-form inquiries.",
        },
        {
          q: "How do you handle data protection?",
          a: "API keys live on the server only. The model receives only the data the task needs. You sign a data processing agreement with the model provider, and where the provider offers processing in the EU, we use it. Whether a provider is acceptable for your case is for you and your data protection officer to decide; we do not give legal advice.",
        },
        {
          q: "Can the AI get things wrong?",
          a: "Yes. Language models can state wrong things convincingly. That is why a person reviews by default before anything reaches a customer, and assistants rely on your approved content and cite their source.",
        },
        {
          q: "Which AI model do you use?",
          a: "That depends on the task, your data protection requirements and cost. We connect the model so it can be swapped later.",
        },
        {
          q: "What does it cost to run?",
          a: "Model providers bill by usage, usually by the amount of text processed (tokens). The total depends on how often the system runs and how much text it handles. We estimate it in the quote and set usage limits.",
        },
        {
          q: "Will it work with our existing software?",
          a: "If your CRM, ticket system or shop offers an API or an import, usually yes. We check this in the first step, before you get a quote.",
        },
        {
          q: "Where should we start?",
          a: "With a process that happens often and whose result is easy to check. That becomes a pilot with a fixed scope. If it works, we build on it.",
        },
      ],
    },
    cta: {
      title: "Which process costs you the most time?",
      body: "Tell us briefly what happens by hand today. You get an honest view on whether AI, simple automation or neither is worth it.",
      formTitle: "Describe the process",
      next: [
        "A personal reply from Lucas by email",
        "A free 15-minute call about your process",
        "A fixed-price quote with estimated model costs",
        "Work starts after your written approval",
      ],
    },
  },
};
