import type { Lang } from "./i18n";

export interface SeoProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  noindex?: boolean;
  lang: Lang;
  alternateUrls?: { de?: string; en?: string };
}

const SITE = "https://lkmedia.net";
const DEFAULT_OG = `${SITE}/og/default.png`;

export function buildSeo(p: SeoProps) {
  return {
    title: `${p.title} · lkmedia`,
    description: p.description,
    canonical: p.canonical.startsWith("http") ? p.canonical : `${SITE}${p.canonical}`,
    ogImage: p.ogImage ?? DEFAULT_OG,
    noindex: p.noindex ?? false,
    lang: p.lang,
    alternateUrls: p.alternateUrls,
  };
}
