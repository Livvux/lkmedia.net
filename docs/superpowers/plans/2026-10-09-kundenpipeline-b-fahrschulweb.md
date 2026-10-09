# Kundenpipeline B – Template `Livvux/fahrschulweb` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein Website-Template für Fahrschulen (Template und Demo zugleich), aus dem ein Agent nach Runbook aus einer `kunde.yaml` in einem Lauf eine fertige Vorschau baut.

**Architecture:** Kopie von `Livvux/handwerkweb` (Astro 7, statisch, kein Client-Framework, Caddy-Docker, `pnpm validate`, Playwright + axe, CI). Alle Inhalte liegen in YAML/Markdown unter `src/content/`; Seiten liegen einmal unter `src/pages/[...lang]/` und werden für jede Sprache aus `fahrschule.yaml → sprachen` erzeugt (Deutsch ohne Präfix).

**Tech Stack:** Astro 7, Tailwind 4, `astro/zod`, `yaml`, `@lucide/astro`, Vitest, Playwright + `@axe-core/playwright`, Biome.

**Spec:** `lkmedia.net/docs/superpowers/specs/2026-10-09-kundenpipeline-design.md` (Teil 1, Teil 4 „Fahrschülerinnen und Fahrschüler“)

## Global Constraints

- Repo `Livvux/fahrschulweb`, privat, als GitHub-Template markiert; lokal `~/fahrschulweb`. Demo `https://fahrschule.lkmedia.net`.
- Keine externen Requests im Browser (Fonts lokal, keine Maps/Widgets/Analytics-Skripte); CSP aus handwerkweb-`Caddyfile` mit `form-action 'self' https://lkmedia.net`.
- Keine neuen Dependencies gegenüber handwerkweb.
- Sprachen: `de` (Pflicht, erstes Element), optional `en`, `tr`, `ro`, `ar`; `ar` mit `dir="rtl"`; nur CSS-Logical-Properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`), kein `ml-`/`mr-`/`left-`/`right-` in Komponenten.
- Ansprache: Fahrschul-Seiten sprechen Fahrschülerinnen und Fahrschüler mit **du** an (wie Patricks Fahrschule; Zielgruppe meist 16–25); per `fahrschule.yaml → ansprache: du | sie` (Default `du`) umschaltbar, UI-Texte je Variante in `i18n/de.yaml` (`de.du.*`/`de.sie.*` nur für die betroffenen Schlüssel). Impressum/Datenschutz neutral. Einfache Sprache, kurze Sätze, korrekte Umlaute.
- Formular-Vertrag mit lkmedia.net (`src/lib/fahrschule-forms.ts`, Plan A Task 9): Endpoint `https://lkmedia.net/api/fahrschule/<siteId>/anmeldung`, Felder `vorname`, `nachname`, `geburtsdatum`, `klasse`, `standort`, `telefon`, `email`, `nachricht`, `einwilligung=ja`, Honeypot `website`; Antwort-Redirects `/danke?f=anmeldung` und `/fehler?grund=<grund>&f=anmeldung` (`grund` ∈ `pflichtfelder|email|auswahl|alter|limit|versand`).
- Klassen-Enum exakt wie `KLASSEN` in `lkmedia.net/src/lib/fahrschulweb.ts`: `AM, Mofa, A1, A2, A, B, B196, B197, BE, C1, C1E, C, CE, D, L, T`.
- WCAG 2.2 AA auf allen Seiten in allen Sprachen; Lighthouse ≥ 95 in allen Kategorien auf der Demo.

## Review Focus

- Kurs, dessen `bis` heute ist → bleibt bis Tagesende (Europe/Berlin) sichtbar, nicht ab 00:00 UTC weg (Test in Task 3).
- Fahrschule mit nur einem Standort → keine Standort-Übersichtsseite mit einer einzigen Kachel, Navigation führt direkt zur Standortseite; Theorie-Seite ohne Standort-Umschalter (Test in Task 5).
- Klasse ohne `preise` → Preisseite zeigt „Preise auf Anfrage“ statt leerer Tabelle, Validierung meckert nicht (Test in Task 8).
- Sehr langer Fahrschulname / lange Kursnamen auf 320 px → kein horizontales Scrollen (Test in Task 9).
- Sprache `ar` aktiviert → Telefonnummern, Uhrzeiten und Preise bleiben in LTR-Reihenfolge lesbar (`dir="ltr"` an Zahlen-Spans) (Test in Task 4).

