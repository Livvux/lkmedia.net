import { alternatesFor, type Lang } from "./i18n";

export interface SeoProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  lang: Lang;
}

const SITE = "https://lkmedia.net";
const DEFAULT_OG = `${SITE}/og/default.png`;

export function buildSeo(p: SeoProps) {
  const ogImage = new URL(p.ogImage ?? DEFAULT_OG, SITE).href;
  const isDefaultImage = ogImage === DEFAULT_OG;
  const abs = (path: string) => new URL(path, SITE).href;
  const versions = alternatesFor(p.canonical);
  return {
    // hreflang nur für Seiten mit beiden Sprachfassungen; Deutsch bleibt x-default.
    alternates: versions.de
      ? [
          { hreflang: "de", href: abs(versions.de) },
          { hreflang: "en", href: abs(versions.en ?? versions.de) },
          { hreflang: "x-default", href: abs(versions.de) },
        ]
      : [],
    locale: p.lang === "en" ? "en_US" : "de_DE",
    // Suffix nur, wenn der Titel unter ~60 Zeichen bleibt (SERP-Abschnitt).
    title: `${p.title} · lkmedia`.length <= 60 ? `${p.title} · lkmedia` : p.title,
    description: p.description,
    canonical: new URL(p.canonical, SITE).href,
    ogImage,
    ogImageAlt: p.ogImageAlt ?? (isDefaultImage ? "lkmedia – Websites, WordPress & KI" : undefined),
    ogImageWidth: isDefaultImage ? 1200 : undefined,
    ogImageHeight: isDefaultImage ? 630 : undefined,
    type: p.type ?? "website",
    publishedTime: p.publishedTime,
    modifiedTime: p.modifiedTime,
    author: p.author,
    noindex: p.noindex ?? false,
    lang: p.lang,
  };
}
