# handwerkweb (Teil A: lkmedia.net) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zentraler Formular-Endpoint für Handwerker-Websites plus Produktseite `/handwerk` mit Stripe-Onboarding auf lkmedia.net.

**Architecture:** Kunden-Sites (statisch) posten `multipart/form-data` an `POST /api/handwerk/:siteId/(anfrage|bewerbung)`. Ein serverseitiges Register bestimmt Empfänger und erlaubte Origins; reine Funktionen parsen/validieren, ein injizierbarer Handler entscheidet Status/Redirect, `nodemailer` versendet per SMTP (AWS SES Mail Manager). Die Produktstrecke `/handwerk` kopiert das docweb-Muster (Payment Link → Onboarding → `kunde.yaml` per Mail).

**Tech Stack:** Astro 6 (Node standalone), TypeScript, Vitest, nodemailer 10, Biome.

**Spec:** `docs/superpowers/specs/2026-10-07-handwerkweb-design.md`

## Global Constraints

- Package manager pnpm, Node >= 22.12.0; Lint `pnpm lint` (Biome, 2 Spaces, 100 Zeichen), `pnpm check`, `pnpm test`.
- Preis: `1.990 €` einmalig + `69 €` / Monat inkl. USt., 12 Monate Mindestlaufzeit, danach monatlich kündbar.
- Demo-URL: `https://handwerk.lkmedia.net`. Produktname: `handwerkweb`.
- SMTP nur über Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM` (Default `lkmedia.net <no-reply@lkmedia.net>`). Niemals Zugangsdaten committen (`.env` ist gitignored).
- docweb und `/api/contact` bleiben auf Resend – nicht anfassen außer der `checkSession`-Verallgemeinerung.
- Empfänger-Adresse und Redirect-Ziel kommen **nur** aus dem Register, nie aus Formularfeldern.
- Keine Speicherung von Anfragen/Bewerbungen.
- Texte Deutsch, Sie-Form, korrekte Umlaute.
- Uploads: max. 5 Dateien, max. 15 MB gesamt; Bilder `image/jpeg|png|webp|heic|heif`, Bewerbung zusätzlich `application/pdf`.

## Review Focus

1. Cross-Origin-POST von `https://handwerk.lkmedia.net` muss durchkommen, obwohl Astro `security.checkOrigin` solche Posts standardmäßig mit 403 blockt; gleichzeitig müssen alle *anderen* POST-Routen (Kontakt, docweb-Onboarding) weiter CSRF-geschützt sein → Task 1 testet beides.
2. `siteId` wie `__proto__`/`constructor` darf keinen Treffer im Register liefern → Task 2 testet das.
3. Formular ohne JavaScript (kein `dauer`-Feld) darf nicht als Bot verworfen werden → Task 3 testet das.
4. Leere Datei-Inputs (Browser schickt `File` mit `size 0`) dürfen nicht als Upload zählen oder am Typ scheitern → Task 3 testet das.
5. SMTP-Fehler darf den Absender nicht auf „Danke“ schicken (Daten wären still verloren) → Task 4 testet Redirect auf `/fehler?grund=versand`.

---

### Task 1: Eigener CSRF-Check statt Astro `checkOrigin`

Astro blockt jeden Cross-Site-Form-POST auf On-Demand-Routen (`node_modules/astro/dist/core/app/middlewares.js`). Wir schalten das ab und prüfen selbst – mit `x-forwarded-*`-bewusstem Origin (läuft hinter Traefik) und einer Ausnahme für `/api/handwerk/`, das Origins gegen das Register prüft.

**Files:**
- Create: `src/lib/csrf.ts`
- Modify: `astro.config.mjs` (in `defineConfig` ergänzen)
- Modify: `src/middleware.ts` (Anfang von `onRequest`)
- Test: `tests/unit/csrf.test.ts`

**Interfaces:**
- Produces: `isBlockedCrossSitePost(input: { method: string; contentType: string | null; origin: string | null; selfOrigin: string; path: string }): boolean`

- [ ] **Step 1: Failing test schreiben**

```ts
// tests/unit/csrf.test.ts
import { describe, expect, it } from 'vitest';
import { isBlockedCrossSitePost } from '../../src/lib/csrf';

const base = {
  method: 'POST',
  contentType: 'application/x-www-form-urlencoded',
  origin: 'https://evil.example',
  selfOrigin: 'https://lkmedia.net',
  path: '/api/contact',
};

describe('isBlockedCrossSitePost', () => {
  it('blockt fremde Form-POSTs', () => expect(isBlockedCrossSitePost(base)).toBe(true));
  it('blockt fremde multipart-POSTs', () =>
    expect(isBlockedCrossSitePost({ ...base, contentType: 'multipart/form-data; boundary=x' })).toBe(true));
  it('blockt POST ohne Origin', () => expect(isBlockedCrossSitePost({ ...base, origin: null })).toBe(true));
  it('erlaubt same-origin', () =>
    expect(isBlockedCrossSitePost({ ...base, origin: 'https://lkmedia.net' })).toBe(false));
  it('erlaubt GET', () => expect(isBlockedCrossSitePost({ ...base, method: 'GET' })).toBe(false));
  it('erlaubt JSON (kein Formular, CORS greift)', () =>
    expect(isBlockedCrossSitePost({ ...base, contentType: 'application/json' })).toBe(false));
  it('lässt /api/handwerk/ durch (prüft Origins selbst)', () =>
    expect(isBlockedCrossSitePost({ ...base, path: '/api/handwerk/demo/anfrage' })).toBe(false));
});
```

- [ ] **Step 2: Test laufen lassen – muss fehlschlagen**

Run: `pnpm vitest run tests/unit/csrf.test.ts`
Expected: FAIL – `Cannot find module '../../src/lib/csrf'`

- [ ] **Step 3: Implementierung**

```ts
// src/lib/csrf.ts
// Ersetzt Astros security.checkOrigin (abgeschaltet in astro.config.mjs): gleiche Regel, aber mit
// Proxy-bewusstem Origin und Ausnahme für den Handwerker-Endpoint, der Origins selbst prüft.
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const FORM_TYPES = ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"];
const OWN_ORIGIN_CHECK = ["/api/handwerk/"];

export function isBlockedCrossSitePost(i: {
  method: string;
  contentType: string | null;
  origin: string | null;
  selfOrigin: string;
  path: string;
}): boolean {
  if (SAFE_METHODS.includes(i.method)) return false;
  if (OWN_ORIGIN_CHECK.some((p) => i.path.startsWith(p))) return false;
  const ct = i.contentType?.toLowerCase();
  if (ct && !FORM_TYPES.some((t) => ct.includes(t))) return false;
  return i.origin !== i.selfOrigin;
}
```

- [ ] **Step 4: Test laufen lassen – muss bestehen**

Run: `pnpm vitest run tests/unit/csrf.test.ts`
Expected: PASS (7 Tests)

- [ ] **Step 5: In Config und Middleware einbauen**

`astro.config.mjs` – in `defineConfig({ … })` nach `prefetch` ergänzen:

```js
  // Eigener CSRF-Check in src/middleware.ts (Proxy-Origin + Handwerker-Endpoint), siehe src/lib/csrf.ts.
  security: { checkOrigin: false },
```

`src/middleware.ts` – Import ergänzen und am Anfang von `onRequest` nach `const origin = …` einfügen:

```ts
import { isBlockedCrossSitePost } from "./lib/csrf";
```

```ts
  if (
    !ctx.isPrerendered &&
    isBlockedCrossSitePost({
      method: ctx.request.method,
      contentType: ctx.request.headers.get("content-type"),
      origin: ctx.request.headers.get("origin"),
      selfOrigin: origin,
      path,
    })
  ) {
    return new Response("Cross-site form submissions are forbidden", { status: 403 });
  }
```

- [ ] **Step 6: Gesamtcheck + Commit**

Run: `pnpm test && pnpm lint && pnpm check`
Expected: alles grün.

```bash
git add src/lib/csrf.ts tests/unit/csrf.test.ts astro.config.mjs src/middleware.ts
git commit -m "feat: proxy-aware CSRF check replacing astro checkOrigin"
```

---

### Task 2: Site-Register

**Files:**
- Create: `src/lib/handwerk-sites.ts`
- Test: `tests/unit/handwerk-sites.test.ts`

**Interfaces:**
- Produces: `interface HandwerkSite { name: string; email: string; origins: string[]; plzPraefixe: string[] }`, `HANDWERK_SITES: Record<string, HandwerkSite>`, `DEV_ORIGINS: string[]`, `findSite(id: string): HandwerkSite | undefined`, `allowedOrigins(site: HandwerkSite, dev: boolean): string[]`

- [ ] **Step 1: Failing test**

```ts
// tests/unit/handwerk-sites.test.ts
import { describe, expect, it } from 'vitest';
import { allowedOrigins, findSite } from '../../src/lib/handwerk-sites';

describe('findSite', () => {
  it('findet die Demo', () => expect(findSite('demo')?.origins).toContain('https://handwerk.lkmedia.net'));
  it('unbekannt → undefined', () => expect(findSite('gibtsnicht')).toBeUndefined());
  it('Prototyp-Schlüssel treffen nicht', () => {
    expect(findSite('__proto__')).toBeUndefined();
    expect(findSite('constructor')).toBeUndefined();
    expect(findSite('toString')).toBeUndefined();
  });
});

describe('allowedOrigins', () => {
  it('ohne dev nur Register-Origins', () =>
    expect(allowedOrigins(findSite('demo')!, false)).toEqual(['https://handwerk.lkmedia.net']));
  it('mit dev zusätzlich localhost', () =>
    expect(allowedOrigins(findSite('demo')!, true)).toContain('http://localhost:4321'));
});
```

- [ ] **Step 2: Test – FAIL** (`pnpm vitest run tests/unit/handwerk-sites.test.ts`, Modul fehlt)

- [ ] **Step 3: Implementierung**

```ts
// src/lib/handwerk-sites.ts
// handwerkweb – Register der Kunden-Websites. Neuer Kunde = ein Eintrag (siehe handwerkweb/AGENTS.md).
// Empfänger und erlaubte Origins kommen nur von hier, nie aus dem Formular (sonst offenes Mail-Relay).

export interface HandwerkSite {
  name: string;
  email: string;
  origins: string[];
  /** PLZ-Anfänge des Einsatzgebiets; Anfragen außerhalb werden im Betreff markiert, nicht blockiert. */
  plzPraefixe: string[];
}

export const HANDWERK_SITES: Record<string, HandwerkSite> = {
  demo: {
    name: "Muster Haustechnik (Demo)",
    email: "lucas@lkmedia.net",
    origins: ["https://handwerk.lkmedia.net"],
    plzPraefixe: ["762", "764", "765", "772"],
  },
};

/** Template-Dev-Server (astro dev / preview). */
export const DEV_ORIGINS = ["http://localhost:4321", "http://localhost:4322"];

export function findSite(id: string): HandwerkSite | undefined {
  return Object.hasOwn(HANDWERK_SITES, id) ? HANDWERK_SITES[id] : undefined;
}

export function allowedOrigins(site: HandwerkSite, dev: boolean): string[] {
  return dev ? [...site.origins, ...DEV_ORIGINS] : site.origins;
}
```

