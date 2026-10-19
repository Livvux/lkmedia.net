export const blogTopicIds = [
  "kanzleien",
  "fahrschulen",
  "arztpraxen",
  "handwerk",
  "seo-technik",
] as const;

export type BlogTopicId = (typeof blogTopicIds)[number];

type BlogTopic = {
  title: string;
  description: string;
  offer?: { href: string; label: string };
};

/**
 * One clear topic per article. Offers are existing commercial pillars;
 * editorial clusters never create a second page for the same buyer intent.
 */
export const blogTopics: Record<BlogTopicId, BlogTopic> = {
  kanzleien: {
    title: "Kanzleien",
    description: "Website-Planung, lokale Sichtbarkeit und Marketing für Kanzleien. Mit konkreten Kosten- und Prüfungsfragen statt Rankingversprechen.",
    offer: { href: "/anwaelte", label: "Webdesign für Kanzleien" },
  },
  fahrschulen: {
    title: "Fahrschulen",
    description: "Von Standortseiten und Online-Anmeldung bis zu Local SEO: Ratgeber und ein reales Projektbeispiel für Fahrschulen.",
    offer: { href: "/fahrschule-webdesign", label: "Fahrschul-Website und Leistungen" },
  },
  arztpraxen: {
    title: "Arztpraxen",
    description: "Was eine Praxiswebsite vor dem Start braucht: Leistungen, Kontaktwege, Terminlinks, Freigaben und Kosten.",
    offer: { href: "/docweb", label: "Website-Paket für Arztpraxen" },
  },
  handwerk: {
    title: "Handwerksbetriebe",
    description: "Websites für SHK- und Elektrobetriebe: Einsatzgebiete, Projektanfragen mit Fotos, Bewerbungen und Leistungsumfang.",
    offer: { href: "/handwerk", label: "Website-Paket für Handwerker" },
  },
  "seo-technik": {
    title: "SEO & Website-Technik",
    description: "Konkrete technische Anleitungen und Werkzeuge für Website-Analyse, Suchmaschinenoptimierung und nachvollziehbare Entscheidungen.",
  },
};

export function blogPostUrl(post: { id: string; data: { route: "blog" | "root" } }): string {
  const slug = post.id.replace(/^(de|en)\//, "");
  return post.data.route === "root" ? `/${slug}/` : `/blog/${slug}/`;
}
