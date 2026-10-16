import { defineMiddleware } from "astro:middleware";
import { isBlockedCrossSitePost } from "./lib/csrf";
import { englishRedirectPath, exactRedirects } from "./lib/redirects";

function externalOrigin(request: Request, fallback: URL): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? fallback.protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return fallback.origin;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  // Header nur lesen, wenn nötig: auf vorgerenderten Seiten löst Zugriff darauf eine Build-Warnung aus.
  const origin = () => externalOrigin(ctx.request, ctx.url);
  if (
    !ctx.isPrerendered &&
    isBlockedCrossSitePost({
      method: ctx.request.method,
      contentType: ctx.request.headers.get("content-type"),
      origin: ctx.request.headers.get("origin"),
      selfOrigin: origin(),
      path,
    })
  ) {
    return new Response("Cross-site form submissions are forbidden", { status: 403 });
  }
  const legacyEnglishTarget = englishRedirectPath(path);
  if (legacyEnglishTarget) {
    return Response.redirect(`${origin()}${legacyEnglishTarget}${ctx.url.search}`, 301);
  }
  const target = exactRedirects[path] ?? exactRedirects[path.replace(/\/$/, "")];
  if (target) return Response.redirect(`${origin()}${target}`, 301);
  return next();
});