---

### Task 1: Repo aus handwerkweb anlegen und entrümpeln

**Files:**
- Create: `~/fahrschulweb` (Kopie), `README.md`
- Delete: handwerk-spezifisch – `src/content/{leistungen,referenzen,stellen}`, `src/content/betrieb.yaml`, `src/pages/{leistungen,referenzen,karriere,anfrage.astro,bewerbung.astro,einsatzgebiet.astro,ueber-uns.astro}`, `src/lib/{gewerke,jobs,betrieb,betrieb-schema}*`, `src/components/{AnfrageButton,ReferenzCard,FormTimer}.astro`
- Keep: `contrast.ts`, `hours.ts`, `path.ts`, `nav.ts`, `schema-org.ts` (wird in Task 7 umgebaut), `Base.astro`, `Header/Footer/Faq/Icon/OpeningHours/PageHeader`, `scripts/validate.ts` (Task 8), `tests/a11y.spec.ts`, `Dockerfile`, `Caddyfile`, CI

- [ ] **Step 1:** **Lucas fragen** und bestätigen lassen: `gh repo create Livvux/fahrschulweb --private --template Livvux/handwerkweb --clone` in `~`. Danach `gh api -X PATCH repos/Livvux/fahrschulweb -f is_template=true`.
- [ ] **Step 2:** Dateien laut Liste löschen, `package.json` `name: "fahrschulweb"`, `AGENTS.md` vorerst auf Kopfzeile + „wird in Task 10 geschrieben“ kürzen. `src/lib/hours.ts` + Test von docweb `feiertage.ts` + `feiertage.test.ts` übernehmen (Feiertage je Bundesland).
- [ ] **Step 3:** `pnpm install && pnpm check` – erwartete Fehler nur durch fehlende `betrieb`-Importe; diese Seiten/Komponenten auf einen Platzhalter `src/pages/index.astro` mit `<h1>fahrschulweb</h1>` reduzieren, bis `pnpm check && pnpm test && pnpm build` grün sind.
- [ ] **Step 4: Commit** `chore: fahrschulweb aus handwerkweb, Handwerk-Inhalte entfernt`

### Task 2: `fahrschule.yaml` – Schema, Loader, Demo-Daten

**Files:**
- Create: `src/lib/fahrschule-schema.ts`, `src/lib/fahrschule.ts`, `src/content/fahrschule.yaml`
- Test: `src/lib/fahrschule-schema.test.ts`

**Interfaces:**
- Produces:
  - `KLASSEN` (Enum, siehe Global Constraints), `SPRACHEN = ['de','en','tr','ro','ar'] as const`, `type Sprache`
  - `fahrschuleSchema` → `type Fahrschule` mit Feldern exakt laut Spec Teil 1 „Daten“; Slots wie `hours.ts` (`WeekHours`); `bundesland` = Kürzel aus `feiertage.ts`; `anmeldung` als discriminated union `z.discriminatedUnion('art', [{ art: 'link', url: z.url() }, { art: 'formular', siteId: /^[a-z0-9-]+$/, endpoint: z.url().default('https://lkmedia.net/api/fahrschule') }])`; `sprachen` min 1, erstes Element `de`, keine Duplikate; `standorte` min 1, `slug` eindeutig; `bewertungen.auswahl` max 6, `sterne` 1–5; `theme.primary` Hex; `geprueft` `YYYY-MM-DD` optional; `demo: boolean`; `ansprache: 'du' | 'sie'` (Default `du`; `t()` in Task 4 sucht bei Deutsch zuerst `<ansprache>.<key>`, dann `<key>`).
  - `fahrschule: Fahrschule` (geparst aus `src/content/fahrschule.yaml`, Fehler brechen den Build mit Pfad + Meldung).
