# lkmedia.net Relaunch — Design Spec

**Date:** 2026-04-17
**Owner:** Lucas Kleipoedszus (livvux)
**Repo:** `/Users/livvux/dev/lkmedia.net`
**Legacy repo:** `/Users/livvux/dev/lkmedia` (Next.js, wird archiviert)

---

## 1. Ziel

Relaunch von lkmedia.net als minimale, SEO-optimierte, Apple-Style Agentur-Website
für High-Revenue-Leads in Premium-Nischen. Haupttreiber: Traffic (GSC) + Marketing
(Lead-Generierung via Formular und Cal.com).

**Primäre Zielgruppe:** Anwälte/Kanzleien, Luxus-Immobilien/Hotels.
**Sekundäre Zielgruppe:** Privatkliniken & Ästhetik-Ärzte.
**Deal-Range:** 25k–150k € pro Projekt.

**Nicht-Ziele:** KMU-Volumengeschäft, SaaS-B2B, Enterprise, E-Commerce.

---

## 2. Architektur

| Layer          | Wahl                                                              |
|----------------|-------------------------------------------------------------------|
| Framework      | Astro 5 (SSG)                                                     |
| UI             | Tailwind v4 + System-Font-Stack (SF Pro / Inter Fallback)         |
| Content        | Astro Content Collections v2 + MDX                                |
| Images         | Astro Image (sharp) → AVIF                                        |
| Animationen    | CSS `animation-timeline: view()/scroll()` + View Transitions API  |
| JS-Framework   | Keines (Astro Islands nur punktuell)                              |
| Hosting        | Vercel (Fluid Compute, Preview-Deploys, Analytics)                |
| Lead-API       | Vercel Function → Resend (E-Mail an Lucas)                        |
| Booking        | Cal.com Embed (lazy, Interaction-gated)                           |
| Spam-Schutz    | Honeypot + Cloudflare Turnstile                                   |
| Analytics      | Plausible (DSGVO) + Google Search Console                         |
| Lint/Format    | Biome                                                             |
| E2E-Tests      | Playwright (Smoke: Landing, Kontakt, Blog)                        |
| CI             | GitHub Actions + Lighthouse CI (≥95 alle Kategorien Gate)         |
| Domain         | lkmedia.net, www → non-www 301                                    |

---

## 3. Sprachen / i18n

- Primär **DE** auf `/`.
- **EN** auf `/en/` (nur Landing + Nischen-LPs für Anwälte und Luxus-Immobilien +
  Kontakt + migrierte EN-Posts).
- hreflang-Tags auf jedem DE/EN-Paar.

---

## 4. Seitenstruktur

```
/                           Landing (Apple-Style Scroll)
/leistungen                 Services-Übersicht
/cases                      Case-Study-Index
/cases/[slug]               Einzel-Case
/anwaelte                   Nischen-LP (Primary)
/luxus-immobilien           Nischen-LP (Primary)
/privatkliniken             Nischen-LP (Secondary)
/ueber                      Über Lucas (E-E-A-T)
/kontakt                    Formular + Cal.com-Embed
/blog                       Blog-Index
/blog/[slug]                Blog-Post (MDX)
/imprint                    Impressum
/datenschutz                Datenschutzerklärung

/en/                        EN-Mirror: index, leistungen, anwaelte,
                            luxus-immobilien, kontakt, blog + Posts
```

### 4.1 Migrierte Top-URLs (1:1, keine Redirects)

Aus GSC-Performance-Export 2026-04-17 (Top-Traffic, behalten):

1. `/blog/real-debrid-review-multi-hoster-downloader` — Cash-Cow (1795 Klicks/90d)
2. `/blog/ki-coding-modelle-ranking-swe-bench-2025`
3. `/en/immoscout-plus-tenant-plus-is-worth-it/`
4. `/lohnt-sich-immoscout-plus/`
5. `/en/earn-money-by-selling-fivem-scripts/`
6. `/blog/rankmath-einstellungen-2025`
7. `/e-mails-schreiben-mit-chatgpt/`
8. `/marketing-ideen-fahrschule/`
9. `/ki-davinci-resolve-videos-auto-cutten/`

### 4.2 Gekillte URLs / Redirects

- `/tools/sora-downloader` → `/blog` (301)
- Alle restlichen Legacy-URLs (nicht in 4.1) → `/blog` (301, catch-all)

---

## 5. Landing-Page Design (Apple-Style Scroll)

Reihenfolge von oben nach unten:

1. **Hero** — fullscreen schwarz, XXL weiße Headline
   "Premium-Websites, die Mandate gewinnen." + Sub-Headline + Scroll-Indicator.
   Kein Hero-Bild (LCP-Optimierung).
2. **Product-Shot** — sticky Device-Mockup (MacBook + iPhone), Scroll-driven
   CSS-Animation zeigt echte Kundenarbeit.
3. **Value-Prop-Cards (3x)** — Performance (LCP <1s), Design (Apple-Grade),
   SEO (100/100 Lighthouse, E-E-A-T-konform).