- [ ] **Step 4: Test – PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/handwerk-sites.ts tests/unit/handwerk-sites.test.ts
git commit -m "feat(handwerk): site registry for form endpoint"
```

---

### Task 3: Formular-Parser (Anfrage, Bewerbung, Dateien, Bot-Check)

**Files:**
- Create: `src/lib/handwerk-forms.ts`
- Test: `tests/unit/handwerk-forms.test.ts`

**Interfaces:**
- Produces:
  - `ANLIEGEN`, `OBJEKTART`, `ZEITRAHMEN`, `ERFAHRUNG` (readonly string-Tupel – das Template nutzt exakt diese Werte)
  - `MAX_FILES = 5`, `MAX_TOTAL_BYTES = 15 * 1024 * 1024`
  - `interface Attachment { filename: string; contentType: string; content: Buffer }`
  - `interface MailContent { subject: string; text: string; replyTo?: string; attachments: Attachment[] }`
  - `type Grund = "pflichtfelder" | "plz" | "email" | "auswahl" | "dateien"`
  - `type FormResult = { ok: true; mail: MailContent } | { ok: false; grund: Grund }`
  - `isBot(f: FormData): boolean`
  - `parseAnfrage(f: FormData, plzPraefixe: string[]): Promise<FormResult>`
  - `parseBewerbung(f: FormData): Promise<FormResult>`

Feldnamen (Vertrag mit dem Template): Anfrage – `anliegen, plz, ort, objektart, baujahr, zeitrahmen, beschreibung, fotos (multiple), name, telefon, email, rueckruf ("ja"), erreichbarkeit`; Bewerbung – `stelle, name, telefon, email, erfahrung, fuehrerschein ("ja"|"nein"), nachricht, lebenslauf`; beide – `website` (Honeypot), `dauer` (ms, von Inline-Script gesetzt).

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/handwerk-forms.test.ts
import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_BYTES, isBot, parseAnfrage, parseBewerbung } from '../../src/lib/handwerk-forms';

type Val = string | File | (string | File)[];
function fd(fields: Record<string, Val>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
  return f;
}
const img = (name = 'bad.jpg', size = 10, type = 'image/jpeg') => new File([new Uint8Array(size)], name, { type });
const emptyFile = () => new File([], '', { type: 'application/octet-stream' });

const anfrage = (o: Record<string, Val> = {}) =>
  fd({
    anliegen: 'Heizungstausch',
    plz: '76437',
    ort: 'Rastatt',
    objektart: 'Einfamilienhaus',
    zeitrahmen: 'In 1–3 Monaten',
    beschreibung: 'Gasheizung von 1998, soll raus.',
    name: 'Max Kunde',
    telefon: '07222 12345',
    email: 'max@kunde.de',
    fotos: emptyFile(),
    ...o,
  });

describe('parseAnfrage', () => {
  it('akzeptiert eine vollständige Anfrage', async () => {
    const r = await parseAnfrage(anfrage(), ['764']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mail.subject).toBe('Anfrage: Heizungstausch · 76437 Rastatt · Max Kunde');
    expect(r.mail.replyTo).toBe('max@kunde.de');
    expect(r.mail.text).toContain('Gasheizung von 1998');
    expect(r.mail.attachments).toEqual([]); // leerer File-Input zählt nicht
  });
  it('markiert PLZ außerhalb des Einsatzgebiets', async () => {
    const r = await parseAnfrage(anfrage({ plz: '10115', ort: 'Berlin' }), ['764']);
    expect(r.ok && r.mail.subject.startsWith('[außerhalb Einsatzgebiet] ')).toBe(true);
  });
  it('ohne Präfixe gilt alles als Einsatzgebiet', async () => {
    const r = await parseAnfrage(anfrage({ plz: '10115' }), []);
    expect(r.ok && !r.mail.subject.includes('außerhalb')).toBe(true);
  });
  it('Pflichtfelder', async () =>
    expect(await parseAnfrage(anfrage({ telefon: '' }), [])).toEqual({ ok: false, grund: 'pflichtfelder' }));
  it('PLZ fünfstellig', async () =>
    expect(await parseAnfrage(anfrage({ plz: '7643' }), [])).toEqual({ ok: false, grund: 'plz' }));
  it('E-Mail', async () =>
    expect(await parseAnfrage(anfrage({ email: 'kaputt' }), [])).toEqual({ ok: false, grund: 'email' }));
  it('Anliegen nur aus der Liste', async () =>
    expect(await parseAnfrage(anfrage({ anliegen: 'Hack' }), [])).toEqual({ ok: false, grund: 'auswahl' }));
  it('nimmt Fotos als Anhang', async () => {
    const r = await parseAnfrage(anfrage({ fotos: [img('a.jpg'), img('b.png', 5, 'image/png')] }), []);
    expect(r.ok && r.mail.attachments.map((a) => a.filename)).toEqual(['a.jpg', 'b.png']);
  });
  it('lehnt PDF bei Fotos ab', async () =>
    expect(await parseAnfrage(anfrage({ fotos: img('x.pdf', 5, 'application/pdf') }), [])).toEqual({ ok: false, grund: 'dateien' }));
  it('max. 5 Dateien', async () =>
    expect(await parseAnfrage(anfrage({ fotos: Array.from({ length: 6 }, () => img()) }), [])).toEqual({ ok: false, grund: 'dateien' }));
  it('max. Gesamtgröße', async () =>
    expect(await parseAnfrage(anfrage({ fotos: img('big.jpg', MAX_TOTAL_BYTES + 1) }), [])).toEqual({ ok: false, grund: 'dateien' }));
  it('Zeilenumbrüche aus dem Betreff entfernen', async () => {
    const r = await parseAnfrage(anfrage({ name: 'Max\r\nBcc: x@y.de' }), []);
    expect(r.ok && r.mail.subject).not.toMatch(/[\r\n]/);
  });
  it('Dateinamen entschärfen', async () => {
    const r = await parseAnfrage(anfrage({ fotos: img('../../etc/pass wd.jpg') }), []);
    expect(r.ok && r.mail.attachments[0].filename).toBe('.._.._etc_pass wd.jpg');
  });
});

describe('parseBewerbung', () => {
  const bew = (o: Record<string, Val> = {}) =>
    fd({ stelle: 'Anlagenmechaniker SHK (m/w/d)', name: 'Lea Geselle', telefon: '0171 1234567', erfahrung: 'Geselle/Gesellin', fuehrerschein: 'ja', ...o });
  it('akzeptiert Kurzbewerbung ohne E-Mail und Lebenslauf', async () => {
    const r = await parseBewerbung(bew({ lebenslauf: emptyFile() }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mail.subject).toBe('Bewerbung: Anlagenmechaniker SHK (m/w/d) · Lea Geselle');
    expect(r.mail.replyTo).toBeUndefined();
    expect(r.mail.text).toContain('Führerschein Klasse B: ja');
  });
  it('nimmt PDF-Lebenslauf', async () => {
    const r = await parseBewerbung(bew({ lebenslauf: img('cv.pdf', 20, 'application/pdf') }));
    expect(r.ok && r.mail.attachments[0].contentType).toBe('application/pdf');
  });
  it('E-Mail optional, aber gültig wenn angegeben', async () =>
    expect(await parseBewerbung(bew({ email: 'nope' }))).toEqual({ ok: false, grund: 'email' }));
  it('Erfahrung nur aus der Liste', async () =>
    expect(await parseBewerbung(bew({ erfahrung: 'Chef' }))).toEqual({ ok: false, grund: 'auswahl' }));
  it('Pflichtfelder', async () =>
    expect(await parseBewerbung(bew({ name: '' }))).toEqual({ ok: false, grund: 'pflichtfelder' }));
});

describe('isBot', () => {
  it('Honeypot gefüllt', () => expect(isBot(fd({ website: 'x', dauer: '9000' }))).toBe(true));
  it('zu schnell abgeschickt', () => expect(isBot(fd({ dauer: '800' }))).toBe(true));
  it('ohne JS (kein dauer) ist kein Bot', () => expect(isBot(fd({}))).toBe(false));
  it('normal ausgefüllt', () => expect(isBot(fd({ dauer: '45000' }))).toBe(false));
});
```

- [ ] **Step 2: Tests – FAIL** (`pnpm vitest run tests/unit/handwerk-forms.test.ts`)

- [ ] **Step 3: Implementierung**