- Demo-Daten: „Fahrschule Muster“, zwei Standorte (Rastatt, Baden-Baden; `bundesland: BW`), `sprachen: [de, en]`, `anmeldung: { art: formular, siteId: fahrschule-demo }`, Bewertungs-Snapshot mit 3 erfundenen, als Demo gekennzeichneten Zitaten, Recht mit „Angabe fehlt“-freien Musterwerten (Demo).
- [ ] **Step 1: Write the failing tests:** Demo-Datei parst; `sprachen: [en]` → Fehler „erste Sprache muss de sein“; doppelter Standort-Slug → Fehler; `anmeldung.art: link` ohne `url` → Fehler; 7 Bewertungen → Fehler.
- [ ] **Step 2:** `pnpm vitest run src/lib/fahrschule-schema.test.ts` → FAIL.
- [ ] **Step 3: Implement** Schema, Loader, Demo-YAML.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `feat: fahrschule.yaml mit Schema und Demo-Daten`

### Task 3: Collections Klassen, Kurse, Team, Fahrzeuge, FAQ

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/lib/kurse.ts`, `src/content/klassen/{b,be,b196,a,am}.md`, `src/content/kurse.yaml`, `src/content/team/*.md` (3), `src/content/fahrzeuge/*.md` (3), `src/content/faq.yaml`, Bilder unter `public/` (Platzhalter-Illustrationen als SVG, keine Fotos fremder Personen)
- Test: `src/lib/kurse.test.ts`

**Interfaces:**
- Produces:
  - Collections `klassen`, `team`, `fahrzeuge` (glob, Felder laut Spec Teil 1), `kurse` und `faq` (file-Loader). `klassen` Body = Erklärtext; Reihenfolge-Feld `reihenfolge` (Default 99).
  - `kommendeKurse(kurse: Kurs[], heute: Date): Kurs[]` – behält Kurse mit `bis >= heutigesDatum(Europe/Berlin)`, sortiert nach `von`.
  - `heutigesDatum(d: Date): string` (`YYYY-MM-DD` in Europe/Berlin).
- Übersetzte Inhalte: gleiche Collections lesen zusätzlich `src/content/<lang>/<collection>/**`; Eintrags-ID mit Sprachpräfix (`en/b`). Helper `inhalt(collection, lang)` in `src/lib/content.ts`: liefert Einträge der Sprache, Deutsch ohne Präfix.
- [ ] **Step 1: Write the failing tests:** `kommendeKurse` mit `bis` gestern → raus; `bis` heute bei `heute = 2026-10-09T22:30:00Z` (00:30 Berlin am 10.10.) → raus; `bis` heute bei `2026-10-09T21:00:00Z` (23:00 Berlin) → drin; Sortierung nach `von`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement**; Demo-Klassentexte aus Patricks Fahrschule (`/tmp/pf-inspect/src/data/licenseClasses.ts`, Repo `Livvux/patricks-fahrschule-astro`) übernehmen und sprachlich auf du/einfach glätten; keine Patricks-Eigennamen.
- [ ] **Step 4:** → PASS; `pnpm check` grün.
- [ ] **Step 5: Commit** `feat: Klassen, Kurse, Team, Fahrzeuge, FAQ als Inhalte`

### Task 4: Mehrsprachigkeit

**Files:**
- Create: `src/lib/i18n.ts`, `src/i18n/{de,en,tr,ro,ar}.yaml`, `src/content/en/**` (Demo-Übersetzung aller Inhalte)
- Modify: `src/layouts/Base.astro` (`lang`, `dir`, `hreflang`-Links), `Header.astro` (Sprachumschalter nur bei > 1 Sprache)
- Test: `src/lib/i18n.test.ts`

**Interfaces:**
- Produces:
  - `t(lang: Sprache, key: string): string` – fehlender Schlüssel wirft beim Build (`Error('i18n: <lang>.<key> fehlt')`).
  - `localePath(lang: Sprache, path: string): string` – `de` → `path`, sonst `/<lang>${path}`.
  - `langPaths(): { params: { lang: string | undefined }; props: { lang: Sprache } }[]` – für `getStaticPaths` aus `fahrschule.sprachen`.
  - `dirOf(lang): 'ltr' | 'rtl'`.
  - `fehlendeUebersetzungen(sprachen: Sprache[], root = 'src'): string[]` – vergleicht Schlüssel aller `i18n/<lang>.yaml` mit `de.yaml` und Dateien unter `content/<lang>/` mit den deutschen; von `validate` (Task 8) genutzt.
  - Komponente `Ltr.astro` (`<span dir="ltr">`) für Telefonnummern, Uhrzeiten, Preise, Daten.
- [ ] **Step 1: Write the failing tests:** `localePath('de','/klassen') === '/klassen'`, `localePath('en','/klassen') === '/en/klassen'`; `dirOf('ar') === 'rtl'`; Fixture mit fehlendem Schlüssel in `en.yaml` → `fehlendeUebersetzungen` nennt `en.yaml: <key>`; fehlende Datei `content/en/klassen/be.md` → genannt.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement**; `tr/ro/ar.yaml` vollständig übersetzt (UI-Texte), Inhalte nur für `en` in der Demo.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `feat: Mehrsprachigkeit mit RTL und Vollständigkeitsprüfung`

### Task 5: Seiten

**Files:**
- Create unter `src/pages/[...lang]/`: `index.astro`, `klassen/index.astro`, `klassen/[slug].astro`, `preise.astro`, `theorie-und-kurse.astro`, `standorte/index.astro`, `standorte/[slug].astro`, `team-und-fahrzeuge.astro`, `anmeldung.astro` (Task 6), `kontakt.astro`, `faq.astro`, `[legal].astro`, `danke.astro`, `fehler.astro`; `src/pages/404.astro`, `llms.txt.ts`, `robots.txt.ts`
- Create: `src/components/{KlasseCard,PreisTabelle,TheorieZeiten,KursListe,StandortCard,TeamCard,FahrzeugCard,Bewertungen,KontaktLeiste,BueroStatus}.astro`
- Modify: `src/lib/nav.ts` (Navigationseinträge aus Daten; Standorte bei genau einem Standort → direkt `/standorte/<slug>`)
- Test: `src/lib/nav.test.ts`, `tests/pages.spec.ts`

**Interfaces:**
- Consumes: `fahrschule`, `inhalt`, `kommendeKurse`, `t`, `localePath`, `langPaths`, `berlinNow`/Öffnungslogik aus `hours.ts` + `feiertage.ts`.
- Produces: `navItems(f: Fahrschule, lang: Sprache): { href: string; label: string }[]`.
- Inhalt je Seite (Fahrschülerinnen und Fahrschüler, „du“):
  - Start: Hero (Name, Slogan, Button „Jetzt anmelden“ + „Anrufen“), Klassen-Kacheln, nächste 3 Kurse, Standorte, Bewertungen (wenn Snapshot), FAQ-Auszug.
  - Klasse: Kurztext, Mindestalter, Voraussetzungen, Ablauf (nummeriert), Preise der Klasse, Anmelde-Button mit vorausgewählter Klasse (`?klasse=B`).
  - Preise: Tabelle je Klasse (Grundbetrag, Fahrstunde 45 Min., Sonderfahrt, Vorstellung Theorie/Praxis); ohne `preise` „Preise auf Anfrage“; Hinweis „Prüfungsgebühren von TÜV/DEKRA kommen dazu.“
  - Theorie & Kurse: Theoriezeiten je Standort (Tabelle), kommende Kurse; leer → „Gerade sind keine Ferien- oder Intensivkurse geplant. Frag gern nach.“
  - Standort: eigener `ortstext`, Adresse, Bürozeiten mit `BueroStatus` („Jetzt im Büro“ / „Heute geschlossen“ an Feiertagen), Theoriezeiten, Einzugsgebiet, Link zum Google-Profil (nur Link).
  - `KontaktLeiste`: mobil (`< md`) fixiert am unteren Rand, Anruf + WhatsApp (wenn gesetzt), ≥ 44 px, `padding-bottom` am `main`, damit nichts verdeckt wird.
- [ ] **Step 1: Write the failing tests:** `navItems` mit einem Standort → Eintrag zeigt auf `/standorte/rastatt`; mit zwei → `/standorte`. `tests/pages.spec.ts` (gegen `pnpm preview`): Startseite hat `h1` mit Demo-Namen; `/klassen/b` zeigt Preistabelle; `/preise` mit Fixture-Klasse ohne Preise zeigt „Preise auf Anfrage“; `/en/` hat `lang="en"`; Kontaktleiste bei 375 px sichtbar und verdeckt den Footer-Link „Impressum“ nicht (Element per `elementFromPoint` erreichbar).
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement** Seiten und Komponenten (Gestaltung: ruhig, kontrastreich, Akzent `theme.primary`, große Touch-Ziele; Layoutideen von Patricks Fahrschule, aber ohne deren Marke).
- [ ] **Step 4:** `pnpm build && pnpm playwright test tests/pages.spec.ts` → PASS.
- [ ] **Step 5: Commit** `feat: alle Seiten für Klassen, Preise, Theorie, Standorte, Team, Kontakt`

### Task 6: Anmeldung

**Files:**
- Create: `src/lib/anmeldung.ts`, `src/components/AnmeldeButton.astro`
- Modify: `src/pages/[...lang]/anmeldung.astro`, `danke.astro`, `fehler.astro`
- Test: `src/lib/anmeldung.test.ts`, Ergänzung `tests/pages.spec.ts`

**Interfaces:**
- Produces:
  - `ANMELDE_FELDER` (Feldnamen laut Vertrag in Global Constraints), `anmeldeZiel(f: Fahrschule): { art: 'link'; url: string } | { art: 'formular'; action: string }` – `action = \`${endpoint}/${siteId}/anmeldung\``; `PUBLIC_FORM_ENDPOINT` überschreibt `endpoint` (wie handwerkweb).
  - `FEHLER_TEXTE: Record<'pflichtfelder'|'email'|'auswahl'|'alter'|'limit'|'versand', string>` für `fehler.astro`, je mit Telefonnummer der Fahrschule als Ausweg.
  - `AnmeldeButton` Props `{ klasse?: string; variante?: 'primaer' | 'sekundaer' }` – bei `art: link` externer Link (`rel="noopener"`), sonst interner Link auf `/anmeldung?klasse=…`.
- Formular (bei `art: formular`): 7 sichtbare Felder (Vorname, Nachname, Geburtsdatum `type=date`, Klasse `select`, Standort `select` – bei einem Standort `hidden` + Text, Telefon `type=tel`, E-Mail `type=email`), Nachricht optional als aufklappbares `<details>`, Einwilligungs-Checkbox mit Link zur Datenschutzerklärung, Honeypot. `autocomplete`-Attribute (`given-name`, `family-name`, `bday`, `tel`, `email`). Hinweis „Telefon oder E-Mail genügt.“ Ohne JS voll funktionsfähig; `?klasse=` wählt vor (kleines Inline-Script, ohne JS bleibt Auswahl leer).
- Datenschutz-Text (`legal/datenschutz.md`): Abschnitt „Online-Anmeldung“ – Verarbeitung durch lkmedia als Auftragsverarbeiter, Übermittlung per E-Mail an die Fahrschule, keine Speicherung auf dem Server über den Versand hinaus; als `<!-- ENTWURF -->`.
- [ ] **Step 1: Write the failing tests:** `anmeldeZiel` für beide Arten; `PUBLIC_FORM_ENDPOINT` greift; e2e: Formular hat genau die Vertragsfeldnamen (Abgleich mit `ANMELDE_FELDER`), `action` = `https://lkmedia.net/api/fahrschule/fahrschule-demo/anmeldung`; `/fehler?grund=alter&f=anmeldung` zeigt den Alters-Text und die Telefonnummer.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** → PASS. Manuell: lkmedia.net-Dev (Plan A Task 9) auf 4321, `PUBLIC_FORM_ENDPOINT=http://localhost:4321/api/fahrschule pnpm dev`, Anmeldung absenden → Redirect `/danke?f=anmeldung` (SMTP im Dev über Mock oder echte Testadresse).
- [ ] **Step 5: Commit** `feat: Online-Anmeldung über lkmedia.net oder Link zur Fahrschulsoftware`

### Task 7: Strukturierte Daten und SEO-Endpunkte

**Files:**
- Modify: `src/lib/schema-org.ts`, `src/pages/llms.txt.ts`, `src/pages/robots.txt.ts`, `astro.config.mjs` (Sitemap mit `i18n`)
- Test: `src/lib/schema-org.test.ts`

**Interfaces:**
- Produces: `drivingSchool(f: Fahrschule, s: Standort, lang: Sprache): object` (`@type: 'DrivingSchool'`, `address`, `telephone`, `openingHoursSpecification` aus `buerozeiten`, `aggregateRating` nur wenn `bewertungen`, `url` = Standortseite), `faqPage(items)`, `breadcrumbs(items)`.
- [ ] **Step 1: Write the failing tests:** ohne `bewertungen` kein `aggregateRating`; Öffnungszeiten-Slots → `dayOfWeek` + `opens`/`closes`; ein `DrivingSchool` je Standort.
- [ ] **Step 2:** → FAIL. **Step 3: Implement.** **Step 4:** → PASS.
- [ ] **Step 5: Commit** `feat: DrivingSchool-JSON-LD je Standort, Sitemap mit hreflang, llms.txt`

### Task 8: `pnpm validate` für Fahrschulen

**Files:**
- Modify: `scripts/validate.ts`
- Create: `src/lib/svg-check.ts`, `src/lib/preise-check.ts`
- Test: `scripts/validate.test.ts`, `src/lib/svg-check.test.ts`, `src/lib/preise-check.test.ts`

**Interfaces:**
- Produces:
  - `isSafeSvg(text: string): boolean` – **identische Regel** wie `lkmedia.net/src/lib/uploads.ts` (Plan A Task 3): false bei `<script`, ` on\w+=`, `javascript:`, `<foreignObject`, externen `href`/`xlink:href`.
  - `preisFehler(klassen: { klasse: string; preise?: Preise }[]): string[]` – nur Klassen mit `preise` werden geprüft; Pflicht `grundbetrag`, `fahrstunde`, `sonderfahrt`, `vorstellungTheorie`, `vorstellungPraxis`. **Vor dem Implementieren** §32 FahrlG (Preisaushang/Preisangaben) im Wortlaut nachlesen (gesetze-im-internet.de) und die Pflichtfelder daran ausrichten; Abweichungen in einem Kommentar mit Quelle festhalten.
  - `validate` ergänzt (bei `demo: false`): Impressum enthält `erlaubnisbehoerde`-Wert; `preisFehler`; `fehlendeUebersetzungen` (Task 4); `bewertungen.stand` und `geprueft` ≤ 120 Tage alt; alle `public/**/*.svg` `isSafeSvg`; `anmeldung.url` beginnt mit `https://`; handwerkweb-Prüfungen (Kontrast, Muster-Inhalte, `ENTWURF`, „Angabe fehlt“, CSP-form-action) bleiben.
