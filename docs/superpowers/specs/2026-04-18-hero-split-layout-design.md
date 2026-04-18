# Hero Split Layout — Design Spec

**Date:** 2026-04-18  
**Status:** Approved

## Problem

Hero-Section (`src/components/landing/Hero.astro`) fühlt sich leer an — zentrierter Text auf reinem schwarzen Hintergrund ohne visuellen Anker.

## Solution

Split-Layout: Text links, 3D-angewinkeltes Website-Mockup rechts. Zeigt sofort Qualität der Arbeit.

---

## Hero.astro — Änderungen

### Layout

- `grid grid-cols-1 md:grid-cols-2` statt zentrierter Flex-Column
- Text-Spalte links: `items-start text-left`
- Device-Spalte rechts: `items-end justify-center overflow-visible`
- Mindesthöhe bleibt `min-h-[92vh]`

### Neues Badge

Über der Headline: kleines Label-Badge.

- Text: `"Web Design & SEO"` (kein Punkt/Icon)
- Stil: `bg-white text-black dark:bg-black dark:text-white` + `border border-black/10 dark:border-white/10`
- Typografie: `text-xs font-medium uppercase tracking-widest rounded-full px-3 py-1`

### Device Mockup

- Neues optionales Prop: `deviceImage?: string` (default `/landing/device.webp`)
- Transform: `perspective(700px) rotateY(-16deg) rotateX(5deg)`
- `transform-origin: bottom center`
- Schatten: `shadow-[−28px_20px_80px_rgba(0,0,0,.8)]` + subtle `ring-1 ring-white/5`
- Gerät wächst aus dem unteren Bildrand heraus (kein bottom-padding in der Spalte)
- **Mobile (`md` breakpoint):** Device-Spalte `hidden md:flex` — nur Text auf kleinen Screens

### Props-Interface (erweitert)

```ts
interface Props {
  headline: string
  sub: string
  ctaHref: string
  ctaLabel: string
  secondaryHref?: string
  secondaryLabel?: string
  deviceImage?: string  // neu
  deviceAlt?: string    // neu
}
```

### Metrics (in der Text-Spalte, unter dem Sub)

Drei kleine Kennzahlen in einer Zeile, aus den ValueCards übernommen:

| Wert | Label |
|------|-------|
| `<1s` | LCP |
| `100` | Lighthouse |
| `A+` | Design |

Stil: `font-semibold text-lg` für Wert, `text-xs text-white/40 uppercase tracking-widest` für Label.

---

## index.astro (DE) — Änderungen

```astro
<Hero
  headline="Premium-Websites, die Kunden gewinnen."
  sub="Apple-Grade Design. Lighthouse 100. Conversion-optimiert."
  ctaHref="/kontakt" ctaLabel="Projekt starten"
  secondaryHref="/kontakt#termin" secondaryLabel="15 min Call"
  deviceImage="/landing/device.webp"
  deviceAlt="Kundenprojekt: P&M Plakatwerbung" />
```

## en/index.astro — Änderungen

Analoges Update mit EN-Props und `deviceImage="/landing/device.webp"`.

---

## ScrollDevice — Zweites Projekt

`ScrollDevice` bleibt direkt unter dem Hero, bekommt aber ein neues Projekt als Screenshot.

- Neues Bild: `/landing/device-2.webp` — Screenshot von **patricks-fahrschule.de** oder **me-reifen.de**
- Das Bild muss noch erstellt werden (Screenshot via `scripts/shot.mjs`)
- Kein anderer Code ändert sich an `ScrollDevice.astro`

---

## Was sich NICHT ändert

- ValueCards, NicheTiles, CaseTeaser, Process, CTABlock — unverändert
- SEO-Meta, JSON-LD — unverändert
- Dark-only Farbschema der Site — unverändert

---

## Out of Scope

- Animationen / Scroll-Parallax auf dem Hero-Gerät
- Weitere Mockup-Varianten (Video, Carousel)
- Hintergrundbehandlung (Grid, Gradient Mesh) — wird durch das Gerät gelöst