```ts
// src/lib/handwerk-forms.ts
// handwerkweb – Projektanfrage und Kurzbewerbung von Kunden-Websites (Endpoint /api/handwerk/…).
// Feldnamen und Auswahlwerte sind der Vertrag mit dem Template (handwerkweb/src/pages/anfrage.astro).

export const ANLIEGEN = [
  "Heizungstausch",
  "Wärmepumpe",
  "Badsanierung",
  "Wartung",
  "Elektroinstallation/Sanierung",
  "Wallbox",
  "Photovoltaik",
  "E-Check",
  "Reparatur/Störung",
  "Sonstiges",
] as const;
export const OBJEKTART = ["Einfamilienhaus", "Mehrfamilienhaus", "Wohnung", "Gewerbe"] as const;
export const ZEITRAHMEN = ["So schnell wie möglich", "In 1–3 Monaten", "Später / in Planung"] as const;
export const ERFAHRUNG = [
  "Auszubildende/r",
  "Geselle/Gesellin",
  "Meister/in oder Techniker/in",
  "Quereinsteiger/in",
] as const;

export const MAX_FILES = 5;
export const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const CV_TYPES = [...IMAGE_TYPES, "application/pdf"];
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;
/** Schneller ausgefüllt = Bot. `dauer` setzt ein Inline-Script; ohne JS fehlt es → kein Urteil. */
const MIN_FILL_MS = 3000;

export interface Attachment {
  filename: string;
  contentType: string;
  content: Buffer;
}
export interface MailContent {
  subject: string;
  text: string;
  replyTo?: string;
  attachments: Attachment[];
}
export type Grund = "pflichtfelder" | "plz" | "email" | "auswahl" | "dateien";
export type FormResult = { ok: true; mail: MailContent } | { ok: false; grund: Grund };

const str = (f: FormData, k: string, max = 200) => {
  const v = f.get(k);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const oneOf = (v: string, list: readonly string[]) => !v || list.includes(v);
const fail = (grund: Grund): FormResult => ({ ok: false, grund });
const rows = (r: [string, string][]) =>
  r
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

export function isBot(f: FormData): boolean {
  if (str(f, "website")) return true;
  const dauer = str(f, "dauer");
  return dauer !== "" && Number(dauer) < MIN_FILL_MS;
}

async function collectFiles(
  f: FormData,
  field: string,
  allowed: readonly string[],
): Promise<Attachment[] | null> {
  const files = f.getAll(field).filter((v): v is File => typeof v !== "string" && v.size > 0);
  if (files.length > MAX_FILES) return null;
  if (files.reduce((n, x) => n + x.size, 0) > MAX_TOTAL_BYTES) return null;
  if (files.some((x) => !allowed.includes(x.type))) return null;
  return Promise.all(
    files.map(async (x, i) => ({
      filename: x.name.replace(/[^\w.\- äöüÄÖÜß]/g, "_").slice(0, 100) || `datei-${i + 1}`,
      contentType: x.type,
      content: Buffer.from(await x.arrayBuffer()),
    })),
  );
}

export async function parseAnfrage(f: FormData, plzPraefixe: string[]): Promise<FormResult> {
  const anliegen = str(f, "anliegen");
  const plz = str(f, "plz", 10);
  const ort = str(f, "ort", 100);
  const objektart = str(f, "objektart");
  const baujahr = str(f, "baujahr", 4);
  const zeitrahmen = str(f, "zeitrahmen");
  const beschreibung = str(f, "beschreibung", 3000);
  const name = str(f, "name", 120);
  const telefon = str(f, "telefon", 40);
  const email = str(f, "email", 120);
  const rueckruf = str(f, "rueckruf") === "ja";
  const erreichbarkeit = str(f, "erreichbarkeit");

  if (!anliegen || !plz || !beschreibung || !name || !telefon || !email) return fail("pflichtfelder");
  if (!/^\d{5}$/.test(plz)) return fail("plz");
  if (!EMAIL.test(email)) return fail("email");
  if (!ANLIEGEN.includes(anliegen as (typeof ANLIEGEN)[number])) return fail("auswahl");
  if (!oneOf(objektart, OBJEKTART) || !oneOf(zeitrahmen, ZEITRAHMEN)) return fail("auswahl");
  const attachments = await collectFiles(f, "fotos", IMAGE_TYPES);
  if (!attachments) return fail("dateien");

  const ausserhalb = plzPraefixe.length > 0 && !plzPraefixe.some((p) => plz.startsWith(p));
  const subject = oneLine(
    `${ausserhalb ? "[außerhalb Einsatzgebiet] " : ""}Anfrage: ${anliegen} · ${plz} ${ort} · ${name}`,
  );
  const text = `Neue Projektanfrage über Ihre Website.

${rows([
  ["Anliegen", anliegen],
  ["PLZ / Ort", `${plz} ${ort}`.trim()],
  ["Objektart", objektart],
  ["Baujahr", baujahr],
  ["Zeitrahmen", zeitrahmen],
  ["Name", name],
  ["Telefon", telefon],
  ["E-Mail", email],
  ["Rückruf erwünscht", rueckruf ? "ja" : "nein"],
  ["Erreichbarkeit", erreichbarkeit],
  ["Fotos", attachments.length ? `${attachments.length} im Anhang` : "keine"],
])}${ausserhalb ? "\n\nHinweis: Die PLZ liegt außerhalb Ihres hinterlegten Einsatzgebiets." : ""}

Beschreibung:
${beschreibung}`;

  return { ok: true, mail: { subject, text, replyTo: email, attachments } };
}

export async function parseBewerbung(f: FormData): Promise<FormResult> {
  const stelle = str(f, "stelle", 120);
  const name = str(f, "name", 120);
  const telefon = str(f, "telefon", 40);
  const email = str(f, "email", 120);
  const erfahrung = str(f, "erfahrung");
  const fuehrerschein = str(f, "fuehrerschein", 4);
  const nachricht = str(f, "nachricht", 2000);

  if (!stelle || !name || !telefon || !erfahrung) return fail("pflichtfelder");
  if (email && !EMAIL.test(email)) return fail("email");
  if (!ERFAHRUNG.includes(erfahrung as (typeof ERFAHRUNG)[number])) return fail("auswahl");
  if (!oneOf(fuehrerschein, ["ja", "nein"])) return fail("auswahl");
  const attachments = await collectFiles(f, "lebenslauf", CV_TYPES);
  if (!attachments) return fail("dateien");

  const text = `Neue Bewerbung über Ihre Website.

${rows([
  ["Stelle", stelle],
  ["Name", name],
  ["Telefon", telefon],
  ["E-Mail", email],
  ["Erfahrung", erfahrung],
  ["Führerschein Klasse B", fuehrerschein],
  ["Lebenslauf", attachments.length ? "im Anhang" : "nicht beigefügt"],
])}${nachricht ? `\n\nNachricht:\n${nachricht}` : ""}

Bitte melden Sie sich zeitnah – gute Fachkräfte haben meist mehrere Angebote.`;

  return {
    ok: true,
    mail: {
      subject: oneLine(`Bewerbung: ${stelle} · ${name}`),
      text,
      ...(email && { replyTo: email }),
      attachments,
    },
  };
}
```

- [ ] **Step 4: Tests – PASS** (`pnpm vitest run tests/unit/handwerk-forms.test.ts`). Falls `Dateinamen entschärfen` am Erwartungswert scheitert, die Regex nicht lockern, sondern Erwartung an die tatsächliche (sichere) Ausgabe anpassen – Ziel: kein `/` im Namen.

- [ ] **Step 5: Commit**

```bash
git add src/lib/handwerk-forms.ts tests/unit/handwerk-forms.test.ts
git commit -m "feat(handwerk): parse project requests and short applications"
```

---

### Task 4: Mailer, Submission-Handler, API-Route

**Files:**
- Modify: `package.json` (via `pnpm add nodemailer && pnpm add -D @types/nodemailer`)
- Create: `src/lib/mailer.ts`
- Create: `src/lib/handwerk-submit.ts`
- Create: `src/pages/api/handwerk/[siteId]/[form].ts`
- Test: `tests/unit/handwerk-submit.test.ts`

**Interfaces:**
- Consumes: `findSite`, `allowedOrigins` (Task 2); `isBot`, `parseAnfrage`, `parseBewerbung`, `MAX_TOTAL_BYTES`, `MailContent` (Task 3)
- Produces:
  - `interface OutgoingMail extends MailContent { to: string }` and `sendMail(m: OutgoingMail): Promise<void>` in `mailer.ts` (wirft bei fehlender Konfiguration oder SMTP-Fehler)
  - `createRateLimiter(max: number, windowMs: number, now?: () => number): (key: string) => boolean`
  - `interface SubmitInput { siteId: string; form: string; origin: string | null; ip: string; contentLength: number; formData: () => Promise<FormData> }`
  - `interface SubmitDeps { send: (m: OutgoingMail) => Promise<void>; allow: (key: string) => boolean; dev: boolean }`
  - `type SubmitResult = { status: 303; location: string } | { status: 403 | 404; body: string }`
  - `handleSubmission(i: SubmitInput, deps: SubmitDeps): Promise<SubmitResult>`

- [ ] **Step 1: Abhängigkeit installieren**

Run: `pnpm add nodemailer && pnpm add -D @types/nodemailer`
Expected: `nodemailer` ^10 in `dependencies`, `@types/nodemailer` in `devDependencies`.

- [ ] **Step 2: Failing tests**

```ts
// tests/unit/handwerk-submit.test.ts
import { describe, expect, it, vi } from 'vitest';
import { createRateLimiter, handleSubmission, type SubmitDeps, type SubmitInput } from '../../src/lib/handwerk-submit';

const ORIGIN = 'https://handwerk.lkmedia.net';
function valid(): FormData {
  const f = new FormData();
  const v = {
    anliegen: 'Wallbox', plz: '76437', ort: 'Rastatt', beschreibung: 'Wallbox für E-Auto',
    name: 'Max Kunde', telefon: '0722212345', email: 'max@kunde.de', dauer: '20000',
  };
  for (const [k, x] of Object.entries(v)) f.append(k, x);
  return f;
}
const input = (o: Partial<SubmitInput> = {}): SubmitInput => ({
  siteId: 'demo', form: 'anfrage', origin: ORIGIN, ip: '1.2.3.4', contentLength: 1000,
  formData: async () => valid(), ...o,
});
const deps = (o: Partial<SubmitDeps> = {}): SubmitDeps => ({
  send: vi.fn(async () => {}), allow: () => true, dev: false, ...o,
});

describe('handleSubmission', () => {
  it('versendet an die Register-Adresse und leitet auf /danke', async () => {
    const d = deps();
    const r = await handleSubmission(input(), d);
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/danke?f=anfrage` });
    expect(d.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'lucas@lkmedia.net' }));
  });
  it('unbekannte siteId → 404', async () =>
    expect((await handleSubmission(input({ siteId: 'nope' }), deps())).status).toBe(404));
  it('unbekanntes Formular → 404', async () =>
    expect((await handleSubmission(input({ form: 'admin' }), deps())).status).toBe(404));
  it('fremder Origin → 403, kein Versand', async () => {
    const d = deps();
    expect((await handleSubmission(input({ origin: 'https://evil.example' }), d)).status).toBe(403);
    expect(d.send).not.toHaveBeenCalled();
  });
  it('localhost nur im dev', async () => {
    expect((await handleSubmission(input({ origin: 'http://localhost:4321' }), deps())).status).toBe(403);
    expect((await handleSubmission(input({ origin: 'http://localhost:4321' }), deps({ dev: true }))).status).toBe(303);
  });
  it('Rate-Limit → /fehler?grund=limit', async () =>
    expect(await handleSubmission(input(), deps({ allow: () => false }))).toEqual({
      status: 303, location: `${ORIGIN}/fehler?grund=limit`,
    }));
  it('zu großer Body → /fehler?grund=dateien, ohne zu parsen', async () => {
    const formData = vi.fn(async () => valid());
    const r = await handleSubmission(input({ contentLength: 50 * 1024 * 1024, formData }), deps());
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=dateien` });
    expect(formData).not.toHaveBeenCalled();
  });
  it('Bot → /danke ohne Versand', async () => {
    const d = deps();
    const f = valid();
    f.set('website', 'spam');
    expect(await handleSubmission(input({ formData: async () => f }), d)).toEqual({
      status: 303, location: `${ORIGIN}/danke?f=anfrage`,
    });
    expect(d.send).not.toHaveBeenCalled();
  });
  it('Validierungsfehler → /fehler mit Grund', async () => {
    const f = valid();
    f.set('plz', 'abc');
    expect(await handleSubmission(input({ formData: async () => f }), deps())).toEqual({
      status: 303, location: `${ORIGIN}/fehler?grund=plz`,
    });
  });
  it('SMTP-Fehler → /fehler?grund=versand', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await handleSubmission(input(), deps({ send: async () => { throw new Error('smtp down'); } }));
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=versand` });
  });
});

