# Dogfood-Report: lkmedia.net

- **Datum:** 2026-10-19
- **Ziel:** https://lkmedia.net (Live)
- **Umfang:** Sitemap (39 URLs) + /robots.txt, /llms.txt, /rss.xml, /en/, /aenderung; Desktop 1280 px, Mobile 320/360/390 px
- **Nicht getestet:** echter Formularversand (Turnstile), Stripe-Checkout, Onboarding-/Änderungs-Pipeline mit gültiger session_id, Cal.com-Buchung

## Zusammenfassung

| Schweregrad | Anzahl |
|---|---|
| critical | 0 |
| high | 0 |
| medium | 2 |
| low | 2 |
| **Gesamt** | **4** |

Unauffällig: alle 39 Sitemap-URLs und alle internen Links/Assets (164 geprüft) liefern 200; keine JS-Fehler/Konsolenwarnungen auf 14 besuchten Seiten; kein Overflow auf Desktop; `/en/` → 301 auf `/`; unbekannte URL → 404; Canonical und genau ein `<h1>` auf jeder Seite; alle Bilder laden und haben alt-Text; Kontaktformular-Validierung (Pflichtfelder, E-Mail-Format) funktioniert; `/aenderung` ohne `session_id` zeigt 403 mit verständlicher Meldung (gewollt).

## Findings

### ISSUE-001: /datenschutz scrollt mobil horizontal (medium, Visual)
- **Evidenz:** `screenshots/issue-001.png`
- **Beobachtung:** Auf 320, 360 und 390 px ist die Seite 512 px breit. Ursache: die H1 „Datenschutzerklärung" ist 488 px breit, der Container nur 342 px. Das Wort bricht nicht um.
- **Wirkung:** Seitliches Wackeln/Scrollen auf allen Handys, rechts abgeschnittene Überschrift.
- **Vorschlag:** H1-Schriftgröße mobil verkleinern (clamp) oder `overflow-wrap: anywhere` / `hyphens: auto` setzen. Prüfen, ob die anderen Rechtsseiten (AGB-Seiten) dieselbe H1-Klasse nutzen.

### ISSUE-002: Startseite mobil: „Alle Cases" abgeschnitten (medium, Visual)
- **Evidenz:** `screenshots/issue-002-mobile-home.png`
- **Beobachtung:** Bei 390 px endet der Link bei x=404, die Sektion hat `overflow: hidden`. Zu sehen ist „Alle Cas…". Die Überschrift „ARBEITEN" ist so groß, dass der Link rechts herausgedrückt wird.
- **Wirkung:** Wichtiger CTA zur Case-Übersicht schwer lesbar und schlecht antippbar.
- **Vorschlag:** Header-Zeile mobil umbrechen lassen (`flex-wrap`) oder Link unter die Überschrift setzen.

### ISSUE-003: Blogpost „Website-Technologien erkennen": Tabelle sprengt mobil das Layout (medium, Visual)
- **Evidenz:** `screenshots/issue-003-blog-overflow.png`
- **Beobachtung:** URL `/blog/how-its-built-website-technologien-erkennen/`. Bei 360 px ist die Seite 409 px breit. Die dreispaltige Tabelle (Technologie-Bereich / Beispiele / Nutzen) ist 372 px breit und wird nicht scrollbar gekapselt.
- **Vorschlag:** Markdown-Tabellen im Blog-Layout in einen Wrapper mit `overflow-x: auto` setzen (gilt dann für alle Posts).

### ISSUE-004: Title-Tags oft über 60 Zeichen (low, SEO)
- **Beobachtung:** Durch das Suffix „ · lkmedia" liegen mehrere Titles bei 70–80 Zeichen, z. B. `/cases/cleo-coaching` (80), `/cases/streamerloft` (71), `/case-study-patricks-fahrschule-local-seo/` (72), `/privatkliniken` (74), `/blog/arztpraxis-website-erstellen-lassen/` (70). Das Schema erlaubt ≤70 für den Post-Titel, das Suffix wird aber obendrauf gesetzt.
- **Wirkung:** Abschneiden in den Suchergebnissen, Keywords am Ende gehen verloren.
- **Vorschlag:** Suffix weglassen, wenn Titel + Suffix > 60, oder Schema-Grenze auf ~50 senken.

## Hinweise ohne Finding
- `/help` und `/phone-privacy` stehen in der Sitemap, mit Titeln „Phone Hilfe" / „Phone Datenschutz" und passen thematisch nicht zur Agentur-Seite. Falls das die Support-Seiten einer App sind, ist es gewollt, sonst aus der Sitemap nehmen.
- `/imprint` ist ein englischer Slug auf einer rein deutschen Seite (Footer „Impressum"). Kosmetisch, nur relevant, wenn ein deutscher Slug gewünscht ist.
- `chat.openai.com` liefert beim curl-Check 403 (Bot-Schutz, kein Defekt).
