import { defineMiddleware } from "astro:middleware";
import { exactRedirects } from "./lib/redirects";

const SKIP_PREFIXES = [
  "/api/",
  "/og/",
  "/_astro/",
  "/posts/",
  "/cases/",
  "/landing/",
  "/fonts/",
  "/ueber/",
];
const SKIP_SUFFIXES = [
  ".xml",
  ".txt",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".svg",
  ".css",
  ".js",
  ".mjs",
  ".woff",
  ".woff2",
];

function shouldBypass(path: string): boolean {
  return (
    SKIP_PREFIXES.some((p) => path.startsWith(p)) || SKIP_SUFFIXES.some((s) => path.endsWith(s))
  );
}

function externalOrigin(request: Request, fallback: URL): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? fallback.protocol.replace(":", "");
  if (host) return `${proto}://${host}`;
  return fallback.origin;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const origin = externalOrigin(ctx.request, ctx.url);
  const target = exactRedirects[path] ?? exactRedirects[path.replace(/\/$/, "")];
  if (target) return Response.redirect(`${origin}${target}`, 301);
  const res = await next();
  if (res.status === 404 && !shouldBypass(path)) {
    return Response.redirect(`${origin}/blog`, 301);
  }
  return res;
});
