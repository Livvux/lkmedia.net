// Ersetzt Astros security.checkOrigin (abgeschaltet in astro.config.mjs): gleiche Regel, aber mit
// Proxy-bewusstem Origin und Ausnahme für den Handwerker-Endpoint, der Origins selbst prüft.
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const FORM_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
const OWN_ORIGIN_CHECK = ["/api/handwerk/", "/api/fahrschule/"];

export function isBlockedCrossSitePost(i: {
  method: string;
  contentType: string | null;
  origin: string | null;
  selfOrigin: string;
  path: string;
}): boolean {
  if (SAFE_METHODS.includes(i.method)) return false;
  if (OWN_ORIGIN_CHECK.some((p) => i.path.startsWith(p))) return false;
  const ct = i.contentType?.toLowerCase();
  if (ct && !FORM_TYPES.some((t) => ct.includes(t))) return false;
  return i.origin !== i.selfOrigin;
}
