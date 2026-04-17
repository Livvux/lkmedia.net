# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm**. Node: **>=22.12.0**.

- `pnpm dev` — Astro dev server (default port 4321)
- `pnpm build` — Production build to `./dist/` (SSR entry at `dist/server/entry.mjs`)
- `pnpm preview` — Preview built site
- `pnpm check` — `astro check` (type + content schema check)
- `pnpm lint` — Biome check on `src/`
- `pnpm format` — Biome format write
- `pnpm test` — Vitest unit tests (`tests/unit`)
- `pnpm test:e2e` — Playwright E2E (`tests/e2e`, config `playwright.config.ts`)
- Single unit test: `pnpm vitest run tests/unit/<file>.test.ts`
- Single e2e: `pnpm playwright test tests/e2e/<file>.spec.ts`

Docker: multi-stage build in `Dockerfile` produces Node standalone server listening on `PORT=4321`.

## Architecture

**Astro 6** site for lkmedia.net. `output: 'static'` with `@astrojs/node` standalone adapter — static by default, per-route SSR opt-in via `export const prerender = false`. Tailwind v4 via Vite plugin. MDX content. Sitemap with i18n.

### i18n

Two locales configured in `astro.config.mjs`: `de` (default, no prefix) and `en` (prefixed `/en/...`). German pages live at `src/pages/*.astro`; English mirrors under `src/pages/en/*.astro`. Keep both in sync when adding public routes. Helpers in `src/lib/i18n.ts`.

### Routing & middleware

`src/middleware.ts` runs on every request:
1. Exact-path redirects from `src/lib/redirects.ts` (301).
2. 404 fallback → 301 to `/blog` (except paths matching `SKIP_PREFIXES` / `SKIP_SUFFIXES`, which pass through).
3. Uses `x-forwarded-host` / `x-forwarded-proto` to build absolute redirect URLs — required because app runs behind Traefik. Don't use `ctx.url.origin` for redirects.

### Content collections

Defined in `src/content.config.ts` via `astro:content` + `glob` loader:
- `posts` (`src/content/posts/**/*.{md,mdx}`) — blog posts with strict zod schema (title ≤70, description ≤160, `lang: 'de'|'en'`, `route: 'blog'|'root'`).
- `cases` (`src/content/cases/**`) — case studies, niche enum: `anwaelte | luxus-immobilien | privatkliniken | fintech | other`.

Dynamic routes: `src/pages/[slug].astro` (root-level posts), `src/pages/blog/`, `src/pages/cases/`, and `src/pages/en/` mirrors.

### SEO / LLM endpoints

- `src/pages/robots.txt.ts`, `rss.xml.ts`, `llms.txt.ts`, `llms-full.txt.ts` — generated endpoints.
- `src/components/Seo.astro` + `src/lib/seo.ts` + `src/lib/schema.ts` — meta tags and JSON-LD.

### API

`src/pages/api/contact.ts` — Resend-backed contact form handler (requires `RESEND_API_KEY` env).

### Scripts

- `scripts/device-mockup.mjs` — generates landing device mockup image.
- `scripts/shot.mjs` — screenshot utility.

### Tooling

- Biome (`biome.json`) for lint + format, 2-space indent, 100 line width, targets `src/**/*.{ts,tsx,js,mjs}`.
- Lighthouse CI config: `lighthouserc.json`.
- Analytics: self-hosted Plausible at `analytics.vertexmods.com`.
