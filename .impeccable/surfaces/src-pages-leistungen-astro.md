---
version: 1
slug: "src-pages-leistungen-astro"
primary_target: "src/pages/leistungen.astro"
related_targets: ["src/pages/en/leistungen.astro"]
---

# Services page

Mode: Persuade. Routes: /leistungen and /en/leistungen. Keep the existing homepage world and all established commercial facts.

## Direction contract

THESIS: Show how a real website, visibility and a clear inquiry path work together. Each service becomes a substantial chapter grounded in an actual project or explicitly labelled illustration.

OWN-WORLD: Inherit the homepage’s charcoal backgrounds, DM Sans display type, restrained blue accent, hairline dividers, white pill CTA and 1,240px content width.

STORY: Understand the offer, explore three service chapters, see real client work, understand the process and fixed-price scope, then inquire or book a call.

FIRST VIEWPORT: Centered two-line headline at up to 84px, short supporting paragraph and the existing CTA pattern. A wide layered composition of three real website screenshots extends into the first fold. At mobile sizes it becomes one readable lead screenshot.

FORM: Homepage-derived structure explicitly requested by the user; no new brand world. One scroll-linked moment gently separates the hero project panels. A compact sticky anchor navigation takes visitors directly to the three chapters. Content remains visible without JavaScript and with reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Implementation is code-led to extend the user-selected existing homepage composition. No standing workflow preference is inferred. Reused rasters keep their original repository bytes; no new raster assets are introduced. Global design files remain unchanged because this is a page-level extension.

## Local implementation decisions

- The services wrapper raises its inherited dim-text color to `#a1a1aa` for readable captions and shared CTA text. This is scoped to this page.
- Display tracking is `-0.04em`; global homepage typography stays untouched.
- Shared reveal targets stay visible by default within the services wrapper, including without JavaScript. The hero collage is the only scroll-linked motion.
- At small widths the shared process uses 64px vertical padding and the closing CTA 88px. Side project panels are hidden; the main image remains.
- The active section threshold includes the responsive anchor offset, so short landscape viewports also mark the section selected by its anchor.

## Finish record — 2026-10-07

Fresh finish-review verdict: **SHIP**, with no material findings or requested fixes. The review inspected the implementation, the homepage reference, desktop captures and both mobile translations. Documentation verification passed as an extension of the existing homepage world. The existing global styles remain the design source; this scoped work does not introduce a global `DESIGN.md`.

Validation: Astro check, lint, production build and all 21 existing unit tests passed. Browser checks cover both languages, responsive widths from 320px to 1440px, landscape anchor selection, keyboard FAQ controls, the mobile menu, language switching, contact destinations, metadata, reduced motion and no-JavaScript rendering. Both services routes recorded zero browser errors or failed requests. The existing external Cal.com embed on the contact page was unavailable in the verification network; booking completion and cross-engine rendering were not verified.

Raster provenance: every shipping image is an unchanged screenshot already present in `public/landing/shots/` at base commit `26c67d905a2837f340dda4b56e96ecab8aa29d2d`. No new raster assets or dependencies were added.
