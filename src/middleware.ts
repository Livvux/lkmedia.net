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

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const target = exactRedirects[path] ?? exactRedirects[path.replace(/\/$/, "")];
  if (target) return Response.redirect(new URL(target, ctx.url), 301);
  const res = await next();
  if (res.status === 404 && !shouldBypass(path)) {
    return Response.redirect(new URL("/blog", ctx.url), 301);
  }
  return res;
});