- [ ] **Step 1: Write the failing tests** je Regel mit Fixtures (`tests/fixtures/`): fehlende Fahrstunde → Fehler mit Klassenname; Klasse ohne `preise` → kein Fehler; SVG mit `onload` → Fehler mit Dateipfad; `stand` vor 121 Tagen → Fehler; Demo (`demo: true`) → diese Regeln still.
- [ ] **Step 2:** → FAIL. **Step 3: Implement.** **Step 4:** → PASS.
- [ ] **Step 5: Commit** `feat: validate prüft Preisangaben, Übersetzungen, Aktualität und SVG-Sicherheit`

### Task 9: Barrierefreiheit, Mobil, Performance

**Files:**
- Modify: `tests/a11y.spec.ts`, `playwright.config.ts`, `lighthouserc.json` (neu, falls nicht vorhanden – Schwellen 0.95)
- Test: `tests/a11y.spec.ts`, `tests/mobile.spec.ts`

- [ ] **Step 1: Write the failing tests:** a11y läuft bereits über alle Seiten aus `dist/` (inkl. `/en/`); zusätzlich Fixture-Build mit `sprachen: [de, ar]` (`FAHRSCHULE_YAML=tests/fixtures/fahrschule-ar.yaml pnpm build`, Loader liest die Variable) → `/ar/` hat `dir="rtl"`, Telefonnummer-Span hat `dir="ltr"`, axe ohne Verstöße. `tests/mobile.spec.ts`: bei 320 px Breite auf allen Seiten `document.documentElement.scrollWidth <= 320`, mit Fixture eines 60-Zeichen-Fahrschulnamens.
- [ ] **Step 2:** → FAIL (wo nötig). **Step 3:** Fehler beheben. **Step 4:** `pnpm build && pnpm test:a11y && pnpm playwright test tests/mobile.spec.ts` → PASS; `npx @lhci/cli autorun` auf `dist/` → alle Kategorien ≥ 0.95.
- [ ] **Step 5: Commit** `test: a11y für alle Sprachen inkl. RTL, mobile Breite, Lighthouse-Schwellen`

