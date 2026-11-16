import type { Lang, RouteName } from "../i18n";
import type { SERVICES } from "../lead-source";

/** Inhalt einer Leistungsseite; `ServiceDetail.astro` rendert jede Sprache aus demselben Typ. */
export interface ServicePage {
  route: RouteName;
  /** Anliegen, das im Kontaktformular vorgewählt wird. */
  service: keyof typeof SERVICES;
  seo: { title: string; description: string };
  hero: {
    label: string;
    /** Zweite Zeile tritt optisch zurück. */
    title: [string, string];
    lede: string;
    primary: string;
    secondary: { label: string; href: string };
    /** Datenblatt neben der Überschrift: nur belegbare Angaben. */
    facts: { label: string; value: string }[];
  };
  problem: { title: string; intro: string; points: { title: string; body: string }[] };
  solution: { title: string; intro: string };
  deliverables: { title: string; items: { title: string; body: string }[] };
  useCases: { title: string; intro: string; items: { title: string; body: string }[] };
  process: { title: string; steps: { title: string; body: string }[] };
  pricing: { title: string; body: string; points: string[] };
  proof: {
    title: string;
    intro: string;
    /** Nur echte Projekte aus src/content/cases; `href` ist die Case-Seite. */
    items: { client: string; body: string; href: string; hrefLang?: Lang }[];
  };
  faq: { title: string; items: { q: string; a: string }[] };
  cta: { title: string; body: string; formTitle: string; next: string[] };
}
