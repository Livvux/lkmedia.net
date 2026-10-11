export const exactRedirects: Record<string, string> = {
  "/impressum": "/imprint",
  "/impressum/": "/imprint",
  "/tools/sora-downloader": "/blog",
  "/tools/sora-downloader/": "/blog",
  "/webdesign-fahrschulen": "/",
  "/webdesign-fahrschulen/": "/",
  "/seo-tools": "/",
  "/seo-tools/": "/",
  "/online-marketing-fahrschulen": "/",
  "/online-marketing-fahrschulen/": "/",
  "/blog/digital-marketing-fahrschulen": "/blog/marketing-ideen-fahrschule/",
  "/blog/digital-marketing-fahrschulen/": "/blog/marketing-ideen-fahrschule/",
};

/**
 * Keep backlinks and indexed /en/ URLs functional after removing the English site.
 * Redirect equivalent German pages directly rather than allowing a 404 fallback.
 */
export function englishRedirectPath(path: string): string | null {
  const normalized = path.replace(/\/+$/, "") || "/";
  if (normalized !== "/en" && !normalized.startsWith("/en/")) return null;

  const localPath = normalized.slice(3) || "/";
  const aliases: Record<string, string> = {
    "/": "/",
    "/about": "/ueber",
    "/contact": "/kontakt",
    "/thanks": "/danke",
    "/help": "/help",
    "/phone-privacy": "/phone-privacy",
    "/leistungen": "/leistungen",
    "/anwaelte": "/anwaelte",
    "/luxus-immobilien": "/luxus-immobilien",
    "/blog": "/blog",
    "/cases": "/cases",
    "/rss.xml": "/rss.xml",
  };
  const target = aliases[localPath] ?? localPath;
  return target === "/" || !path.endsWith("/") ? target : `${target}/`;
}