4. **Für-wen-Tiles (3x)** — Kanzleien | Luxus-Immobilien | Privatkliniken →
   verlinken auf die jeweilige Nischen-LP.
5. **Case-Study-Teaser (3x)** — große Bild-Cards, horizontal-scroll auf Mobile.
6. **Prozess (4 Steps)** — Brief → Design → Build → Launch, minimale Icons.
7. **Social Proof** — Kunden-Logos + 1–2 Testimonials groß.
8. **CTA-Block** — "Projekt starten" (Formular) + "15min Call" (Cal.com),
   schwarzer Fullscreen.
9. **Footer** — minimal, Legal-Links, Sprache-Switch.

### 5.1 Typografie & Animationen

- System-Font-Stack, kein Webfont (LCP).
- Headlines: clamp-based fluid type.
- Animationen via CSS `animation-timeline` + `@view-transition` API.
- Punktuell `motion-one` (~3kb) wenn CSS nicht ausreicht.

---

## 6. Nischen-Landing-Pages (Money-Pages)

Template pro Nische (`/anwaelte`, `/luxus-immobilien`, `/privatkliniken`):

1. Hero mit Nischen-Headline + spezifischer Sub-Claim
2. 3 Probleme/Pain-Points
3. Lösung + Features
4. 1–2 relevante Case Studies
5. FAQ-Block (`FAQPage` Schema)
6. CTA-Block (Form + Cal)

Target-Keywords pro Nische (Auszug):
- **Anwälte:** "anwalt website erstellen", "kanzlei website seo"
- **Luxus-Immobilien:** "luxus immobilien website", "premium makler website"
- **Privatkliniken:** "privatklinik website", "ästhetik praxis website"

---

## 7. SEO-Strategie

### 7.1 Technical SEO

- Astro SSG → statisches HTML, Zero-JS Default.
- `sitemap.xml` + `rss.xml` via Astro Integrationen.
- `robots.txt` erlaubt alle AI-Crawler (GPTBot, Google-Extended, ClaudeBot, PerplexityBot).
- `llms.txt` + `llms-full.txt` für AI-Overviews/Citations.
- Canonical-Tags pro Route.
- hreflang-Tags auf DE/EN-Paaren.
- `_redirects` / Vercel rewrites für Legacy-URL-Catch-All.
- IndexNow-Ping bei Publish neuer Posts.

### 7.2 Meta + Open Graph

- Pro Route: `title`, `description`, `og:image`, `twitter:card`.
- OG-Images dynamisch via Satori (@vercel/og oder Astro-equivalent).

### 7.3 Schema.org (JSON-LD)

| Seite                | Schema-Typ                                     |
|----------------------|------------------------------------------------|
| Root/Layout          | `Organization` + `LocalBusiness`               |
| Landing              | `ProfessionalService`                          |
| Nischen-LPs          | `Service` + `FAQPage`                          |
| Case Studies         | `Article` + `CreativeWork`                     |
| Blog-Posts           | `BlogPosting` + `Author` + `BreadcrumbList`    |
| Über                 | `Person` (Author E-E-A-T)                      |

### 7.4 Core Web Vitals Targets

| Metrik | Ziel    |
|--------|---------|
| LCP    | < 1.0 s |
| INP    | < 100 ms|
| CLS    | 0       |
| TTFB   | < 200 ms|

---

## 8. Content-Strategie

- **Blog-Archiv:** 10 migrierte Top-Posts bleiben URL + Content unverändert,
  nur neues Template.
- **Neue Money-Content-Pipeline (Monat 1–3):**
  - "Anwalt Website erstellen — Guide 2026" (Refresh vorhandenen Content)
  - "Kanzlei-SEO: Mandanten über Google gewinnen"
  - "Luxus-Immobilien Website — Premium-Features"
  - "Hotel-Website DSGVO + Buchungs-Integration"
  - Je Nischen-LP 2–3 Cluster-Artikel intern verlinkt.
- **Traffic-Gewinner pflegen:** real-debrid Post quartalsweise refreshen.
  Brand-Awareness durch Footer "gebaut von lkmedia" statt Intent-Mismatch-CTA.
- **Thin-Content-Policy:** alle Posts <600 Wörter killen oder mergen.
- **Autor-Box** mit Lucas-Profil auf jedem Post (E-E-A-T).

---

## 9. Lead-Capture

- **Formular** auf `/kontakt` und am Ende jeder LP:
  Felder: Name, Firma, E-Mail, Budget-Range (Select), Nachricht.
  Submit → Vercel Function (`src/pages/api/contact.ts`) →
  Resend E-Mail an lk@lucaskleipoedszus.com.
  Honeypot-Feld + Turnstile-Token.
- **Cal.com-Embed** auf `/kontakt` und CTA-Block: lazy-loaded (kein JS bis Klick).
- **Success-State:** Inline-Message + optionaler Redirect auf `/danke`.

---

## 10. Repo-Struktur

