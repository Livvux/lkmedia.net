export interface ServicesContent {
  proof: { title: string; body: string; linkLabel: string };
}

// /leistungen gibt es nur auf Deutsch.
export const servicesContent: Record<"de", ServicesContent> = {
  de: {
    proof: {
      title: "So sieht das in der Praxis aus.",
      body: "Ausgewählte Websites und digitale Plattformen für Unternehmen, Tierschutz und Creator. Unterschiedliche Aufgaben, konkrete Umsetzungen.",
      linkLabel: "Alle Projekte ansehen",
    },
  },
};
