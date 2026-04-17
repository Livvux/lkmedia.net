# lkmedia.net Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relaunch lkmedia.net as minimal, SEO-optimized, Apple-Style agency site on Astro 6.1, deployed to Dokploy, preserving top-traffic blog URLs.

**Architecture:** Astro 6.1 in `hybrid` mode with `@astrojs/node` adapter. SSG for all pages, SSR only for `/api/contact`. Content via Astro Content Collections + MDX. Tailwind v4. Deployed as Docker container on Dokploy, TLS via Traefik.

**Tech Stack:** Astro 6.1.7, Tailwind 4.2.2, @astrojs/mdx 5, @astrojs/sitemap 3, @astrojs/rss 4, @astrojs/node, Resend 6, Cloudflare Turnstile, Plausible, Biome 2.4, Playwright 1.59, Docker (Node 24 LTS).

**Spec:** `docs/superpowers/specs/2026-04-17-lkmedia-relaunch-design.md`

**Legacy repo (source of truth for migrated content):** `/Users/livvux/dev/lkmedia`

---

## Phase 0 — Repo Bootstrap

### Task 0.1: Initialize Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.node-version`

- [ ] **Step 1: Scaffold Astro with minimal template**

```bash
cd /Users/livvux/dev/lkmedia.net
pnpm create astro@latest . -- --template minimal --install --no-git --typescript strict --yes
```

- [ ] **Step 2: Pin to Node 24 LTS**

Create `.node-version`:
```
24
```

- [ ] **Step 3: Verify Astro version ≥ 6.1**

Run: `pnpm list astro`
Expected: `astro 6.1.x`. If lower, `pnpm add astro@latest`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: scaffold Astro 6.1 project"
```

---

### Task 0.2: Add core integrations

**Files:**
- Modify: `package.json`, `astro.config.mjs`

- [ ] **Step 1: Install integrations + adapter**

```bash
pnpm add @astrojs/mdx@latest @astrojs/sitemap@latest @astrojs/rss@latest @astrojs/node@latest
pnpm add -D @astrojs/check typescript
```

- [ ] **Step 2: Install Tailwind v4 (Astro Vite plugin)**

```bash
pnpm add tailwindcss@latest @tailwindcss/vite@latest
```

- [ ] **Step 3: Configure `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://lkmedia.net',
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx(), sitemap({ i18n: { defaultLocale: 'de', locales: { de: 'de-DE', en: 'en-US' } } })],
  vite: { plugins: [tailwindcss()] },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
```

- [ ] **Step 4: Create `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
               Inter, system-ui, sans-serif;
  --color-bg: #000;
  --color-fg: #fff;
  --color-muted: #86868b;
  --color-accent: #0071e3;
}

html { background: var(--color-bg); color: var(--color-fg); font-family: var(--font-sans); }
```

- [ ] **Step 5: Verify build runs**

Run: `pnpm build`
Expected: "Complete!" with `dist/` output.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add MDX, sitemap, rss, node adapter, tailwind v4"
```

---

### Task 0.3: Biome lint/format

**Files:**
- Create: `biome.json`
- Modify: `package.json`

- [ ] **Step 1: Install Biome**

```bash
pnpm add -D @biomejs/biome@latest
```

- [ ] **Step 2: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.12/schema.json",
  "files": { "includes": ["src/**/*.{ts,tsx,astro,mjs,js}"], "ignore": ["dist", ".astro", "node_modules"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```

- [ ] **Step 3: Add scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "biome check src",
    "format": "biome format --write src"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: add biome lint/format"
```

---

### Task 0.4: Playwright smoke tests setup

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
pnpm add -D @playwright/test@latest
pnpm exec playwright install chromium --with-deps
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 3: Create placeholder smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/lkmedia/i);
});
```

- [ ] **Step 4: Add test script to `package.json`**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: add playwright e2e setup"
```

---

## Phase 1 — Foundations (Layouts, SEO, i18n)

### Task 1.1: Content collection schemas

**Files:**
- Create: `src/content/config.ts`, `src/content/posts/de/.gitkeep`, `src/content/posts/en/.gitkeep`, `src/content/cases/.gitkeep`

- [ ] **Step 1: Define schemas**

`src/content/config.ts`:
```ts
import { defineCollection, z } from 'astro:content';

const postSchema = z.object({
  title: z.string().max(70),
  description: z.string().max(160),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  lang: z.enum(['de', 'en']),
  author: z.string().default('Lucas Kleipoedszus'),
  tags: z.array(z.string()).default([]),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
});

const caseSchema = z.object({
  title: z.string(),
  client: z.string(),
  niche: z.enum(['anwaelte', 'luxus-immobilien', 'privatkliniken', 'fintech', 'other']),
  summary: z.string(),
  heroImage: z.string(),
  pubDate: z.coerce.date(),
  featured: z.boolean().default(false),
});

export const collections = {
  posts: defineCollection({ type: 'content', schema: postSchema }),
  cases: defineCollection({ type: 'content', schema: caseSchema }),
};
```

- [ ] **Step 2: Run astro sync**

Run: `pnpm exec astro sync`
Expected: generates `.astro/` types, no schema errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: content collection schemas for posts and cases"
```

---

### Task 1.2: i18n helper

**Files:**
- Create: `src/lib/i18n.ts`

- [ ] **Step 1: Write test**

`tests/unit/i18n.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getLangFromUrl, pathFor, useTranslations } from '../../src/lib/i18n';

describe('i18n', () => {
  it('detects en from /en/...', () => expect(getLangFromUrl(new URL('https://x.dev/en/leistungen'))).toBe('en'));
  it('detects de default', () => expect(getLangFromUrl(new URL('https://x.dev/leistungen'))).toBe('de'));
  it('builds path for lang', () => {
    expect(pathFor('leistungen', 'de')).toBe('/leistungen');
    expect(pathFor('leistungen', 'en')).toBe('/en/leistungen');
  });
  it('translates keys', () => {
    const t = useTranslations('de');
    expect(t('nav.services')).toBe('Leistungen');
  });
});
```

- [ ] **Step 2: Install vitest**

```bash
pnpm add -D vitest
```

Add to `package.json`: `"test": "vitest run"`.

- [ ] **Step 3: Run test — expect FAIL**

Run: `pnpm test`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

`src/lib/i18n.ts`:
```ts
export type Lang = 'de' | 'en';

