/**
 * Produktion: Cloudflare → Traefik → App. Cloudflare setzt `cf-connecting-ip` (echte Client-IP); das ist nur
 * vertrauenswürdig, weil der Origin ausschließlich über Cloudflare erreichbar ist. Ohne Cloudflare (Dev) gilt der
 * letzte X-Forwarded-For-Eintrag (von Traefik angehängt; frühere Einträge sind fälschbar), sonst `fallback`.
 */
export function clientIp(request: Request, fallback: string): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || fallback;
}