describe('createRateLimiter', () => {
  it('erlaubt max Treffer pro Fenster', () => {
    let t = 0;
    const allow = createRateLimiter(2, 1000, () => t);
    expect([allow('a'), allow('a'), allow('a'), allow('b')]).toEqual([true, true, false, true]);
    t = 1001;
    expect(allow('a')).toBe(true);
  });
});
```

- [ ] **Step 3: Tests – FAIL** (`pnpm vitest run tests/unit/handwerk-submit.test.ts`)

- [ ] **Step 4: `src/lib/mailer.ts`**

```ts
// SMTP-Versand (AWS SES Mail Manager) für handwerkweb. Zugangsdaten nur aus der Umgebung.
import nodemailer, { type Transporter } from "nodemailer";
import type { MailContent } from "./handwerk-forms";

export interface OutgoingMail extends MailContent {
  to: string;
}

const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
let transport: Transporter | undefined;

export async function sendMail(m: OutgoingMail): Promise<void> {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  if (!host || !user || !pass) throw new Error("SMTP nicht konfiguriert (SMTP_HOST/USER/PASS)");
  transport ??= nodemailer.createTransport({
    host,
    port: Number(env("SMTP_PORT") ?? 587),
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
  await transport.sendMail({
    from: env("SMTP_FROM") ?? "lkmedia.net <no-reply@lkmedia.net>",
    to: m.to,
    replyTo: m.replyTo,
    subject: m.subject,
    text: m.text,
    attachments: m.attachments,
  });
}
```

- [ ] **Step 5: `src/lib/handwerk-submit.ts`**

```ts
// handwerkweb – Entscheidet über eine Formular-Einsendung. Reine Logik, Versand/Limit injiziert.
import { type MailContent, MAX_TOTAL_BYTES, isBot, parseAnfrage, parseBewerbung } from "./handwerk-forms";
import { allowedOrigins, findSite } from "./handwerk-sites";

type OutgoingMail = MailContent & { to: string };
const FORMS = ["anfrage", "bewerbung"] as const;
/** Dateien + Textfelder + Multipart-Overhead. */
const MAX_BODY = MAX_TOTAL_BYTES + 1024 * 1024;

export interface SubmitInput {
  siteId: string;
  form: string;
  origin: string | null;
  ip: string;
  contentLength: number;
  formData: () => Promise<FormData>;
}
export interface SubmitDeps {
  send: (m: OutgoingMail) => Promise<void>;
  allow: (key: string) => boolean;
  dev: boolean;
}
export type SubmitResult = { status: 303; location: string } | { status: 403 | 404; body: string };

// ponytail: In-Memory, pro Prozess, Neustart leert. Bei mehreren Instanzen Redis o. Ä.
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const t = now();
    if (hits.size > 10_000) hits.clear();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    const ok = recent.length < max;
    hits.set(key, ok ? [...recent, t] : recent);
    return ok;
  };
}

export async function handleSubmission(i: SubmitInput, deps: SubmitDeps): Promise<SubmitResult> {
  const site = findSite(i.siteId);
  if (!site || !(FORMS as readonly string[]).includes(i.form)) {
    return { status: 404, body: "Nicht gefunden." };
  }
  if (!i.origin || !allowedOrigins(site, deps.dev).includes(i.origin)) {
    return { status: 403, body: "Herkunft nicht erlaubt." };
  }
  // Redirect-Ziel ist der geprüfte Origin, nie ein Formularfeld.
  const go = (path: string): SubmitResult => ({ status: 303, location: `${i.origin}${path}` });

  if (!(i.contentLength > 0) || i.contentLength > MAX_BODY) return go("/fehler?grund=dateien");
  if (!deps.allow(`${i.siteId}:${i.ip}`)) return go("/fehler?grund=limit");

  let form: FormData;
  try {
    form = await i.formData();
  } catch {
    return go("/fehler?grund=pflichtfelder");
  }
  if (isBot(form)) return go(`/danke?f=${i.form}`);

  const parsed =
    i.form === "anfrage" ? await parseAnfrage(form, site.plzPraefixe) : await parseBewerbung(form);
  if (!parsed.ok) return go(`/fehler?grund=${parsed.grund}`);

  try {
    await deps.send({ ...parsed.mail, to: site.email });
  } catch (error) {
    // Daten nicht still verlieren: Inhalt (ohne Anhänge) loggen, Absender sieht Fehler mit Telefon.
    console.error("[handwerk] Versand fehlgeschlagen", i.siteId, i.form, error, {
      subject: parsed.mail.subject,
      text: parsed.mail.text,
    });
    return go("/fehler?grund=versand");
  }
  return go(`/danke?f=${i.form}`);
}
```

- [ ] **Step 6: Tests – PASS** (`pnpm vitest run tests/unit/handwerk-submit.test.ts`)

- [ ] **Step 7: API-Route**

```ts
// src/pages/api/handwerk/[siteId]/[form].ts
import type { APIRoute } from "astro";
import { createRateLimiter, handleSubmission } from "../../../../lib/handwerk-submit";
import { sendMail } from "../../../../lib/mailer";

export const prerender = false;

const allow = createRateLimiter(5, 10 * 60 * 1000);

/** Hinter Traefik: der letzte X-Forwarded-For-Eintrag stammt vom Proxy selbst, nicht vom Client. */
function clientIp(request: Request, fallback: string): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",").at(-1)?.trim() || fallback;
}

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  const r = await handleSubmission(
    {
      siteId: params.siteId ?? "",
      form: params.form ?? "",
      origin: request.headers.get("origin"),
      ip: clientIp(request, clientAddress),
      contentLength: Number(request.headers.get("content-length") ?? 0),
      formData: () => request.formData(),
    },
    { send: sendMail, allow, dev: import.meta.env.DEV },
  );
  if (r.status === 303) return new Response(null, { status: 303, headers: { Location: r.location } });
  return new Response(r.body, { status: r.status });
};
```

- [ ] **Step 8: Manuell gegen den Dev-Server prüfen**

Run (Terminal 1): `pnpm dev`
Run (Terminal 2):

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' -X POST http://localhost:4321/api/handwerk/demo/anfrage \
  -H 'Origin: http://localhost:4321' -F anliegen=Wallbox -F plz=76437 -F ort=Rastatt \
  -F beschreibung='Test aus dem Plan' -F name='Test' -F telefon=0123 -F email=lucas@lkmedia.net -F dauer=9000
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:4321/api/handwerk/demo/anfrage \
  -H 'Origin: https://evil.example' -F name=x
```

Expected: `303 http://localhost:4321/danke?f=anfrage` und eine Mail an lucas@lkmedia.net; zweiter Aufruf `403`. Kommt keine Mail: Log prüfen (`[handwerk] Versand fehlgeschlagen`) – häufigste Ursache ist eine nicht verifizierte Absenderdomain bei SES; dann `SMTP_FROM` in `.env` auf eine verifizierte Adresse setzen und den Menschen fragen.

- [ ] **Step 9: Commit**

```bash
pnpm test && pnpm lint && pnpm check
git add package.json pnpm-lock.yaml src/lib/mailer.ts src/lib/handwerk-submit.ts "src/pages/api/handwerk" tests/unit/handwerk-submit.test.ts
git commit -m "feat(handwerk): form endpoint with SMTP delivery, origin check and rate limit"
```

---

### Task 5: Stripe-Check verallgemeinern + `handwerkweb.ts`

**Files:**
- Create: `src/lib/stripe.ts`
- Modify: `src/lib/docweb.ts` (`checkSession` und `SESSION_ID` → Delegation)
- Create: `src/lib/handwerkweb.ts`
- Test: `tests/unit/handwerkweb.test.ts` (neu), `tests/unit/docweb.test.ts` (muss unverändert grün bleiben)

**Interfaces:**
- Produces:
  - `SESSION_ID: RegExp`, `checkPaidSession(id: string, secretKey: string, paymentLinkId: string, fetchFn?: typeof fetch): Promise<{ paid: boolean; email?: string }>` in `stripe.ts`
  - `HANDWERKWEB = { setupPrice: "1.990 €", monthlyPrice: "69 €", demoUrl: "https://handwerk.lkmedia.net", paymentLink: "", paymentLinkId: "" }`
  - `interface Onboarding` (siehe Code), `parseOnboarding(f: FormData): { ok: true; data: Onboarding } | { ok: false; errors: string[] }`, `toKundeYaml(d: Onboarding, datum: string): string`, `checkSession(id: string, secretKey: string, fetchFn?: typeof fetch)`

- [ ] **Step 1: Failing tests**