export const languages = { de: 'Deutsch', en: 'English' } as const;

export const ui = {
  de: {
    'nav.home': 'Start',
    'nav.services': 'Leistungen',
    'nav.cases': 'Cases',
    'nav.about': 'Über',
    'nav.contact': 'Kontakt',
    'nav.blog': 'Blog',
    'cta.start': 'Projekt starten',
    'cta.call': '15 min Call buchen',
  },
  en: {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.cases': 'Cases',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.blog': 'Blog',
    'cta.start': 'Start a project',
    'cta.call': 'Book a 15 min call',
  },
} as const;

export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/')[1];
  return seg === 'en' ? 'en' : 'de';
}

export function pathFor(path: string, lang: Lang): string {
  const clean = path.replace(/^\//, '');
  return lang === 'de' ? `/${clean}` : `/en/${clean}`;
}

export function useTranslations(lang: Lang) {
  return (key: keyof typeof ui['de']) => ui[lang][key] ?? ui.de[key];
}
```

- [ ] **Step 5: Run test — expect PASS**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: i18n helper with DE/EN translations"
```

---

### Task 1.3: SEO + Schema helpers

**Files:**
- Create: `src/lib/seo.ts`, `src/lib/schema.ts`

- [ ] **Step 1: Write `src/lib/seo.ts`**

```ts
import type { Lang } from './i18n';

export interface SeoProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  noindex?: boolean;
  lang: Lang;
  alternateUrls?: { de?: string; en?: string };
}

const SITE = 'https://lkmedia.net';
const DEFAULT_OG = `${SITE}/og/default.png`;

export function buildSeo(p: SeoProps) {
  return {
    title: `${p.title} · lkmedia`,
    description: p.description,
    canonical: p.canonical.startsWith('http') ? p.canonical : `${SITE}${p.canonical}`,
    ogImage: p.ogImage ?? DEFAULT_OG,
    noindex: p.noindex ?? false,
    lang: p.lang,
    alternateUrls: p.alternateUrls,
  };
}
```

- [ ] **Step 2: Write `src/lib/schema.ts`**

```ts
export const organization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'lkmedia',
  url: 'https://lkmedia.net',
  logo: 'https://lkmedia.net/logo.svg',
  founder: { '@type': 'Person', name: 'Lucas Kleipoedszus' },
  email: 'lk@lucaskleipoedszus.com',
  sameAs: ['https://github.com/livvux'],
});

export const professionalService = () => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'lkmedia — Premium Web Development & SEO',
  areaServed: 'DE',
  priceRange: '€€€€',
  url: 'https://lkmedia.net',
});

export const blogPosting = (post: {
  title: string; description: string; pubDate: Date; updatedDate?: Date;
  author: string; image?: string; url: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  datePublished: post.pubDate.toISOString(),
  dateModified: (post.updatedDate ?? post.pubDate).toISOString(),
  author: { '@type': 'Person', name: post.author },
  image: post.image,
  mainEntityOfPage: post.url,
});

export const faqPage = (items: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
});

export const breadcrumbs = (crumbs: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url,
  })),
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/seo.ts src/lib/schema.ts
git commit -m "feat: SEO + schema.org helpers"
```

---

### Task 1.4: Seo component + Base layout

**Files:**
- Create: `src/components/Seo.astro`, `src/layouts/Base.astro`

- [ ] **Step 1: Create `src/components/Seo.astro`**

```astro
---
import type { SeoProps } from '../lib/seo';
import { buildSeo } from '../lib/seo';
const props: SeoProps = Astro.props;
const seo = buildSeo(props);
const { alternateUrls } = seo;
---
<title>{seo.title}</title>
<meta name="description" content={seo.description} />
<link rel="canonical" href={seo.canonical} />
{seo.noindex && <meta name="robots" content="noindex,nofollow" />}
<meta property="og:title" content={seo.title} />
<meta property="og:description" content={seo.description} />
<meta property="og:image" content={seo.ogImage} />
<meta property="og:url" content={seo.canonical} />
<meta property="og:type" content="website" />
<meta property="og:locale" content={seo.lang === 'de' ? 'de_DE' : 'en_US'} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={seo.title} />
<meta name="twitter:description" content={seo.description} />
<meta name="twitter:image" content={seo.ogImage} />
{alternateUrls?.de && <link rel="alternate" hreflang="de" href={alternateUrls.de} />}
{alternateUrls?.en && <link rel="alternate" hreflang="en" href={alternateUrls.en} />}
<link rel="alternate" hreflang="x-default" href={alternateUrls?.de ?? seo.canonical} />
```

- [ ] **Step 2: Create `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import Seo from '../components/Seo.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import { organization } from '../lib/schema';
import type { SeoProps } from '../lib/seo';

interface Props { seo: SeoProps; jsonLd?: unknown[]; }
const { seo, jsonLd = [] } = Astro.props as Props;
const allLd = [organization(), ...jsonLd];
---
<!doctype html>
<html lang={seo.lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <Seo {...seo} />
    <script type="application/ld+json" set:html={JSON.stringify(allLd)} />
    <script defer data-domain="lkmedia.net" src="https://plausible.io/js/script.js"></script>
  </head>
  <body class="min-h-screen flex flex-col bg-black text-white antialiased">
    <Nav lang={seo.lang} />
    <main class="flex-1"><slot /></main>
    <Footer lang={seo.lang} />
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: Seo component + Base layout"
```

---

### Task 1.5: Nav + Footer + LangSwitch

**Files:**
- Create: `src/components/Nav.astro`, `src/components/Footer.astro`, `src/components/LangSwitch.astro`

- [ ] **Step 1: `Nav.astro`**

```astro
---
import { useTranslations, pathFor, type Lang } from '../lib/i18n';
import LangSwitch from './LangSwitch.astro';
interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);
const items = [
  { href: pathFor('leistungen', lang), label: t('nav.services') },
  { href: pathFor('cases', lang), label: t('nav.cases') },
  { href: pathFor('blog', lang), label: t('nav.blog') },
  { href: pathFor('ueber', lang), label: t('nav.about') },
  { href: pathFor('kontakt', lang), label: t('nav.contact') },
];
---
<header class="sticky top-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10">
  <nav class="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
    <a href={pathFor('', lang)} class="font-semibold tracking-tight">lkmedia</a>
    <ul class="hidden md:flex gap-6 text-sm text-white/80">
      {items.map((i) => <li><a href={i.href} class="hover:text-white">{i.label}</a></li>)}
    </ul>
    <LangSwitch lang={lang} />
  </nav>
</header>
```

- [ ] **Step 2: `LangSwitch.astro`**

```astro
---
import type { Lang } from '../lib/i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const other: Lang = lang === 'de' ? 'en' : 'de';
const currentPath = Astro.url.pathname;
const targetPath = lang === 'de'
  ? `/en${currentPath === '/' ? '' : currentPath}`
  : currentPath.replace(/^\/en/, '') || '/';
---
<a href={targetPath} class="text-xs uppercase tracking-wider text-white/60 hover:text-white">
  {other}
</a>
```

- [ ] **Step 3: `Footer.astro`**

```astro
---
import { pathFor, type Lang } from '../lib/i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="border-t border-white/10 text-sm text-white/60">
  <div class="max-w-6xl mx-auto px-4 py-10 flex flex-wrap gap-6 justify-between">
    <div>© {year} lkmedia · Lucas Kleipoedszus</div>
    <ul class="flex gap-6">
      <li><a href={pathFor('imprint', lang)}>Impressum</a></li>
      <li><a href={pathFor('datenschutz', lang)}>Datenschutz</a></li>
    </ul>
  </div>
</footer>
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Nav, Footer, LangSwitch"
```

---

## Phase 2 — Landing Page (Apple-Style)

### Task 2.1: Hero section

**Files:**
- Create: `src/components/landing/Hero.astro`

- [ ] **Step 1: Implement**

```astro
---
interface Props { headline: string; sub: string; ctaHref: string; ctaLabel: string }
const { headline, sub, ctaHref, ctaLabel } = Astro.props;
---
<section class="relative min-h-[92vh] flex items-center justify-center px-6 text-center overflow-hidden">
  <div class="max-w-4xl">
    <h1 class="text-[clamp(2.5rem,7vw,6rem)] font-semibold tracking-tight leading-[1.05]">
      {headline}
    </h1>
    <p class="mt-6 text-lg md:text-2xl text-white/70">{sub}</p>
    <a href={ctaHref} class="inline-flex mt-10 h-12 px-6 items-center rounded-full bg-white text-black font-medium hover:bg-white/90 transition">
      {ctaLabel} →
    </a>
  </div>
  <div aria-hidden="true" class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest">SCROLL</div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/Hero.astro
git commit -m "feat(landing): Hero section"
```

---

### Task 2.2: ScrollDevice (sticky Mockup)

**Files:**
- Create: `src/components/landing/ScrollDevice.astro`

- [ ] **Step 1: Implement**

```astro
---
interface Props { image: string; alt: string }
const { image, alt } = Astro.props;
---
<section class="relative">
  <div class="sticky top-0 h-screen flex items-center justify-center">
    <img src={image} alt={alt} width="1200" height="750"
      class="max-w-[80vw] max-h-[70vh] object-contain device-scroll" loading="lazy" decoding="async" />
  </div>
  <div class="h-[150vh]" aria-hidden="true"></div>
</section>

<style>
@supports (animation-timeline: view()) {
  .device-scroll {
    animation: deviceZoom linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 50%;
  }
  @keyframes deviceZoom {
    from { transform: scale(0.85); opacity: 0.6; }
    to   { transform: scale(1);   opacity: 1; }
  }
}
@media (prefers-reduced-motion: reduce) {
  .device-scroll { animation: none; }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/ScrollDevice.astro
git commit -m "feat(landing): ScrollDevice sticky mockup"
```

---

### Task 2.3: ValueCards + NicheTiles + Process + CTABlock

**Files:**
- Create: `src/components/landing/ValueCards.astro`, `NicheTiles.astro`, `Process.astro`, `CTABlock.astro`, `SocialProof.astro`, `CaseTeaser.astro`

- [ ] **Step 1: `ValueCards.astro`**

```astro
---
interface Card { title: string; metric: string; body: string }
interface Props { items: Card[] }
const { items } = Astro.props;
---
<section class="py-32 px-6">
  <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
    {items.map((c) => (
      <article class="rounded-3xl bg-white/5 border border-white/10 p-8">
        <div class="text-5xl font-semibold tracking-tight">{c.metric}</div>
        <h3 class="mt-6 text-xl font-medium">{c.title}</h3>
        <p class="mt-2 text-white/60">{c.body}</p>
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 2: `NicheTiles.astro`**

```astro
---
interface Tile { href: string; label: string; image: string }
interface Props { items: Tile[] }
const { items } = Astro.props;
---
<section class="py-32 px-6">
  <h2 class="text-center text-4xl md:text-6xl font-semibold tracking-tight mb-16">Für wen wir bauen.</h2>
  <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
    {items.map((t) => (
      <a href={t.href} class="group relative aspect-[4/5] rounded-3xl overflow-hidden">
        <img src={t.image} alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div class="absolute bottom-0 p-8 text-2xl font-semibold">{t.label} →</div>
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 3: `CaseTeaser.astro`**

```astro
---
import { getCollection } from 'astro:content';
interface Props { lang: 'de' | 'en' }
const { lang } = Astro.props;
const cases = (await getCollection('cases', (c) => c.data.featured)).slice(0, 3);
---
<section class="py-32 px-6">
  <h2 class="max-w-6xl mx-auto text-4xl md:text-6xl font-semibold tracking-tight mb-16">Ausgewählte Projekte.</h2>
  <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
    {cases.map((c) => (
      <a href={`/${lang === 'de' ? '' : 'en/'}cases/${c.slug}`} class="group">
        <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5">
          <img src={c.data.heroImage} alt={c.data.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        </div>
        <div class="mt-4 text-lg font-medium">{c.data.title}</div>
        <div class="text-sm text-white/50">{c.data.client}</div>
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 4: `Process.astro`**

```astro
---
interface Step { n: string; title: string; body: string }
interface Props { items: Step[] }
const { items } = Astro.props;
---
<section class="py-32 px-6 border-y border-white/10">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-4xl md:text-6xl font-semibold tracking-tight mb-16">So arbeiten wir.</h2>
    <ol class="grid md:grid-cols-4 gap-6">
      {items.map((s) => (
        <li>
          <div class="text-white/30 text-sm font-mono">{s.n}</div>
          <div class="mt-2 text-xl font-medium">{s.title}</div>
          <div class="mt-2 text-white/60 text-sm">{s.body}</div>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- [ ] **Step 5: `SocialProof.astro`**

```astro
---
interface Testimonial { quote: string; author: string; role: string }
interface Props { logos: string[]; testimonials: Testimonial[] }
const { logos, testimonials } = Astro.props;
---
<section class="py-32 px-6">
  <div class="max-w-6xl mx-auto">
    <ul class="flex flex-wrap gap-10 items-center justify-center opacity-70">
      {logos.map((l) => <li><img src={l} alt="" height="40" class="h-10 w-auto" loading="lazy" /></li>)}
    </ul>
    <div class="mt-20 grid md:grid-cols-2 gap-10">
      {testimonials.map((t) => (
        <figure>
          <blockquote class="text-2xl font-medium leading-snug">"{t.quote}"</blockquote>
          <figcaption class="mt-4 text-sm text-white/60">{t.author} · {t.role}</figcaption>
        </figure>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 6: `CTABlock.astro`**

```astro
---
interface Props { headline: string; formHref: string; calHref: string; formLabel: string; calLabel: string }
const { headline, formHref, calHref, formLabel, calLabel } = Astro.props;
---
<section class="min-h-[70vh] flex items-center justify-center px-6 text-center bg-black border-t border-white/10">
  <div class="max-w-3xl">
    <h2 class="text-4xl md:text-6xl font-semibold tracking-tight">{headline}</h2>
    <div class="mt-10 flex flex-wrap gap-4 justify-center">
      <a href={formHref} class="inline-flex h-12 px-6 items-center rounded-full bg-white text-black font-medium">{formLabel}</a>
      <a href={calHref} class="inline-flex h-12 px-6 items-center rounded-full border border-white/30 font-medium">{calLabel}</a>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/landing
git commit -m "feat(landing): value cards, niche tiles, case teaser, process, social proof, CTA"
```

---

### Task 2.4: Landing page DE + EN

**Files:**
- Create: `src/pages/index.astro`, `src/pages/en/index.astro`

- [ ] **Step 1: DE landing**

`src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/landing/Hero.astro';
import ScrollDevice from '../components/landing/ScrollDevice.astro';
import ValueCards from '../components/landing/ValueCards.astro';
import NicheTiles from '../components/landing/NicheTiles.astro';
import CaseTeaser from '../components/landing/CaseTeaser.astro';
import Process from '../components/landing/Process.astro';
import SocialProof from '../components/landing/SocialProof.astro';
import CTABlock from '../components/landing/CTABlock.astro';
import { professionalService } from '../lib/schema';

const seo = {
  title: 'Premium-Websites, die Mandate gewinnen',
  description: 'lkmedia baut Apple-Grade Websites für Kanzleien, Luxus-Immobilien und Privatkliniken — mit perfektem SEO und Lighthouse 100.',
  canonical: '/',
  lang: 'de' as const,
  alternateUrls: { de: 'https://lkmedia.net/', en: 'https://lkmedia.net/en/' },
};
---
<Base seo={seo} jsonLd={[professionalService()]}>
  <Hero
    headline="Premium-Websites, die Mandate gewinnen."
    sub="Apple-Grade Design. Lighthouse 100. Mandats-Fokus."
    ctaHref="/kontakt" ctaLabel="Projekt starten" />
  <ScrollDevice image="/landing/device.avif" alt="Kundenprojekt Mockup" />
  <ValueCards items={[
    { title: 'Performance', metric: '<1s', body: 'LCP unter einer Sekunde auf 4G.' },
    { title: 'Design', metric: 'A+', body: 'Apple-Grade Typografie, Whitespace, Feinschliff.' },
    { title: 'SEO', metric: '100', body: 'Lighthouse perfekt, E-E-A-T-konform, AI-Overview-ready.' },
  ]} />
  <NicheTiles items={[
    { href: '/anwaelte', label: 'Kanzleien', image: '/landing/niche-law.avif' },
    { href: '/luxus-immobilien', label: 'Luxus-Immobilien', image: '/landing/niche-realestate.avif' },
    { href: '/privatkliniken', label: 'Privatkliniken', image: '/landing/niche-clinic.avif' },
  ]} />
  <CaseTeaser lang="de" />
  <Process items={[
    { n: '01', title: 'Brief', body: 'Kickoff, Ziele, Zielgruppe, KPIs.' },
    { n: '02', title: 'Design', body: 'Konzept, Figma-Prototyp, Copy.' },
    { n: '03', title: 'Build', body: 'Astro, Code, Content, Performance.' },
    { n: '04', title: 'Launch', body: 'Deploy, Search Console, Monitoring.' },
  ]} />
  <SocialProof logos={[]} testimonials={[]} />
  <CTABlock headline="Bereit für mehr Mandate?"
    formHref="/kontakt" calHref="/kontakt#termin"
    formLabel="Projekt starten" calLabel="15 min Call" />
</Base>
```

- [ ] **Step 2: EN landing**

`src/pages/en/index.astro` — mirror of DE with English copy, `lang: 'en'`, `canonical: '/en/'`, alternate URLs swapped.

- [ ] **Step 3: Visual-check dev build**

Run: `pnpm dev` in background, then `ssh macmini "agent-browser --session-name lkmedia-dev open http://localhost:4321"` (or local agent-browser). Screenshot.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: landing pages DE + EN"
```

---

## Phase 3 — Pages (Services, Cases, Niches, About)

### Task 3.1: Leistungen (Services)

**Files:**
- Create: `src/pages/leistungen.astro`, `src/pages/en/leistungen.astro`

- [ ] **Step 1: Build page**

Structure: Hero (section-title), 3 service sections (Website, SEO, Conversion), Pricing hint, CTA. Use Tailwind primitives from landing.

- [ ] **Step 2: Commit**

```bash
git commit -am "feat: services pages DE + EN"
```

---

### Task 3.2: Case Study index + detail

**Files:**
- Create: `src/pages/cases/index.astro`, `src/pages/cases/[slug].astro`, `src/content/cases/{legal-firm,luxury-realestate,premium-optik}.mdx`

- [ ] **Step 1: Write 3 seed case studies**

Migrate content from `/Users/livvux/dev/lkmedia/content/posts/case-study-*.mdx`, normalize frontmatter to match `caseSchema`.

- [ ] **Step 2: Create index page** — `getCollection('cases')` sorted by pubDate desc, grid layout.

- [ ] **Step 3: Create detail page** — `getStaticPaths` + MDX render, Breadcrumb Schema, Article Schema.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat: case studies index + detail pages"
```

---

### Task 3.3: Niche landing pages

**Files:**
- Create: `src/pages/anwaelte.astro`, `src/pages/luxus-immobilien.astro`, `src/pages/privatkliniken.astro`, `src/pages/en/anwaelte.astro`, `src/pages/en/luxus-immobilien.astro`
- Create: `src/components/FaqBlock.astro`

- [ ] **Step 1: Build `FaqBlock.astro`** — accepts `items: {q, a}[]`, renders `<details>` + injects `FAQPage` JSON-LD.

```astro
---
import { faqPage } from '../lib/schema';
interface Props { items: { q: string; a: string }[] }
const { items } = Astro.props;
---
<section class="py-24 px-6 max-w-3xl mx-auto">
  {items.map((i) => (
    <details class="border-b border-white/10 py-4 group">
      <summary class="cursor-pointer text-lg font-medium flex justify-between">
        {i.q} <span class="text-white/40 group-open:rotate-45 transition">+</span>
      </summary>
      <div class="mt-3 text-white/70">{i.a}</div>
    </details>
  ))}
</section>
<script type="application/ld+json" set:html={JSON.stringify(faqPage(items))} />
```

- [ ] **Step 2: Niche page template** (apply to all 3 DE + 2 EN):
  Hero → Pain-Points (3 cards) → Solution Features → Related Case → FAQ → CTA. Each niche gets distinct headline + target keyword in H1 matching spec §6.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: niche landing pages (Anwälte, Luxus-Immobilien, Privatkliniken)"
```

---

### Task 3.4: Ueber (About) page

**Files:**
- Create: `src/pages/ueber.astro`, `src/pages/en/about.astro`

- [ ] **Step 1: Build page** — Portrait photo, bio, credentials (E-E-A-T), `Person` JSON-LD.

- [ ] **Step 2: Commit**

```bash
git commit -am "feat: about page DE + EN"
```

---

## Phase 4 — Contact + Lead API

### Task 4.1: ContactForm component

**Files:**
- Create: `src/components/ContactForm.astro`

- [ ] **Step 1: Build form**

```astro
---
import { useTranslations, type Lang } from '../lib/i18n';
interface Props { lang: Lang }
const { lang } = Astro.props;
const t = useTranslations(lang);
const turnstileKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
---
<form method="POST" action="/api/contact" class="space-y-4 max-w-xl">
  <input type="text" name="website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />
  <label class="block">
    <span class="text-sm text-white/60">Name</span>
    <input required name="name" class="mt-1 w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-white focus:outline-none" />
  </label>
  <label class="block">
    <span class="text-sm text-white/60">E-Mail</span>
    <input required type="email" name="email" class="mt-1 w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10" />
  </label>
  <label class="block">
    <span class="text-sm text-white/60">Firma</span>
    <input name="company" class="mt-1 w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10" />
  </label>
  <label class="block">
    <span class="text-sm text-white/60">Budget</span>
    <select name="budget" class="mt-1 w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10">
      <option>25–50k</option><option>50–100k</option><option>100k+</option><option>unklar</option>
    </select>
  </label>
  <label class="block">
    <span class="text-sm text-white/60">Nachricht</span>
    <textarea required name="message" rows="5" class="mt-1 w-full p-4 rounded-xl bg-white/5 border border-white/10"></textarea>
  </label>
  <div class="cf-turnstile" data-sitekey={turnstileKey}></div>
  <button class="h-12 px-6 rounded-full bg-white text-black font-medium">{t('cta.start')}</button>
</form>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ContactForm.astro
git commit -m "feat: contact form with honeypot + Turnstile"
```

---

### Task 4.2: /api/contact endpoint (SSR)

**Files:**
- Create: `src/pages/api/contact.ts`

- [ ] **Step 1: Install Resend**

```bash
pnpm add resend@latest
```

- [ ] **Step 2: Write endpoint**

```ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token: string | null, ip: string | null) {
  if (!TURNSTILE_SECRET) return true;
  if (!token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip ?? '' }),
  });
  const data = (await r.json()) as { success: boolean };
  return data.success;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const form = await request.formData();
  if (form.get('website')) return new Response('ok', { status: 200 });
  const token = form.get('cf-turnstile-response')?.toString() ?? null;
  if (!(await verifyTurnstile(token, clientAddress))) {
    return new Response('captcha failed', { status: 400 });
  }
  const name = String(form.get('name') ?? '').slice(0, 120);
  const email = String(form.get('email') ?? '').slice(0, 120);
  const company = String(form.get('company') ?? '').slice(0, 120);
  const budget = String(form.get('budget') ?? '');
  const message = String(form.get('message') ?? '').slice(0, 5000);
  if (!name || !email || !message) return new Response('missing fields', { status: 400 });
  await resend.emails.send({
    from: 'lkmedia.net <no-reply@lkmedia.net>',
    to: 'lk@lucaskleipoedszus.com',
    replyTo: email,
    subject: `Projektanfrage: ${name} (${budget})`,
    text: `Name: ${name}\nEmail: ${email}\nFirma: ${company}\nBudget: ${budget}\n\n${message}`,
  });
  return Response.redirect(new URL('/danke', request.url), 303);
};
```

- [ ] **Step 3: Add env example**

Create `.env.example`:
```
RESEND_API_KEY=
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: /api/contact endpoint with Resend + Turnstile"
```

---

### Task 4.3: Kontakt page + CalEmbed + Danke page

**Files:**
- Create: `src/pages/kontakt.astro`, `src/pages/en/contact.astro`, `src/pages/danke.astro`, `src/components/CalEmbed.astro`

- [ ] **Step 1: `CalEmbed.astro`** (lazy, click-to-load)

```astro
---
interface Props { calLink: string }
const { calLink } = Astro.props;
---
<div id="cal-target" class="mt-6">
  <button id="cal-load" class="h-12 px-6 rounded-full border border-white/30">15 min Call buchen</button>
</div>
<script type="module" define:vars={{ calLink }}>
  document.getElementById('cal-load')?.addEventListener('click', async () => {
    const { default: Cal } = await import('https://app.cal.com/embed/embed.js');
    Cal('init', { origin: 'https://app.cal.com' });
    Cal('inline', { elementOrSelector: '#cal-target', calLink });
  });
</script>
```

- [ ] **Step 2: Kontakt page** combines `ContactForm` + `CalEmbed`. Danke page = simple success message + link back.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: kontakt page with form + Cal.com embed + danke"
```

---

## Phase 5 — Blog + Content Migration

### Task 5.1: Migrate top-10 posts

**Files:**
- Create: `src/content/posts/de/*.mdx` (7 DE posts) + `src/content/posts/en/*.mdx` (3 EN posts)
- Create: `public/posts/*` (hero images from legacy)

- [ ] **Step 1: Write migration script**

`scripts/migrate-posts.mjs`:
```js
import fs from 'node:fs/promises';
import path from 'node:path';

const MAP = [
  { src: 'real-debrid-review-multi-hoster-downloader.mdx', lang: 'de', slug: 'real-debrid-review-multi-hoster-downloader' },
  { src: 'ki-coding-modelle-ranking-swe-bench-2025.mdx', lang: 'de', slug: 'ki-coding-modelle-ranking-swe-bench-2025' },
  { src: 'rankmath-einstellungen-2025.mdx', lang: 'de', slug: 'rankmath-einstellungen-2025' },
  { src: 'e-mails-schreiben-mit-chatgpt.mdx', lang: 'de', slug: 'e-mails-schreiben-mit-chatgpt' },
  { src: 'marketing-ideen-fahrschule.mdx', lang: 'de', slug: 'marketing-ideen-fahrschule' },
  { src: 'ki-davinci-resolve-videos-auto-cutten.mdx', lang: 'de', slug: 'ki-davinci-resolve-videos-auto-cutten' },
  { src: 'lohnt-sich-immoscout-plus.mdx', lang: 'de', slug: 'lohnt-sich-immoscout-plus' },
  { src: 'immoscout-plus-tenant-plus-is-worth-it.mdx', lang: 'en', slug: 'immoscout-plus-tenant-plus-is-worth-it' },
  { src: 'earn-money-by-selling-fivem-scripts.mdx', lang: 'en', slug: 'earn-money-by-selling-fivem-scripts' },
];
const LEGACY = '/Users/livvux/dev/lkmedia/content/posts';
for (const { src, lang, slug } of MAP) {
  const from = path.join(LEGACY, src);
  const to = path.join('src/content/posts', lang, `${slug}.mdx`);
  const content = await fs.readFile(from, 'utf8');
  const normalized = content.replace(/^---[\s\S]*?---/, (m) => m.replace(/date:/, 'pubDate:') + `\nlang: ${lang}`);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.writeFile(to, normalized);
  console.log(`${src} → ${to}`);
}
```

Run: `node scripts/migrate-posts.mjs`

- [ ] **Step 2: Manually fix each post's frontmatter**

For each migrated file: verify `title`, `description`, `pubDate`, `lang`, `tags`; remove any legacy-only fields; add `ogImage` pointing to `/posts/<slug>.jpg`.

- [ ] **Step 3: Validate with astro sync**

Run: `pnpm exec astro sync`
Expected: no Zod errors. Fix any reported.

- [ ] **Step 4: Copy post images**

```bash
cp /Users/livvux/dev/lkmedia/public/posts/*.{jpg,webp,avif} public/posts/ 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: migrate top-10 blog posts from legacy"
```

---

### Task 5.2: Blog index + post pages — URL-stable

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/en/blog/index.astro`, `src/pages/en/blog/[slug].astro`
- Create: `src/pages/[slug].astro` (for DE posts using root-level URLs like `/lohnt-sich-immoscout-plus/`)
- Create: `src/pages/en/[slug].astro` (for EN posts like `/en/immoscout-plus-tenant-plus-is-worth-it/`)
- Create: `src/layouts/Post.astro`

- [ ] **Step 1: Route-mapping rule**

Legacy top-URLs dictate routing per-post. Add `route` field to post frontmatter (optional enum: `blog` or `root`):

Update `src/content/config.ts` postSchema:
```ts
route: z.enum(['blog', 'root']).default('blog'),
```

Set `route: 'root'` in: `lohnt-sich-immoscout-plus`, `e-mails-schreiben-mit-chatgpt`, `marketing-ideen-fahrschule`, `ki-davinci-resolve-videos-auto-cutten`, `immoscout-plus-tenant-plus-is-worth-it`, `earn-money-by-selling-fivem-scripts`.

- [ ] **Step 2: `Post.astro` layout** — breadcrumbs, article wrapper, author box, related, `BlogPosting` + `BreadcrumbList` JSON-LD.

- [ ] **Step 3: `src/pages/blog/[slug].astro`**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import Post from '../../layouts/Post.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', (p) => p.data.lang === 'de' && p.data.route === 'blog' && !p.data.draft);
  return posts.map((p) => ({ params: { slug: p.slug }, props: { post: p } }));
}
const { post } = Astro.props;
const { Content } = await post.render();
---
<Post post={post}><Content /></Post>
```

- [ ] **Step 4: `src/pages/[slug].astro`** — same but filter `route === 'root'` and `lang === 'de'`.

- [ ] **Step 5: EN variants** — filter `lang === 'en'`.

- [ ] **Step 6: Build + verify URLs**

Run: `pnpm build`
Expected: `/blog/real-debrid-review-multi-hoster-downloader/`, `/lohnt-sich-immoscout-plus/`, `/en/immoscout-plus-tenant-plus-is-worth-it/`, etc. all in `dist/`.

- [ ] **Step 7: Commit**

```bash
git commit -am "feat: blog index + stable post URLs (blog/ and root)"
```

---

### Task 5.3: Blog index grid

**Files:**
- Modify: `src/pages/blog/index.astro`, `src/pages/en/blog/index.astro`

- [ ] **Step 1: Implement DE index**

```astro
---
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';
const posts = (await getCollection('posts', (p) => p.data.lang === 'de' && !p.data.draft))
  .sort((a, b) => +b.data.pubDate - +a.data.pubDate);
const seo = { title: 'Blog', description: 'Artikel zu SEO, Webentwicklung und Marketing.', canonical: '/blog/', lang: 'de' as const };

function urlFor(p: typeof posts[number]) {
  return p.data.route === 'root' ? `/${p.slug}/` : `/blog/${p.slug}/`;
}
---
<Base seo={seo}>
  <section class="py-32 px-6 max-w-4xl mx-auto">
    <h1 class="text-4xl md:text-6xl font-semibold tracking-tight">Blog</h1>
    <ul class="mt-16 divide-y divide-white/10">
      {posts.map((p) => (
        <li class="py-6">
          <a href={urlFor(p)} class="group block">
            <div class="text-xs text-white/40">{p.data.pubDate.toISOString().slice(0, 10)}</div>
            <div class="text-2xl font-medium mt-1 group-hover:underline">{p.data.title}</div>
            <div class="text-white/60 mt-1">{p.data.description}</div>
          </a>
        </li>
      ))}
    </ul>
  </section>
</Base>
```

- [ ] **Step 2: EN variant**

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: blog index DE + EN"
```

---

## Phase 6 — SEO Infrastructure

### Task 6.1: RSS feed

**Files:**
- Create: `src/pages/rss.xml.ts`, `src/pages/en/rss.xml.ts`

- [ ] **Step 1: Implement**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL }) {
  const posts = (await getCollection('posts', (p) => p.data.lang === 'de' && !p.data.draft));
  return rss({
    title: 'lkmedia Blog',
    description: 'SEO, Webentwicklung, Marketing.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.pubDate,
      description: p.data.description,
      link: p.data.route === 'root' ? `/${p.slug}/` : `/blog/${p.slug}/`,
    })),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git commit -am "feat: RSS feeds DE + EN"
```

---

### Task 6.2: robots.txt + llms.txt

**Files:**
- Create: `src/pages/robots.txt.ts`, `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`

- [ ] **Step 1: `robots.txt.ts`**

```ts
import type { APIRoute } from 'astro';
const body = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://lkmedia.net/sitemap-index.xml
`;
export const GET: APIRoute = () => new Response(body, { headers: { 'Content-Type': 'text/plain' } });
```

- [ ] **Step 2: `llms.txt.ts`**

```ts
import type { APIRoute } from 'astro';
const body = `# lkmedia

> Premium-Websites für Kanzleien, Luxus-Immobilien und Privatkliniken.

## Key Pages
- [Home](https://lkmedia.net/)
- [Leistungen](https://lkmedia.net/leistungen)
- [Anwälte](https://lkmedia.net/anwaelte)
- [Luxus-Immobilien](https://lkmedia.net/luxus-immobilien)
- [Kontakt](https://lkmedia.net/kontakt)

## Contact
- lk@lucaskleipoedszus.com
`;
export const GET: APIRoute = () => new Response(body, { headers: { 'Content-Type': 'text/plain' } });
```

- [ ] **Step 3: `llms-full.txt.ts`** — concatenates all posts' frontmatter + content as plain text for AI ingestion.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat: robots.txt, llms.txt, llms-full.txt"
```

---

### Task 6.3: OG-Image generator

**Files:**
- Create: `src/pages/og/[...slug].png.ts`

- [ ] **Step 1: Install Satori-based generator**

```bash
pnpm add satori sharp @resvg/resvg-js
```

- [ ] **Step 2: Implement endpoint**

```ts
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';

export const prerender = false;
const font = readFileSync('public/fonts/Inter-SemiBold.ttf');

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get('title') ?? 'lkmedia';
  const svg = await satori(
    { type: 'div', props: { style: { background: '#000', width: '100%', height: '100%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, fontFamily: 'Inter', padding: 80, textAlign: 'center' }, children: title } },
    { width: 1200, height: 630, fonts: [{ name: 'Inter', data: font, weight: 600, style: 'normal' }] }
  );
  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } });
};
```

- [ ] **Step 3: Download Inter font**

```bash
curl -L -o public/fonts/Inter-SemiBold.ttf https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf
```

- [ ] **Step 4: Wire up** — update `Seo.astro` default `ogImage = ${SITE}/og/default.png?title=...`.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: dynamic OG image generator (satori)"
```

---

### Task 6.4: Legacy URL redirects middleware

**Files:**
- Create: `src/middleware.ts`, `src/lib/redirects.ts`

- [ ] **Step 1: `src/lib/redirects.ts`** — exact-match legacy URLs → target.

```ts
export const exactRedirects: Record<string, string> = {
  '/tools/sora-downloader': '/blog',
  '/tools/sora-downloader/': '/blog',
};

const MIGRATED = new Set([
  '/', '/en/',
  '/leistungen', '/cases', '/blog', '/ueber', '/kontakt', '/danke',
  '/anwaelte', '/luxus-immobilien', '/privatkliniken',
  '/imprint', '/datenschutz',
  // top-10 migrated post slugs here, both /blog/... and /<slug>/ variants
]);

export function shouldCatchAll(pathname: string, allKnown: Set<string>): boolean {
  if (pathname.startsWith('/_') || pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/og/')) return false;
  if (pathname.endsWith('.xml') || pathname.endsWith('.txt') || pathname.endsWith('.ico')) return false;
  return !allKnown.has(pathname) && !allKnown.has(pathname.replace(/\/$/, ''));
}
```

- [ ] **Step 2: `src/middleware.ts`**

```ts
import { defineMiddleware } from 'astro:middleware';
import { exactRedirects } from './lib/redirects';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const path = ctx.url.pathname;
  const target = exactRedirects[path] ?? exactRedirects[path.replace(/\/$/, '')];
  if (target) return Response.redirect(new URL(target, ctx.url), 301);
  const res = await next();
  // Catch-all 404 → /blog for unknown legacy paths
  if (res.status === 404 && !path.startsWith('/api/') && !path.startsWith('/og/')) {
    return Response.redirect(new URL('/blog', ctx.url), 301);
  }
  return res;
});
```

- [ ] **Step 3: Test**

`tests/e2e/redirects.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
test('sora redirects', async ({ page }) => {
  const r = await page.goto('/tools/sora-downloader', { waitUntil: 'domcontentloaded' });
  expect(page.url()).toMatch(/\/blog\/?$/);
});
test('unknown legacy redirects to blog', async ({ page }) => {
  await page.goto('/some/old/legacy-path-xyz');
  expect(page.url()).toMatch(/\/blog\/?$/);
});
```

Run: `pnpm test:e2e`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat: legacy URL redirects middleware + catch-all → /blog"
```

---

### Task 6.5: Legal pages

**Files:**
- Create: `src/pages/imprint.astro`, `src/pages/datenschutz.astro`

- [ ] **Step 1: Paste legal text** (copy from legacy repo if present; else use German TMG/DSGVO template). Adjust to lkmedia contact data.

- [ ] **Step 2: Commit**

```bash
git commit -am "feat: imprint + datenschutz pages"
```

---

## Phase 7 — Performance + Validation

### Task 7.1: Lighthouse CI

**Files:**
- Create: `.github/workflows/ci.yml`, `lighthouserc.json`

- [ ] **Step 1: `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "dist",
      "url": ["http://localhost/", "http://localhost/leistungen", "http://localhost/anwaelte", "http://localhost/blog"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

- [ ] **Step 2: `.github/workflows/ci.yml`**

```yaml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: lighthouserc.json
          uploadArtifacts: true
```

- [ ] **Step 3: Commit**

```bash
git add .github lighthouserc.json
git commit -m "ci: GitHub Actions with typecheck, lint, build, test, lighthouse"
```

---

### Task 7.2: Local Lighthouse pass

- [ ] **Step 1: Build**

Run: `pnpm build`

- [ ] **Step 2: Preview + measure**

Run: `pnpm preview &`; `npx lighthouse http://localhost:4321/ --only-categories=performance,seo --chrome-flags='--headless'`

Expected: Performance ≥ 95, SEO ≥ 95. Fix any regressions (image sizes, preload, etc.).

- [ ] **Step 3: Browser verify via agent-browser**

```bash
agent-browser --session-name lkmedia open http://localhost:4321/
agent-browser screenshot --annotate
agent-browser errors
```

No console errors. Screenshot archived.

- [ ] **Step 4: Commit any fixes**

```bash
git commit -am "perf: Lighthouse pass ≥95 all categories"
```

---

## Phase 8 — Dockerfile + Dokploy Deploy

### Task 8.1: Multi-stage Dockerfile

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

- [ ] **Step 2: `.dockerignore`**

```
node_modules
.git
.astro
dist
.github
tests
docs
*.md
.env*
```

- [ ] **Step 3: Local build test**

Run: `docker build -t lkmedia:test . && docker run --rm -p 4321:4321 --env RESEND_API_KEY=test lkmedia:test`
Expected: server listening on 4321, curl returns HTML.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: multi-stage Dockerfile for Dokploy"
```

---

### Task 8.2: Dokploy app provisioning

**Files:**
- Create: `docs/deployment/dokploy.md`

- [ ] **Step 1: Create app via Dokploy MCP/API**

SSH or Dokploy API (use `dokploy` skill): create Application `lkmedia`, source = Git (this repo `main` branch), build-type = Dockerfile, port 4321.

- [ ] **Step 2: Set env vars in Dokploy**

```
RESEND_API_KEY=...
PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
PUBLIC_SITE_URL=https://lkmedia.net
```

(1Password `op read` if existing keys; else create.)

- [ ] **Step 3: Attach preview domain**

Dokploy domain `preview.lkmedia.net` → Traefik routes to app port 4321 with Let's Encrypt.

- [ ] **Step 4: Trigger first deploy**

Git push → Dokploy webhook → build + deploy. Verify `preview.lkmedia.net` serves the site.

- [ ] **Step 5: Document in `docs/deployment/dokploy.md`**

Record: app ID, env var names, domain, redeploy command.

- [ ] **Step 6: Commit**

```bash
git add docs/deployment
git commit -m "docs: Dokploy deployment guide"
```

---

### Task 8.3: DNS cutover

- [ ] **Step 1: Add production domain in Dokploy**

`lkmedia.net` (apex) + `www.lkmedia.net` (redirect to apex via Traefik middleware).

- [ ] **Step 2: Update DNS**

Change lkmedia.net A-record to Dokploy server IP. `www` CNAME → `lkmedia.net`. TTL low (300s) pre-change for faster rollback.

- [ ] **Step 3: Verify**

Wait for propagation (dig @1.1.1.1 lkmedia.net). Curl returns new site. SSL cert issued by Traefik.

- [ ] **Step 4: Smoke test key URLs via agent-browser**

```bash
agent-browser open https://lkmedia.net/
agent-browser open https://lkmedia.net/blog/real-debrid-review-multi-hoster-downloader
agent-browser open https://lkmedia.net/en/immoscout-plus-tenant-plus-is-worth-it/
agent-browser open https://lkmedia.net/tools/sora-downloader   # expect redirect to /blog
agent-browser errors
```

All return 200 / expected redirect, zero console errors.

- [ ] **Step 5: Restore TTL** to 3600.

---

### Task 8.4: Post-launch verifications

- [ ] **Step 1: GSC**
  - Verify property for `https://lkmedia.net` (likely already verified).
  - Submit `https://lkmedia.net/sitemap-index.xml`.
  - URL-Inspection for real-debrid post → "Indexiert".

- [ ] **Step 2: Plausible**
  - Add site in Plausible admin, verify script loads (no blocker).

- [ ] **Step 3: IndexNow ping**

```bash
curl "https://www.bing.com/indexnow?url=https://lkmedia.net/&key=<indexnow-key>"
```

- [ ] **Step 4: Monitor 7 days**
  - Daily GSC clicks/impressions delta for migrated URLs.
  - Plausible real-time for any sudden drops.
  - Rollback plan: revert DNS A-record to legacy host if traffic collapses.

- [ ] **Step 5: Archive legacy repo**

```bash
cd /Users/livvux/dev/lkmedia
git tag legacy-nextjs-2026-04 && git push origin legacy-nextjs-2026-04
# Once confirmed stable: shut down legacy container on its host.
```

---

## Acceptance Criteria

- `pnpm build && pnpm test && pnpm check && pnpm lint` all green.
- Lighthouse ≥ 95 on Performance, SEO, Accessibility, Best-Practices for: `/`, `/leistungen`, `/anwaelte`, `/blog`, one blog post.
- All 10 migrated post URLs return 200 with unchanged content body.
- `/tools/sora-downloader` → 301 → `/blog`.
- Unknown legacy path → 301 → `/blog`.
- `/sitemap-index.xml`, `/rss.xml`, `/robots.txt`, `/llms.txt` all served.
- Contact form submits, email arrives at `lk@lucaskleipoedszus.com`.
- Cal.com embed loads only after click.
- DE ↔ EN lang-switch preserves page when EN mirror exists, falls back to EN home otherwise.
- hreflang present on all bilingual pages.