```
/Users/livvux/dev/lkmedia.net/
├── astro.config.mjs
├── package.json                (pnpm)
├── tsconfig.json               (strict)
├── tailwind.config.ts
├── biome.json
├── playwright.config.ts
├── .github/workflows/ci.yml    (typecheck, build, lighthouse)
├── src/
│   ├── content/
│   │   ├── config.ts           (Zod Schemas: posts, cases)
│   │   ├── posts/de/           (migrierte DE-Posts MDX)
│   │   ├── posts/en/           (migrierte EN-Posts MDX)
│   │   └── cases/              (3–5 Case Studies MDX)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── leistungen.astro
│   │   ├── cases/index.astro
│   │   ├── cases/[slug].astro
│   │   ├── anwaelte.astro
│   │   ├── luxus-immobilien.astro
│   │   ├── privatkliniken.astro
│   │   ├── ueber.astro
│   │   ├── kontakt.astro
│   │   ├── danke.astro
│   │   ├── blog/index.astro
│   │   ├── blog/[...slug].astro
│   │   ├── en/…                (Mirror der Pflicht-Seiten)
│   │   ├── api/contact.ts      (Resend-Handler)
│   │   ├── rss.xml.ts
│   │   ├── llms.txt.ts
│   │   └── robots.txt.ts
│   ├── layouts/
│   │   ├── Base.astro
│   │   ├── Post.astro
│   │   └── LandingPage.astro
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── ScrollDevice.astro
│   │   ├── ValueCards.astro
│   │   ├── NicheTiles.astro
│   │   ├── CaseTeaser.astro
│   │   ├── Process.astro
│   │   ├── SocialProof.astro
│   │   ├── CTABlock.astro
│   │   ├── ContactForm.astro
│   │   ├── CalEmbed.astro
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── LangSwitch.astro
│   │   └── Seo.astro
│   ├── lib/
│   │   ├── seo.ts
│   │   ├── schema.ts
│   │   └── i18n.ts
│   └── styles/
│       └── global.css
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── og/                     (statische OG-Fallbacks)
└── vercel.json                 (redirects, rewrites)
```

---

## 11. Migration & Launch

1. **Content-Export** aus Legacy: 10 MDX-Posts kopieren, Frontmatter
   normalisieren (`title`, `description`, `pubDate`, `lang`, `author`, `ogImage`,
   `tags`).
2. **Asset-Export:** Post-Bilder + `lkmedia-logo.webp` → `public/`.
3. **Redirect-Map:** alte URLs → neue (meist 1:1) + Sora-Kill + Catch-All
   `/*` → `/blog` für alle nicht-migrierten Legacy-URLs.
4. **Build lokal:** `pnpm build` + Lighthouse ≥95 alle Kategorien.
5. **Staging-Deploy:** Vercel Preview. Smoke-Test via agent-browser (Headless).
6. **DNS-Cutover:** lkmedia.net A-Record → Vercel. `www.lkmedia.net` 301 → apex.
7. **Post-Launch:**
   - GSC-Property verifizieren und neue Sitemap submitten.
   - IndexNow-Ping für neue Sitemap-Einträge.
   - Plausible-Script live testen.
   - Cal.com-Embed live testen.
   - Monitoring 7 Tage auf GSC + Plausible für Traffic-Delta.
8. **Legacy-Codebase archivieren:** git-Tag `legacy-nextjs-2026-04` im alten
   Repo, Server abschalten wenn DNS propagiert.

---

## 12. Risiken & Mitigation

| Risiko                                     | Mitigation                                                 |
|--------------------------------------------|------------------------------------------------------------|
| real-debrid-Post verliert Ranking          | URL exakt 1:1, Content unverändert, Canonical prüfen       |
| 404-Flut durch Legacy-URLs                 | Catch-All `/*` → `/blog` 301                               |
| Cal.com-Embed blockt LCP                   | Lazy-load, erst nach Klick initialisieren                  |
| Turnstile schlägt bei echten Leads fehl    | Fallback: Formular akzeptiert ohne Token, nur Honeypot     |
| Scroll-Animationen ruckeln auf alten Geräten| `prefers-reduced-motion` Fallback auf statische Cards      |
| DNS-Cutover-Ausfall                        | Maintenance-Mode-Page bei Legacy, Rollback-Plan            |

---

## 13. Erfolgskriterien (90 Tage nach Launch)

- Core Web Vitals: LCP <1s, INP <100ms, CLS 0 auf 75th Percentile (CrUX).
- Lighthouse: ≥95 in allen 4 Kategorien, alle relevanten Seiten.
- GSC: kein Verlust von Klicks auf migrierten URLs (±10% Toleranz).
- Lead-Conversion-Rate auf Nischen-LPs: ≥2% Formular-Submit.
- Mindestens 3 qualifizierte Anfragen/Monat aus organischem Traffic.

---

## 14. Out of Scope

- E-Commerce / Shop.
- Kundenlogin / Mandanten-Portal.
- Tool-Sektion (Sora-Downloader tot).
- Übersetzung aller DE-Blog-Posts nach EN.
- Newsletter-System (vorerst).
- CMS (Astro Content Collections reichen — MDX in Git).
