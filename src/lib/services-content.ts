import type { Lang } from "./i18n";

export interface ServicesContent {
  proof: { title: string; body: string; linkLabel: string };
}

export const servicesContent: Record<Lang, ServicesContent> = {
  de: {
    proof: {
      title: "So sieht das in der Praxis aus.",
      body: "Ausgewählte Websites und digitale Plattformen für Unternehmen, Tierschutz und Creator. Unterschiedliche Aufgaben, konkrete Umsetzungen.",
      linkLabel: "Alle Projekte ansehen",
    },
  },
};