```ts
// tests/unit/handwerkweb.test.ts
import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { parseOnboarding, toKundeYaml } from '../../src/lib/handwerkweb';
import { checkPaidSession } from '../../src/lib/stripe';

function form(o: Record<string, string | string[]> = {}): FormData {
  const base: Record<string, string | string[]> = {
    session_id: 'cs_live_a1B2c3',
    betrieb_name: 'Muster Haustechnik GmbH',
    gewerke: ['shk'],
    meisterbetrieb: 'ja',
    telefon: '07222 12345',
    email: 'info@betrieb.de',
    strasse: 'Hauptstraße 1',
    plz: '76437',
    ort: 'Rastatt',
    oeffnungszeiten: 'Mo–Fr 7–16 Uhr',
    einsatzgebiet: 'Rastatt, Baden-Baden, Gaggenau (ca. 30 km)',
    leistungen: 'Heizungstausch\nBadsanierung',
    inhaber: 'Max Meister',
    handwerkskammer: 'Handwerkskammer Karlsruhe',
    ...o,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

describe('parseOnboarding', () => {
  it('akzeptiert ein vollständiges Formular', () => {
    const r = parseOnboarding(form({ gewerke: ['shk', 'elektro', 'hack'] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.betrieb.gewerke).toEqual(['shk', 'elektro']);
  });
  it('verlangt mindestens ein Gewerk', () => {
    const r = parseOnboarding(form({ gewerke: [] }));
    expect(!r.ok && r.errors.join()).toMatch(/Gewerk/);
  });
  it('meldet fehlende Pflichtfelder', () => {
    const r = parseOnboarding(form({ betrieb_name: '', handwerkskammer: '' }));
    expect(!r.ok && r.errors.join(' ')).toMatch(/Betriebsname/);
    expect(!r.ok && r.errors.join(' ')).toMatch(/Handwerkskammer/);
  });
  it('prüft session_id, PLZ, E-Mail, Farbe', () => {
    const r = parseOnboarding(form({ session_id: 'x', plz: '123', email: 'a', wunschfarbe: 'rot' }));
    expect(!r.ok && r.errors.length).toBe(4);
  });
});

describe('toKundeYaml', () => {
  it('erzeugt gültiges YAML auch mit Sonderzeichen', () => {
    const r = parseOnboarding(form({ hinweise: 'Achtung: "#1"\nzweite Zeile' }));
    if (!r.ok) throw new Error(r.errors.join());
    const y = parse(toKundeYaml(r.data, '2026-10-07'));
    expect(y.betrieb.name).toBe('Muster Haustechnik GmbH');
    expect(y.betrieb.gewerke).toEqual(['shk']);
    expect(y.betrieb.meisterbetrieb).toBe(true);
    expect(y.hinweise).toBe('Achtung: "#1"\nzweite Zeile');
    expect(y.bestellung.datum).toBe('2026-10-07');
  });
});

describe('checkPaidSession', () => {
  const ok = (body: object) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  it('bezahlt über den richtigen Link', async () => {
    const f = ok({ payment_status: 'paid', payment_link: 'plink_x', customer_details: { email: 'k@b.de' } });
    expect(await checkPaidSession('cs_test_abc', 'sk', 'plink_x', f)).toEqual({ paid: true, email: 'k@b.de' });
  });
  it('anderer Link zählt nicht', async () => {
    const f = ok({ payment_status: 'paid', payment_link: 'plink_other' });
    expect((await checkPaidSession('cs_test_abc', 'sk', 'plink_x', f)).paid).toBe(false);
  });
  it('leere Link-ID (noch nicht eingerichtet) ist nie bezahlt, ohne Request', async () => {
    const f = ok({ payment_status: 'paid', payment_link: '' });
    expect((await checkPaidSession('cs_test_abc', 'sk', '', f)).paid).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Tests – FAIL** (`pnpm vitest run tests/unit/handwerkweb.test.ts`)

- [ ] **Step 3: `src/lib/stripe.ts`**

```ts
// Gemeinsamer Stripe-Check für Payment-Link-Produkte (docweb, handwerkweb).
export const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;

/** Prüft per Stripe-API, ob die Checkout-Session über genau diesen Payment Link bezahlt ist. */
export async function checkPaidSession(
  id: string,
  secretKey: string,
  paymentLinkId: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ paid: boolean; email?: string }> {
  if (!paymentLinkId || !SESSION_ID.test(id)) return { paid: false };
  try {
    const r = await fetchFn(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!r.ok) return { paid: false };
    const s = (await r.json()) as {
      payment_status?: string;
      payment_link?: string | null;
      customer_details?: { email?: string };
    };
    // Nur Käufe über diesen Link zählen, nicht andere Produkte im selben Stripe-Konto.
    const paid = s.payment_status === "paid" && s.payment_link === paymentLinkId;
    return { paid, email: s.customer_details?.email };
  } catch (error) {
    console.error("[stripe] session check failed", error);
    return { paid: false };
  }
}
```

- [ ] **Step 4: `src/lib/docweb.ts` umstellen**

Ganz oben ergänzen: `import { SESSION_ID, checkPaidSession } from "./stripe";`
Zeile `const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;` löschen.
Die komplette Funktion `checkSession` (inkl. JSDoc) ersetzen durch:

```ts
/** Prüft per Stripe-API, ob die Checkout-Session über den docweb-Link bezahlt ist. */
export const checkSession = (id: string, secretKey: string, fetchFn: typeof fetch = fetch) =>
  checkPaidSession(id, secretKey, DOCWEB.paymentLinkId, fetchFn);
```

Run: `pnpm vitest run tests/unit/docweb.test.ts`
Expected: PASS (unverändert). Prüft ein docweb-Test die Log-Meldung `[docweb] Stripe session check failed`, die Erwartung auf `[stripe] session check failed` ändern – sonst nichts.

- [ ] **Step 5: `src/lib/handwerkweb.ts`**

```ts
// handwerkweb – Website-Paket für Handwerksbetriebe (Produktseite /handwerk, Onboarding nach Stripe-Checkout).
import { SESSION_ID, checkPaidSession } from "./stripe";

export const HANDWERKWEB = {
  setupPrice: "1.990 €",
  monthlyPrice: "69 €",
  demoUrl: "https://handwerk.lkmedia.net",
  // Stripe Payment Link (öffentlich, kein Secret). Leer = noch nicht eingerichtet → CTA führt zum Gespräch.
  // Success-URL beim Anlegen: https://lkmedia.net/handwerk/onboarding?session_id={CHECKOUT_SESSION_ID}
  paymentLink: "",
  paymentLinkId: "",
} as const;

const GEWERKE = ["shk", "elektro"] as const;
const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;

export interface Onboarding {
  sessionId: string;
  wunschdomain: string;
  betrieb: {
    name: string;
    gewerke: (typeof GEWERKE)[number][];
    meisterbetrieb: boolean;
    telefon: string;
    email: string;
    notdienst: string;
    wunschfarbe: string;
  };
  standort: { strasse: string; plz: string; ort: string; oeffnungszeiten: string };
  einsatzgebiet: string;
  leistungen: string;
  referenzen: string;
  stellen: string;
  team: string;
  recht: {
    inhaber: string;
    rechtsform: string;
    handwerkskammer: string;
    register: string;
    ustId: string;
    haftpflicht: string;
  };
  hinweise: string;
}

export type ParseResult = { ok: true; data: Onboarding } | { ok: false; errors: string[] };

const str = (f: FormData, k: string, max = 200) =>
  String(f.get(k) ?? "")
    .trim()
    .slice(0, max);

