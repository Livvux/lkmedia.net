# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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

**Astro 6** site for lkmedia.net. `output: 'static'` with `@astrojs/node` standalone adapter — static by default, per-route SSR opt-in via `export const prerender = false`. Tailwind v4 via Vite plugin. MDX content. Sitemap covers German and English pages.

### i18n

German is the default at `/` without a prefix. English exists selectively under `/en/`. `routes` in `src/lib/i18n.ts` is the one table: a page is English only if it has an `en` path there. Nav, hreflang (`buildSeo` → `Seo.astro`, German is `x-default`), the language switch (shown only where a counterpart exists) and the legacy redirects read it. Legacy `/en/*` URLs without an `en` route still redirect permanently to the German page (`englishRedirectPath`). No empty or machine-translated English pages: add the route and the real page together. Cases, blog and legal pages are German-only; English pages mark links to them as German.

### Routing & middleware

`src/middleware.ts` runs on every request:
1. Exact-path redirects from `src/lib/redirects.ts` (301).
2. Unknown URLs retain HTTP 404. Never redirect missing pages or assets to generic destinations.
3. Uses `x-forwarded-host` / `x-forwarded-proto` to build absolute redirect URLs — required because app runs behind Traefik. Don't use `ctx.url.origin` for redirects.

### Content collections

Defined in `src/content.config.ts` via `astro:content` + `glob` loader:
- `posts` (`src/content/posts/**/*.{md,mdx}`) — blog posts with strict zod schema (title ≤70, description ≤160, `lang: 'de'`, `route: 'blog'|'root'`).
- `cases` (`src/content/cases/**`) — case studies, niche enum: `anwaelte | luxus-immobilien | privatkliniken | fintech | other`.

Dynamic routes: `src/pages/[slug].astro` (root-level posts), `src/pages/blog/`, and `src/pages/cases/`.

### SEO / LLM endpoints

- `src/pages/robots.txt.ts`, `rss.xml.ts`, `llms.txt.ts`, `llms-full.txt.ts` — generated endpoints.
- `src/components/Seo.astro` + `src/lib/seo.ts` + `src/lib/schema.ts` — meta tags and JSON-LD.

### API

`src/pages/api/contact.ts` — Resend-backed contact form handler (requires `RESEND_API_KEY` env).

`src/pages/api/docweb-onboarding.ts` / `handwerk-onboarding.ts` — Onboarding nach Stripe-Checkout (Payment-Link-Check in `src/lib/stripe.ts`).

`src/pages/api/handwerk/[siteId]/[form].ts` / `api/fahrschule/[siteId]/[form].ts` — Formular-Endpoints für Kunden-Websites (handwerkweb: Projektanfrage, Bewerbung; fahrschulweb: Anmeldung). Empfänger/Origins nur aus dem Kunden-Register `src/lib/kunden.ts` (lädt `kunden.yaml` aus dem privaten Repo `Livvux/kunden` via `GITHUB_KUNDEN_TOKEN`, 5 Min. Cache). Versand per SMTP (`src/lib/mailer.ts`, Env `SMTP_*`). Astros `security.checkOrigin` ist aus; CSRF prüft `src/lib/csrf.ts` in der Middleware.

### Landing page

`src/components/home/` builds the homepage for both languages from `src/lib/home-content.ts`. The hero pairs a studio portrait with the inquiry CTA. The AI service page illustrates its demo with a pure SVG/CSS diagram that plays once. The only island is the simulated brief-to-draft demo (`src/components/showcase/`, `client:visible`), which must stay labelled as a simulation and send no data. Scroll reveals are progressive enhancement: content is visible without JavaScript; `prefers-reduced-motion` switches motion off.

### Design system

Tokens and shared classes live in `src/styles/global.css`: dark base, `.paper` light band, one accent `--signal` (green; `--signal-ink` is the text on it), Geist / Geist Mono. Use `.wrap`, `.section`, `.display`, `.section-title`, `.lede`, `.label`, `.quiet`, `.btn-*` instead of one-off styles. Product pages keep their own `--tone`.

### Service pages

`/wordpress`, `/ki-automatisierung`, `/webentwicklung` and their `/en/` versions render `src/components/services/ServiceDetail.astro` from typed content in `src/lib/service-pages/`. `/leistungen` is the services hub and keeps the Stripe package funnel. `/en/grok-bot-wordpress` is a hand-written guide; its claims are logged in `docs/seo/grok-bot-wordpress-sources.md` and need re-verification when xAI or WordPress change. Never state prices for WordPress/AI work, client numbers or results that the repo cannot prove.

### Zustände

Zustände sind an je einer Stelle definiert; neue Übergänge dort ergänzen, nicht daneben:
- Auftragsstatus auf `/aenderung`: aus GitHub-Labels abgeleitet, `statusOf()` in `src/lib/pipeline.ts` (Vorrang: geschlossen > Rückfrage > Prüfung > in Arbeit > eingegangen). Labels in `LABELS`.
- Kundenstatus: `status` in `kunden.yaml` (`onboarding | vorschau | live | gekuendigt`), Schema in `src/lib/kunden-schema.ts`.
- Kontaktformular (DE/EN, Feld `service` aus `SERVICES` in `src/lib/lead-source.ts`): `idle | sending | error` in `src/components/ContactForm.astro`. Mit JS per `fetch`, Fehler inline mit erhaltenen Eingaben; ohne JS normaler POST. `/api/contact` antwortet bei Fehlern mit deutschem `text/plain`, bei Erfolg und Honeypot mit 303 auf `/danke` bzw. `/en/thanks`; Fehlertexte in der Sprache des Formulars.
- Onboarding-/Upload-Formulare: `idle | preparing | queued | sending` in `src/scripts/onboarding-form.ts`; aus `sending` führt nur die Zurück-Taste (bfcache).

### Scripts

- `scripts/device-mockup.mjs` — generates landing device mockup image.
- `scripts/shot.mjs` — screenshot utility.

### Tooling

- Biome (`biome.json`) for lint + format, 2-space indent, 100 line width, targets `src/**/*.{ts,tsx,js,mjs}`.
- Lighthouse CI config: `lighthouserc.json`.
- Analytics: Plausible (`analytics.rpcrate.com`, eingebunden in `src/layouts/Base.astro`) und Umami für Conversion-Events (`src/lib/umami.ts`, `src/components/Umami.astro`).
