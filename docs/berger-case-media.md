# Medien und Technikbelege: Eichhörnchen Berger

Die lokalen Medien in `public/cases/eichhoernchenberger/` wurden am
11. Oktober 2026 mit dem T3-Browser von der öffentlichen Live-Website aufgenommen.
Die Screenshots wurden ohne inhaltliche Bearbeitung als WebP gespeichert.

| Datei | Quelle | Aufnahme |
| --- | --- | --- |
| `desktop.webp` | https://eichhoernchenberger.de/ | Desktop, 1280 × 800 px |
| `mobile-emergency.webp` | https://eichhoernchenberger.de/eichhoernchen-gefunden | Mobil, 390 × 1050 px |
| `stories.webp` | https://eichhoernchenberger.de/tiergeschichten | Desktop, 1280 × 800 px, zu den ersten Karten gescrollt |
| `walkthrough.mp4` | Startseite → Erste-Hilfe-Überblick → Notfallseite → Tiergeschichten | 1280 × 800 px, H.264, ca. 12 Sekunden, ohne Ton |

Das Video wird mit nativen Steuerelementen, Vorschaubild und `preload="none"`
eingebunden. Die begleitenden Texte beschreiben die Abfolge auch ohne Wiedergabe.

Technische Aussagen wurden gegen `Livvux/berger`, Commit
`623c6744fcc7457f7c104aba1335b3f6048f0603`, geprüft:

- `package.json`, `astro.config.mjs`, `wrangler.jsonc`: Stack und statisches Hosting.
- `src/content.config.ts`: Markdown-Sammlungen und Zod-Prüfung.
- `src/pages/index.astro`: Bildverarbeitung und responsive Größen.
- `src/layouts/BaseLayout.astro`: lokale Fonts, Metadaten, Canonicals und JSON-LD.
- `src/components/InstagramSection.astro`, `Gallery.astro`: gezieltes Nachladen und Galerie.
- `src/pages/[...path].md.ts`, `llms.txt.ts`, `llms-full.txt.ts`: maschinenlesbare Artikel.
- `scripts/check-seo.mjs`: Prüfungen der generierten Website.

Die separat verlinkte Pfotenweb-Plattform wurde auf https://pfotenweb.de/ geprüft.
Die Fallstudie schreibt dem Berger-Projekt keine Verwaltungsfunktionen dieser
Plattform und keine ungemessenen Reichweiten-, Spenden- oder Rettungsergebnisse zu.