export function parseOnboarding(f: FormData): ParseResult {
  const errors: string[] = [];
  const required = (k: string, label: string, max = 200) => {
    const v = str(f, k, max);
    if (!v) errors.push(`${label} fehlt`);
    return v;
  };

  const sessionId = str(f, "session_id");
  if (!SESSION_ID.test(sessionId)) errors.push("Ungültige Bestellung (session_id)");

  const name = required("betrieb_name", "Betriebsname");
  const gewerke = f
    .getAll("gewerke")
    .map(String)
    .filter((g): g is (typeof GEWERKE)[number] => (GEWERKE as readonly string[]).includes(g));
  if (!gewerke.length) errors.push("Mindestens ein Gewerk wählen");
  const telefon = required("telefon", "Telefon", 40);
  const email = required("email", "E-Mail", 120);
  if (email && !EMAIL.test(email)) errors.push("E-Mail ungültig");
  const wunschfarbe = str(f, "wunschfarbe", 7);
  if (wunschfarbe && !/^#[0-9a-fA-F]{6}$/.test(wunschfarbe)) errors.push("Wunschfarbe ungültig");
  const plz = required("plz", "PLZ", 5);
  if (plz && !/^\d{5}$/.test(plz)) errors.push("PLZ muss fünfstellig sein");

  const data: Onboarding = {
    sessionId,
    wunschdomain: str(f, "wunschdomain", 120),
    betrieb: {
      name,
      gewerke,
      meisterbetrieb: str(f, "meisterbetrieb") === "ja",
      telefon,
      email,
      notdienst: str(f, "notdienst", 300),
      wunschfarbe,
    },
    standort: {
      strasse: required("strasse", "Straße"),
      plz,
      ort: required("ort", "Ort"),
      oeffnungszeiten: required("oeffnungszeiten", "Öffnungszeiten", 2000),
    },
    einsatzgebiet: required("einsatzgebiet", "Einsatzgebiet", 2000),
    leistungen: required("leistungen", "Leistungen", 5000),
    referenzen: str(f, "referenzen", 5000),
    stellen: str(f, "stellen", 3000),
    team: str(f, "team", 3000),
    recht: {
      inhaber: required("inhaber", "Inhaber / Geschäftsführung"),
      rechtsform: str(f, "rechtsform", 100),
      handwerkskammer: required("handwerkskammer", "Handwerkskammer"),
      register: str(f, "register"),
      ustId: str(f, "ust_id", 40),
      haftpflicht: str(f, "haftpflicht", 300),
    },
    hinweise: str(f, "hinweise", 3000),
  };

  return errors.length ? { ok: false, errors } : { ok: true, data };
}

// JSON ist gültiges YAML – JSON.stringify quotet jeden Wert sicher (":", "#", Zeilenumbrüche …).
const q = (v: string) => JSON.stringify(v);

/** Erzeugt kunde.yaml im Format von handwerkweb/onboarding/kunde.example.yaml. */
export function toKundeYaml(d: Onboarding, datum: string): string {
  const b = d.betrieb;
  return `# handwerkweb Onboarding – an den Agent übergeben (siehe handwerkweb/AGENTS.md)
bestellung:
  stripe_session: ${q(d.sessionId)}
  datum: ${q(datum)}
  wunschdomain: ${q(d.wunschdomain)}

betrieb:
  name: ${q(b.name)}
  gewerke: ${JSON.stringify(b.gewerke)}
  meisterbetrieb: ${b.meisterbetrieb}
  telefon: ${q(b.telefon)}
  email: ${q(b.email)}
  notdienst: ${q(b.notdienst)}
  wunschfarbe: ${q(b.wunschfarbe)}

standort:
  strasse: ${q(d.standort.strasse)}
  plz: ${q(d.standort.plz)}
  ort: ${q(d.standort.ort)}
  oeffnungszeiten: ${q(d.standort.oeffnungszeiten)}

einsatzgebiet: ${q(d.einsatzgebiet)}
leistungen: ${q(d.leistungen)}
referenzen: ${q(d.referenzen)}
stellen: ${q(d.stellen)}
team: ${q(d.team)}

recht:
  inhaber: ${q(d.recht.inhaber)}
  rechtsform: ${q(d.recht.rechtsform)}
  handwerkskammer: ${q(d.recht.handwerkskammer)}
  register: ${q(d.recht.register)}
  ust_id: ${q(d.recht.ustId)}
  haftpflicht: ${q(d.recht.haftpflicht)}

hinweise: ${q(d.hinweise)}
`;
}

export const checkSession = (id: string, secretKey: string, fetchFn: typeof fetch = fetch) =>
  checkPaidSession(id, secretKey, HANDWERKWEB.paymentLinkId, fetchFn);
```

- [ ] **Step 6: Tests – PASS** (`pnpm test` – alle, inkl. docweb)

- [ ] **Step 7: Commit**

```bash
git add src/lib/stripe.ts src/lib/docweb.ts src/lib/handwerkweb.ts tests/unit/handwerkweb.test.ts
git commit -m "feat(handwerk): onboarding parser; share stripe session check with docweb"
```

---

### Task 6: Onboarding-API und Seiten `/handwerk/*`

**Files:**
- Create: `src/pages/api/handwerk-onboarding.ts`
- Create: `src/pages/handwerk/index.astro`, `onboarding.astro`, `danke.astro`, `agb.astro`

**Interfaces:**
- Consumes: `HANDWERKWEB`, `parseOnboarding`, `toKundeYaml`, `checkSession` (Task 5); `sendMail` (Task 4); `Base`, `Hero`, `FaqBlock` (bestehend, siehe `src/pages/docweb/index.astro`)

- [ ] **Step 1: `src/pages/api/handwerk-onboarding.ts`**

Hinweis: Liegt bewusst *nicht* unter `/api/handwerk/` – sonst würde der CSRF-Check aus Task 1 übersprungen.

```ts
import type { APIRoute } from "astro";
import { checkSession, parseOnboarding, toKundeYaml } from "../../lib/handwerkweb";
import { sendMail } from "../../lib/mailer";

export const prerender = false;

const TO = "lucas@lkmedia.net";
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
// ponytail: In-Memory-Sperre gegen Mehrfach-Einsendung einer Session; nach Neustart leer.
const processed = new Set<string>();

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Ungültige Anfrage.", { status: 400 });
  }
  if (form.get("website")) return new Response("ok", { status: 200 }); // honeypot

  const parsed = parseOnboarding(form);
  if (!parsed.ok) {
    const back = new URLSearchParams({
      session_id: String(form.get("session_id") ?? ""),
      fehler: parsed.errors.join(" · "),
    });
    return new Response(null, { status: 303, headers: { Location: `/handwerk/onboarding?${back}` } });
  }

  const stripeKey = env("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[handwerkweb] STRIPE_SECRET_KEY unset – rejecting onboarding");
    return new Response("Onboarding derzeit nicht verfügbar. Bitte schreiben Sie an lucas@lkmedia.net.", {
      status: 503,
    });
  }
  const d = parsed.data;
  const session = await checkSession(d.sessionId, stripeKey);
  if (!session.paid) return new Response("Bestellung nicht gefunden oder nicht bezahlt.", { status: 403 });
  if (processed.has(d.sessionId)) {
    return new Response(
      "Angaben zu dieser Bestellung wurden bereits übermittelt. Änderungen bitte per Mail an lucas@lkmedia.net.",
      { status: 409 },
    );
  }

  const yaml = toKundeYaml(d, new Date().toISOString().slice(0, 10));
  try {
    await sendMail({
      to: TO,
      replyTo: d.betrieb.email,
      subject: `handwerkweb Onboarding: ${d.betrieb.name}`.replace(/\s+/g, " "),
      text: `Neues handwerkweb-Onboarding.\n\nBetrieb: ${d.betrieb.name}\nKäufer (Stripe): ${session.email ?? "–"}\nSession: ${d.sessionId}\n\nkunde.yaml im Anhang → an den Agent geben (handwerkweb/AGENTS.md).`,
      attachments: [{ filename: "kunde.yaml", contentType: "text/yaml", content: Buffer.from(yaml, "utf8") }],
    });
  } catch (error) {
    console.error("[handwerkweb] onboarding mail failed", error, "\n", yaml);
    return new Response("Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.", { status: 502 });
  }
  processed.add(d.sessionId);

  // Bestätigung nur an die bei Stripe hinterlegte Käufer-Adresse, nie an Formulareingaben.
  if (session.email) {
    await sendMail({
      to: session.email,
      replyTo: TO,
      subject: "Ihre handwerkweb-Website: Angaben erhalten",
      text: `Guten Tag,\n\nvielen Dank – wir haben Ihre Angaben für ${d.betrieb.name} erhalten.\n\nBitte antworten Sie auf diese Mail mit Ihrem Logo (SVG oder PNG) und Fotos: Team, Fahrzeuge, Werkstatt und vor allem fertige Projekte (gern mit Ort und Jahr).\n\nSie erhalten in der Regel innerhalb von 7 Werktagen einen Vorschau-Link.\n\nViele Grüße\nLucas Kleipödszus\nlkmedia`,
      attachments: [],
    }).catch((error: unknown) => console.error("[handwerkweb] confirmation mail failed", error));
  }

  return new Response(null, { status: 303, headers: { Location: "/handwerk/danke" } });
};
```

- [ ] **Step 2: `src/pages/handwerk/index.astro`** (Produktseite)

```astro
---
import Base from '../../layouts/Base.astro';
import Hero from '../../components/landing/Hero.astro';
import FaqBlock from '../../components/FaqBlock.astro';
import { HANDWERKWEB } from '../../lib/handwerkweb';

const seo = {
  title: 'handwerkweb — Website für Handwerksbetriebe zum Festpreis',
  description: `Website für SHK- und Elektrobetriebe: Leistungen, Referenzen, Einsatzgebiet, Projektanfrage mit Fotos und Bewerbung. ${HANDWERKWEB.setupPrice} + ${HANDWERKWEB.monthlyPrice}/Monat.`,
  canonical: '/handwerk',
  lang: 'de' as const,
  alternateUrls: { de: 'https://lkmedia.net/handwerk' },
};

const ctaHref = HANDWERKWEB.paymentLink || '/kontakt#termin';
const ctaLabel = HANDWERKWEB.paymentLink ? 'Jetzt starten →' : 'Gespräch vereinbaren →';

const features = [
  { title: 'Anfragen mit allen Angaben', body: 'Anliegen, PLZ, Objektart, Zeitrahmen, Beschreibung und bis zu 5 Fotos – strukturiert per Mail. Kein Hinterhertelefonieren für die Basics.' },
  { title: 'Bewerbung in 60 Sekunden', body: 'Kurzbewerbung ohne Pflicht-Lebenslauf: Stelle, Name, Telefon, Erfahrung. Ihre Stellen erscheinen zusätzlich in Google for Jobs.' },
  { title: 'Referenzen, die überzeugen', body: 'Projekte mit Ort, Jahr und Fotos. Zeigt, was Sie können – und wo Sie schon gearbeitet haben.' },
  { title: 'Ihr Einsatzgebiet', body: 'Orte und PLZ-Gebiete auf einer eigenen Seite – lokal gefunden werden. Anfragen von außerhalb werden markiert.' },
  { title: 'Leistungsseiten', body: 'Heizung, Wärmepumpe, Bad, Elektro, Wallbox, PV: je Leistung eine Seite mit klaren Infos und Anfrage-Button.' },
  { title: 'Schnell, sicher, ohne Tracking', body: 'Statische Website, kein Cookie-Banner, keine Google Fonts, Hosting in der EU, barrierefrei nach WCAG 2.2 AA.' },
];

const audiences = [
  { title: 'Sanitär, Heizung, Klima', body: 'SHK-Betriebe, Heizungsbauer, Badsanierer, Wärmepumpen-Fachbetriebe.' },
  { title: 'Elektro', body: 'Elektroinstallateure, E-Check, Wallbox und Photovoltaik.' },
  { title: 'Beides unter einem Dach', body: 'Haustechnik-Betriebe mit mehreren Gewerken – eine Website für alles.' },
];

const steps = [
  { n: '01', title: 'Online buchen', body: 'Paket per Stripe bezahlen – Rechnung mit ausgewiesener Umsatzsteuer kommt automatisch.' },
  { n: '02', title: 'Onboarding ausfüllen', body: 'Betriebsdaten, Leistungen, Einsatzgebiet, offene Stellen. Logo und Projektfotos per Mail.' },
  { n: '03', title: 'Vorschau prüfen', body: 'Sie erhalten einen Vorschau-Link und geben Texte und Rechtsangaben frei.' },
  { n: '04', title: 'Live gehen', body: 'Wir schalten Ihre Domain auf. Hosting, Updates und kleine Änderungen übernehmen wir.' },
];

const included = [
  'Individuelle Website mit Ihren Inhalten, Ihrem Logo und Ihrer Farbe',
  'Seiten: Start, Leistungen, Referenzen, Einsatzgebiet, Über uns, Karriere, Anfrage',
  'Projektanfrage mit Foto-Upload und Kurzbewerbung – direkt in Ihr Postfach',
  'Stellenanzeigen mit Google-for-Jobs-Auszeichnung',
  'Impressum, Datenschutz und Barrierefreiheitserklärung (Entwurf)',
  'Hosting in der EU, SSL, Backups, Updates',
  'Kleine Inhaltsänderungen (bis 30 Min./Monat), z. B. neue Referenz oder Stelle',
];

const faqs = [
  { q: 'Was kostet handwerkweb?', a: `${HANDWERKWEB.setupPrice} einmalig für die Einrichtung und ${HANDWERKWEB.monthlyPrice} pro Monat für Hosting, Wartung, Formularversand und kleine Änderungen – jeweils inklusive Umsatzsteuer. Die Mindestlaufzeit beträgt 12 Monate.` },
  { q: 'Wie schnell ist meine Website online?', a: 'Sobald das Onboarding vollständig ist und wir Logo und Fotos haben, erhalten Sie in der Regel innerhalb von 7 Werktagen eine Vorschau. Live geht die Seite nach Ihrer Freigabe.' },
  { q: 'Wo landen Anfragen und Bewerbungen?', a: 'Per E-Mail in Ihrem Postfach, inklusive Fotos bzw. Lebenslauf als Anhang. Sie können direkt auf die Mail antworten. Wir speichern die Einsendungen nicht.' },
  { q: 'Ich habe kaum Fotos von Projekten.', a: 'Handyfotos reichen. Wir wählen aus und optimieren sie. Neue Referenzen ergänzen wir laufend im Rahmen der monatlichen Änderungen.' },
  { q: 'Ist die Website DSGVO-konform?', a: 'Die Website lädt keine externen Dienste: keine Cookies, kein Tracking, keine Google Fonts, keine Karten-Embeds. Formulare werden über unseren Server in der EU an Sie weitergeleitet; dafür schließen wir einen Auftragsverarbeitungsvertrag.' },
  { q: 'Sind die Rechtstexte rechtssicher?', a: 'Wir bereiten Impressum (inkl. Handwerkskammer) und Datenschutzerklärung vor. Eine Rechtsberatung ersetzt das nicht – bitte prüfen Sie die Texte vor dem Go-live bzw. lassen Sie sie prüfen.' },
  { q: 'Was passiert nach 12 Monaten?', a: 'Der Vertrag verlängert sich monatlich und ist dann monatlich kündbar. Auf Wunsch übergeben wir Ihnen den Quellcode.' },
];

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'handwerkweb – Website für Handwerksbetriebe',
  description: seo.description,
  brand: { '@type': 'Organization', name: 'lkmedia' },
  url: 'https://lkmedia.net/handwerk',
  offers: {
    '@type': 'Offer',
    price: '1990.00',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    url: 'https://lkmedia.net/handwerk',
  },
};
---
<Base seo={seo} jsonLd={[productSchema]}>
  <Hero
    headline="Mehr passende Aufträge. Mehr Bewerbungen."
    sub={`Die Website für SHK- und Elektrobetriebe: zeigt Ihre Arbeit und sorgt dafür, dass Anfragen mit den richtigen Angaben ankommen. ${HANDWERKWEB.setupPrice} einmalig + ${HANDWERKWEB.monthlyPrice}/Monat.`}
    ctaHref="#preis" ctaLabel="Paket ansehen"
    secondaryHref={HANDWERKWEB.demoUrl} secondaryLabel="Demo ansehen" />

  <section class="py-24 px-6 max-w-6xl mx-auto">
    <h2 class="text-3xl md:text-5xl font-semibold tracking-tight mb-12">Für wen handwerkweb gemacht ist.</h2>
    <div class="grid md:grid-cols-3 gap-6">
      {audiences.map((a) => (
        <div class="rounded-2xl border border-black/10 dark:border-white/10 p-8">
          <h3 class="text-xl font-semibold mb-3">{a.title}</h3>
          <p class="text-black/70 dark:text-white/70 leading-relaxed">{a.body}</p>
        </div>
      ))}
    </div>
  </section>

  <section class="py-24 px-6 max-w-6xl mx-auto border-t border-black/10 dark:border-white/10">
    <h2 class="text-3xl md:text-5xl font-semibold tracking-tight mb-12">Was Ihre Website kann.</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
      {features.map((f) => (
        <div>
          <h3 class="text-xl font-semibold mb-3">{f.title}</h3>
          <p class="text-black/70 dark:text-white/70 leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
    <a href={HANDWERKWEB.demoUrl} target="_blank" rel="noopener" class="mt-12 inline-flex h-11 px-6 items-center rounded-full border border-black/30 dark:border-white/30 text-sm font-medium">
      Live-Demo öffnen →
    </a>
  </section>

  <section class="py-24 px-6 max-w-6xl mx-auto border-t border-black/10 dark:border-white/10">
    <h2 class="text-3xl md:text-5xl font-semibold tracking-tight mb-12">So läuft es ab.</h2>
    <ol class="grid md:grid-cols-4 gap-8">
      {steps.map((s) => (
        <li>
          <div class="text-sm tracking-widest text-black/40 dark:text-white/40 mb-3">{s.n}</div>
          <h3 class="text-xl font-semibold mb-2">{s.title}</h3>
          <p class="text-black/70 dark:text-white/70 leading-relaxed">{s.body}</p>
        </li>
      ))}
    </ol>
  </section>

  <section id="preis" class="py-24 px-6 max-w-6xl mx-auto border-t border-black/10 dark:border-white/10 scroll-mt-20">
    <div class="grid lg:grid-cols-2 gap-12 items-start">
      <div>
        <h2 class="text-3xl md:text-5xl font-semibold tracking-tight">Ein Paket. Ein Preis.</h2>
        <p class="mt-5 text-lg text-black/70 dark:text-white/70 leading-relaxed">
          Kein Angebot, kein Baukasten, keine Agentur-Stundensätze. Wir bauen und betreuen Ihre Website, zeigen Ihre Arbeit und sorgen dafür, dass Anfragen mit den richtigen Angaben ankommen.
        </p>
      </div>
      <div class="rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-8 md:p-10">
        <div class="text-sm tracking-widest text-black/50 dark:text-white/50">HANDWERKWEB KOMPLETTPAKET</div>
        <div class="mt-4 flex flex-wrap items-baseline gap-x-3">
          <span class="text-5xl font-semibold tracking-tight">{HANDWERKWEB.setupPrice}</span>
          <span class="text-black/60 dark:text-white/60">einmalig</span>
        </div>
        <div class="mt-1 text-xl"><span class="font-semibold">+ {HANDWERKWEB.monthlyPrice}</span> <span class="text-black/60 dark:text-white/60">/ Monat</span></div>
        <p class="mt-2 text-sm text-black/50 dark:text-white/50">inkl. USt. · 12 Monate Mindestlaufzeit, danach monatlich kündbar</p>
        <ul class="mt-8 space-y-3">
          {included.map((i) => (
            <li class="flex gap-3"><span aria-hidden="true" class="text-black/40 dark:text-white/40">✓</span><span>{i}</span></li>
          ))}
        </ul>
        <a href={ctaHref} class="mt-10 flex h-12 w-full items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black font-medium hover:bg-black/90 dark:hover:bg-white/90 transition">
          {ctaLabel}
        </a>
        <p class="mt-3 text-center text-xs text-black/50 dark:text-white/50">
          Sichere Zahlung über Stripe · Es gelten die <a href="/handwerk/agb" class="underline">AGB für handwerkweb</a>
        </p>
      </div>
    </div>
  </section>

  <FaqBlock items={faqs} />

  <section class="py-24 px-6 text-center border-t border-black/10 dark:border-white/10">
    <h2 class="text-3xl md:text-5xl font-semibold tracking-tight">Lieber erst sprechen?</h2>
    <p class="mt-4 text-black/70 dark:text-white/70">15 Minuten, unverbindlich – wir klären, ob handwerkweb zu Ihrem Betrieb passt.</p>
    <a href="/kontakt#termin" class="mt-8 inline-flex h-12 px-6 items-center rounded-full border border-black/30 dark:border-white/30 font-medium">Kurzes Gespräch buchen</a>
  </section>
</Base>
```

`Hero`-Props `deviceImage/deviceAlt/deviceHref` sind optional; der Screenshot der Demo wird in Plan B, Task 9 ergänzt.

- [ ] **Step 3: `src/pages/handwerk/onboarding.astro`**

Datei `src/pages/docweb/onboarding.astro` als Ausgangspunkt kopieren (gleiche Klassen `input`/`area`/`label`/`legend`, gleiche „Bestellung nicht gefunden“-Logik). Änderungen:
- Import `checkSession` aus `../../lib/handwerkweb`; SEO-Titel `handwerkweb Onboarding`, canonical `/handwerk/onboarding`, `noindex: true`.
- Satz „Bitte tragen Sie hier keine Patientendaten ein.“ entfernen.
- Link „Zu docweb“ → `href="/handwerk"`, Text „Zu handwerkweb“.
- `<form method="POST" action="/api/handwerk-onboarding" …>`.
- Fieldsets komplett ersetzen durch:

```astro
          <fieldset class="space-y-4">
            <legend class={legend}>Betrieb</legend>
            <label class="block"><span class={label}>Name des Betriebs *</span><input required name="betrieb_name" maxlength="200" class={input} placeholder="Muster Haustechnik GmbH" /></label>
            <div>
              <span class={label}>Gewerke *</span>
              <div class="mt-2 flex flex-wrap gap-6">
                <label class="flex items-center gap-2"><input type="checkbox" name="gewerke" value="shk" /> Sanitär, Heizung, Klima</label>
                <label class="flex items-center gap-2"><input type="checkbox" name="gewerke" value="elektro" /> Elektro</label>
              </div>
            </div>
            <label class="flex items-center gap-2"><input type="checkbox" name="meisterbetrieb" value="ja" /> Meisterbetrieb</label>
            <label class="block"><span class={label}>Telefon *</span><input required name="telefon" type="tel" maxlength="40" class={input} /></label>
            <label class="block"><span class={label}>E-Mail (hier kommen Anfragen und Bewerbungen an) *</span><input required name="email" type="email" maxlength="120" class={input} /></label>
            <label class="block"><span class={label}>Notdienst (falls angeboten: Zeiten und Nummer)</span><input name="notdienst" maxlength="300" class={input} placeholder="24/7 unter 0171 …" /></label>
            <label class="block"><span class={label}>Wunschfarbe</span><input name="wunschfarbe" type="color" value="#c2410c" class="mt-1 h-12 w-24 rounded-xl" /></label>
            <label class="block"><span class={label}>Wunschdomain</span><input name="wunschdomain" maxlength="120" class={input} placeholder="muster-haustechnik.de" /></label>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class={legend}>Standort und Einsatzgebiet</legend>
            <label class="block"><span class={label}>Straße und Hausnummer *</span><input required name="strasse" maxlength="200" class={input} /></label>
            <div class="grid grid-cols-3 gap-4">
              <label class="block"><span class={label}>PLZ *</span><input required name="plz" inputmode="numeric" pattern="\d{5}" maxlength="5" class={input} /></label>
              <label class="block col-span-2"><span class={label}>Ort *</span><input required name="ort" maxlength="200" class={input} /></label>
            </div>
            <label class="block"><span class={label}>Bürozeiten *</span><textarea required name="oeffnungszeiten" rows="3" maxlength="2000" class={area} placeholder="Mo–Do 7–16 Uhr, Fr 7–13 Uhr"></textarea></label>
            <label class="block"><span class={label}>Einsatzgebiet: Orte, Landkreise oder Umkreis *</span><textarea required name="einsatzgebiet" rows="3" maxlength="2000" class={area} placeholder="Rastatt, Baden-Baden, Gaggenau, Bühl – ca. 30 km um Rastatt"></textarea></label>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class={legend}>Leistungen, Referenzen, Team</legend>
            <label class="block"><span class={label}>Leistungen (eine pro Zeile, gern mit Stichpunkten) *</span><textarea required name="leistungen" rows="6" maxlength="5000" class={area} placeholder="Heizungstausch – Gas, Öl, Wärmepumpe&#10;Badsanierung – komplett aus einer Hand"></textarea></label>
            <label class="block"><span class={label}>Referenzprojekte (Was, Wo, Wann – Fotos per Mail)</span><textarea name="referenzen" rows="5" maxlength="5000" class={area} placeholder="Wärmepumpe im EFH, Gaggenau, 2025"></textarea></label>
            <label class="block"><span class={label}>Offene Stellen</span><textarea name="stellen" rows="4" maxlength="3000" class={area} placeholder="Anlagenmechaniker SHK (m/w/d), Vollzeit&#10;Azubi Elektroniker (m/w/d) ab 09/2027"></textarea></label>
            <label class="block"><span class={label}>Team (optional)</span><textarea name="team" rows="3" maxlength="3000" class={area}></textarea></label>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class={legend}>Angaben fürs Impressum</legend>
            <label class="block"><span class={label}>Inhaber / Geschäftsführung *</span><input required name="inhaber" maxlength="200" class={input} /></label>
            <label class="block"><span class={label}>Rechtsform</span><input name="rechtsform" maxlength="100" class={input} placeholder="GmbH, e. K., Einzelunternehmen …" /></label>
            <label class="block"><span class={label}>Zuständige Handwerkskammer *</span><input required name="handwerkskammer" maxlength="200" class={input} placeholder="Handwerkskammer Karlsruhe" /></label>
            <label class="block"><span class={label}>Handelsregister (Gericht und Nummer)</span><input name="register" maxlength="200" class={input} /></label>
            <label class="block"><span class={label}>USt-IdNr.</span><input name="ust_id" maxlength="40" class={input} /></label>
            <label class="block"><span class={label}>Betriebshaftpflicht (Versicherer, Geltungsbereich)</span><input name="haftpflicht" maxlength="300" class={input} /></label>
          </fieldset>

          <fieldset class="space-y-4">
            <legend class={legend}>Sonstiges</legend>
            <label class="block"><span class={label}>Hinweise und Wünsche</span><textarea name="hinweise" rows="4" maxlength="3000" class={area}></textarea></label>
          </fieldset>
```

Den Submit-Button-Block am Ende aus der docweb-Datei unverändert übernehmen.

- [ ] **Step 4: `src/pages/handwerk/danke.astro`**

Kopie von `src/pages/docweb/danke.astro`; `description: 'Ihre handwerkweb-Angaben sind angekommen.'`, `canonical: '/handwerk/danke'`, Text:

```astro
    <p class="mt-6 text-xl text-black/70 dark:text-white/70">
      Sie erhalten gleich eine Bestätigung per Mail. Schicken Sie uns als Antwort darauf Ihr Logo und Fotos
      Ihrer Projekte – eine Vorschau Ihrer Website folgt in der Regel innerhalb von 7 Werktagen.
    </p>
```

- [ ] **Step 5: `src/pages/handwerk/agb.astro`**

Kopie von `src/pages/docweb/agb.astro`, Kommentar `// ENTWURF – vor Veröffentlichung rechtlich prüfen lassen.` bleibt. Ersetzungen:
- Import `HANDWERKWEB` aus `../../lib/handwerkweb`, alle `DOCWEB.` → `HANDWERKWEB.`; SEO `title: 'AGB handwerkweb'`, Beschreibung „… für das Website-Paket handwerkweb …“, canonical `/handwerk/agb`; H1 „AGB für handwerkweb“.
- §1: „docweb“ → „handwerkweb“; „insbesondere Arzt-, Zahnarzt- und Psychotherapiepraxen“ → „insbesondere Handwerksbetriebe“.
- §3 erster Spiegelstrich: „Erstellung einer Website auf Basis des handwerkweb-Systems mit den Seiten Start, Leistungen, Referenzen, Einsatzgebiet, Über uns, Karriere, Projektanfrage und Bewerbung sowie Impressum, Datenschutzerklärung und Erklärung zur Barrierefreiheit;“
- §3 Betrieb: neuen Spiegelstrich nach Hosting: „Weiterleitung der über die Formulare der Website eingehenden Projektanfragen und Bewerbungen per E-Mail an die vom Kunden benannte Adresse;“
- §3 Nicht enthalten: „Kontaktformulare, Online-Terminbuchungssysteme Dritter“ → „Speicherung oder Verwaltung von Anfragen und Bewerbungen (CRM), Stellenportale Dritter“.
- §4: Satz „…insbesondere im Hinblick auf das Heilmittelwerbegesetz und die Berufsordnung.“ → „…insbesondere für Referenzen (Zustimmung abgebildeter Personen und Auftraggeber) und Stellenanzeigen (AGG-konforme Formulierung).“
- §10 ersetzen:

```astro
    <h2>10. Datenschutz und Auftragsverarbeitung</h2>
    <p>
      Der Anbieter verarbeitet personenbezogene Daten im Auftrag des Kunden, insbesondere beim Hosting
      (Server-Logfiles) und bei der Weiterleitung der Formulare (Projektanfragen inkl. Fotos, Bewerbungen inkl.
      Lebenslauf). Einsendungen werden nur übermittelt und nicht gespeichert; der Versand erfolgt über Amazon
      Web Services (SES) in der EU. Die Parteien schließen einen Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO,
      den der Anbieter bereitstellt. Für die Datenschutzerklärung seiner Website und den Umgang mit
      Bewerberdaten ist der Kunde verantwortlich; der Anbieter stellt einen Entwurf bereit.
    </p>
```

- [ ] **Step 6: Build + Sichtprüfung**

Run: `pnpm check && pnpm build`
Expected: grün; `dist/client/handwerk/index.html` und `agb/index.html` existieren (bzw. `dist/handwerk/…` je nach Adapter-Layout).
Run: `pnpm dev`, `http://localhost:4321/handwerk` öffnen: CTA zeigt „Gespräch vereinbaren →“ (Payment Link leer). `http://localhost:4321/handwerk/onboarding` zeigt im Dev das Formular (ohne Stripe-Key).

- [ ] **Step 7: Commit**

```bash
git add src/pages/handwerk src/pages/api/handwerk-onboarding.ts
git commit -m "feat(handwerk): product page, onboarding, terms"
```

---

### Task 7: Einbindung (Routen, Footer, llms.txt, Datenschutz, Doku)

**Files:**
- Modify: `src/lib/i18n.ts` (`routes`), `tests/unit/i18n.test.ts`
- Modify: `src/components/Footer.astro` (Spalte „Branchen“)
- Modify: `src/pages/llms.txt.ts`
- Modify: `src/pages/datenschutz.astro`
- Modify: `CLAUDE.md`, `AGENTS.md` (Abschnitt API)
- Create: `.env.example`

- [ ] **Step 1: Failing test** – in `tests/unit/i18n.test.ts` im Test `maps named routes…` ergänzen:

```ts
    expect(routeFor('craftsmen', 'de')).toBe('/handwerk');
```

Run: `pnpm vitest run tests/unit/i18n.test.ts` → FAIL (Typfehler/undefined).

- [ ] **Step 2: Route** – in `src/lib/i18n.ts` nach `doctors: …` einfügen:

```ts
  craftsmen: { de: "/handwerk", en: "/handwerk" },
```

Run erneut → PASS.

- [ ] **Step 3: Footer** – in `src/components/Footer.astro` nach dem `doctors`-Eintrag:

```astro
      { href: routeFor('craftsmen', lang), label: de ? 'Handwerk (handwerkweb)' : 'Trades (handwerkweb)' },
```

- [ ] **Step 4: llms.txt** – in `src/pages/llms.txt.ts` nach der Fahrschule-Zeile:

```
- [Websites für Handwerker (handwerkweb)](https://lkmedia.net/handwerk)
```

- [ ] **Step 5: Datenschutz** – in `src/pages/datenschutz.astro` nach Abschnitt 7 einen neuen Abschnitt einfügen und die folgenden Nummern „8. Ihre Rechte“ → „9.“ und „9. Beschwerderecht“ → „10.“ ändern:

```astro
    <h2>8. handwerkweb: Bestellung, Onboarding und Formulare auf Kunden-Websites</h2>
    <p>
      Für Bestellung und Onboarding von handwerkweb gilt Abschnitt 7 entsprechend; der Versand des
      Onboardings erfolgt per E-Mail über Amazon Web Services EMEA SARL, 38 Avenue John F. Kennedy,
      L-1855 Luxemburg (Amazon SES, Region EU). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
    </p>
    <p>
      Websites unserer handwerkweb-Kunden senden Projektanfragen und Bewerbungen über unseren Server an den
      jeweiligen Betrieb. Dabei handeln wir als Auftragsverarbeiter des Betriebs (Art. 28 DSGVO);
      Verantwortlicher ist der jeweilige Betrieb. Die Einsendungen werden nur weitergeleitet und nicht
      gespeichert. Zum Schutz vor Missbrauch verarbeiten wir kurzzeitig die IP-Adresse im Arbeitsspeicher
      (Begrenzung der Einsendungen).
    </p>
```

- [ ] **Step 6: `.env.example`** (nur Namen, keine Werte)

```
RESEND_API_KEY=
TURNSTILE_SECRET_KEY=
STRIPE_SECRET_KEY=
# handwerkweb: Formular-Endpoint und Onboarding (AWS SES Mail Manager)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=lkmedia.net <no-reply@lkmedia.net>
```

- [ ] **Step 7: Doku** – in `CLAUDE.md` **und** `AGENTS.md` unter „### API“ nach der contact-Zeile ergänzen:

```md
`src/pages/api/docweb-onboarding.ts` / `handwerk-onboarding.ts` — Onboarding nach Stripe-Checkout (Payment-Link-Check in `src/lib/stripe.ts`).

`src/pages/api/handwerk/[siteId]/[form].ts` — Formular-Endpoint für handwerkweb-Kunden-Websites (Projektanfrage, Bewerbung). Empfänger/Origins nur aus `src/lib/handwerk-sites.ts`; Versand per SMTP (`src/lib/mailer.ts`, Env `SMTP_*`). Astros `security.checkOrigin` ist aus; CSRF prüft `src/lib/csrf.ts` in der Middleware.
```

- [ ] **Step 8: Gesamtcheck + Commit**

Run: `pnpm test && pnpm lint && pnpm check && pnpm build`
Expected: grün.

```bash
git add src/lib/i18n.ts tests/unit/i18n.test.ts src/components/Footer.astro src/pages/llms.txt.ts src/pages/datenschutz.astro .env.example CLAUDE.md AGENTS.md
git commit -m "feat(handwerk): link product page, privacy notes, env docs"
```

---

## Menschliche Schritte nach Teil A

- Stripe Payment Link anlegen (1.990 € einmalig + 69 €/Monat Abo; Success-URL `https://lkmedia.net/handwerk/onboarding?session_id={CHECKOUT_SESSION_ID}`), URL und `plink_…` in `HANDWERKWEB` eintragen.
- `SMTP_*`-Env in Dokploy für lkmedia.net setzen; Absenderdomain in SES verifiziert?
- AGB-Entwurf und Datenschutz-Abschnitt prüfen.