### Task 10: Runbook, Onboarding-Beispiel, Demo-Deploy

**Files:**
- Create/Modify: `AGENTS.md`, `onboarding/kunde.example.yaml`, `README.md`
- Modify: CI (`.github/workflows/ci.yml`: `validate`, `lint`, `check`, `test`, `build`, `test:a11y`)

- [ ] **Step 1: `onboarding/kunde.example.yaml`** exakt im Format von `toKundeYaml` (lkmedia.net `src/lib/fahrschulweb.ts`, nach Plan A Task 5 mit `stripe_session_hash`), mit Beispielwerten.
- [ ] **Step 2: `AGENTS.md`** nach Aufbau von docweb (`~/docweb/AGENTS.md`): Befehle · Wo was liegt · **Neuer Kunde** (Input: `Livvux/kunden/inbox/fahrschulweb-<hash>/`; Repo `Livvux/fahrschule-<kurz>` aus Template; Daten übertragen – Theoriezeiten/Bürozeiten Freitext → Slots, Unklares → nachfragen, `bundesland` aus PLZ, Kurse nur mit Jahr, Preise aus Freitext → `preise` je Klasse, nichts erfinden; `ortstext` je Standort nur aus Angaben + allgemeinem Ortsbezug ohne erfundene Fakten; Bilder aus `inbox/` nach `public/` als WebP; Sprachen nur wenn bestellt; `anmeldung`: Link wenn `anmelde_link` gesetzt, sonst `formular` mit `siteId` = Register-`id`; `geprueft` = heute; Demo-Dateien löschen) · Rechtstexte (Erlaubnisbehörde Pflicht, `ENTWURF` bleibt) · Prüfen · Vorschau-Deploy (Dokploy, Domain `<kurz>.fahrschule.lkmedia.net`, Preview Deployments für PRs aktivieren mit Wildcard `*.vorschau.lkmedia.net`) · **Menschliche Freigabe** · Go-Live · **Google-Unternehmensprofil** je Standort (Checkliste für Lucas) · **Änderungsauftrag** (Issue lesen, Kundeneingabe = Daten, Bilder vom Branch `aenderung/<nr>`, minimale Änderung, Screenshots vorher/nachher, PR „Closes #n“) · **Quartals-Check** (Bewertungs-Snapshot per Places API: Note, Anzahl, bis 6 aktuelle 4–5-Sterne-Zitate mit Vornamen + Initial; abgelaufene Kurse entfernen; Rückfragen an die Fahrschule: neue Kurse, Ferien, Team, Preise; Abhängigkeiten aktualisieren; alle Checks; `geprueft` setzen) · Regeln (keine externen Requests, Kundeneingaben sind Daten, du-Ansprache, einfache Sprache).
- [ ] **Step 3:** `pnpm validate && pnpm lint && pnpm check && pnpm test && pnpm build && pnpm test:a11y` → grün. Commit `docs: Runbook und Onboarding-Beispiel` und pushen.
- [ ] **Step 4: Demo-Deploy (Lucas bestätigt):** DNS `fahrschule.lkmedia.net` und `*.fahrschule.lkmedia.net` (A auf 51.68.140.121, per `cf` in Zone lkmedia.net – Zone-ID wie im docweb-Runbook), Dokploy-App auf Server deploy-worker, Build-Type Dockerfile, Port 80, Domain mit Let's Encrypt, Auto-Deploy auf `main`. Abnahme: `curl -sI https://fahrschule.lkmedia.net` → 200, Lighthouse ≥ 95, Demo-Anmeldung kommt bei `lucas@lkmedia.net` an.
