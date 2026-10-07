// handwerkweb – Register der Kunden-Websites. Neuer Kunde = ein Eintrag (siehe handwerkweb/AGENTS.md).
// Empfänger und erlaubte Origins kommen nur von hier, nie aus dem Formular (sonst offenes Mail-Relay).

export interface HandwerkSite {
  name: string;
  email: string;
  origins: string[];
  /** PLZ-Anfänge des Einsatzgebiets; Anfragen außerhalb werden im Betreff markiert, nicht blockiert. */
  plzPraefixe: string[];
}

export const HANDWERK_SITES: Record<string, HandwerkSite> = {
  demo: {
    name: "Muster Haustechnik (Demo)",
    email: "lucas@lkmedia.net",
    origins: ["https://handwerk.lkmedia.net"],
    plzPraefixe: ["762", "764", "765", "772"],
  },
};

/** Template-Dev-Server (astro dev / preview). */
export const DEV_ORIGINS = ["http://localhost:4321", "http://localhost:4322"];

export function findSite(id: string): HandwerkSite | undefined {
  return Object.hasOwn(HANDWERK_SITES, id) ? HANDWERK_SITES[id] : undefined;
}

export function allowedOrigins(site: HandwerkSite, dev: boolean): string[] {
  return dev ? [...site.origins, ...DEV_ORIGINS] : site.origins;
}
