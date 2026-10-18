// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const postsDirectory = new URL('./src/content/posts/de/', import.meta.url);
const rootPostPaths = new Set(
  readdirSync(postsDirectory).filter((file) => /\.mdx?$/.test(file)).flatMap((file) => {
    const frontmatter = readFileSync(new URL(file, postsDirectory), 'utf8').split(/^---\s*$/m)[1];
    return parse(frontmatter ?? '')?.route === 'root' ? [`/${file.replace(/\.mdx?$/, '')}`] : [];
  }),
);

const noindexRoutes = [
  /^\/404$/,
  /^\/aenderung(?:\/|$)/,
  /\/(?:onboarding|danke)$/,
  /^\/blog\/real-debrid-review-multi-hoster-downloader$/,
];

// Note: Astro v5+ removed `output: 'hybrid'`. `output: 'static'` now supports
// per-route opt-in SSR via `export const prerender = false`.
// https://docs.astro.build/en/guides/upgrade-to/v5/#removed-hybrid-rendering-mode
export default defineConfig({
  site: 'https://lkmedia.net',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    mdx(),
    react(),
    sitemap({
      filter: (page) => !noindexRoutes.some((route) => route.test(new URL(page).pathname.replace(/\/$/, ''))),
      serialize: (item) => {
        const url = new URL(item.url);
        const path = url.pathname.replace(/\/$/, '');
        // Post.astro uses trailing slashes; static pages and case studies do not.
        url.pathname = path === '' || path.startsWith('/blog/') || rootPostPaths.has(path)
          ? `${path}/`
          : path;
        return { ...item, url: url.href };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Sonst entdeckt Vite die Toolbar erst beim ersten Seitenaufruf, optimiert neu und lädt die Seite neu.
    optimizeDeps: { include: ['astro/runtime/client/dev-toolbar/entrypoint.js'] },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Eigener CSRF-Check in src/middleware.ts (Proxy-Origin + Handwerker-Endpoint), siehe src/lib/csrf.ts.
  security: { checkOrigin: false },
});
