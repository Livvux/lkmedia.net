// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Note: Astro v5+ removed `output: 'hybrid'`. `output: 'static'` now supports
// per-route opt-in SSR via `export const prerender = false`.
// https://docs.astro.build/en/guides/upgrade-to/v5/#removed-hybrid-rendering-mode
export default defineConfig({
  site: 'https://lkmedia.net',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: { de: 'de-DE', en: 'en-US' },
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
