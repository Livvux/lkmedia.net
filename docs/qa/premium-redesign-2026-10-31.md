# Premium redesign: QA vom 31. Oktober 2026

Die Überarbeitung erhält die deutsche URL-Struktur, die monochrome lkmedia-Marke, alle Angebote, Preise, Bestelllinks und Kundenabläufe. Gemeinsame Typografie, Abstände, Navigation und Footer verbinden Startseite, Branchenangebote, Referenzen, Kontakt und redaktionelle Seiten.

## Umsetzung

- Statischer Hero, Kennzahlen, Projektleiste und Prozess statt dekorativer React-/Canvas-/WebGL-Effekte. Die Angebots-Tabs bleiben interaktiv.
- Mobile Navigation mit Fokusumlauf, Escape, inert-Hintergrund und Skip-Link. Inhalte und zentrale Wege funktionieren auch ohne JavaScript.
- Kurze CSS-/Motion-Übergänge; Reduced Motion auch bei nachträglicher Änderung. Projektvideo mit Pause/Abspielen und automatischer Pause außerhalb des Viewports. Posteingangsbeispiele wechseln auf Nutzeraktion.
- Social-Metadaten mit Bildbeschreibung und verifizierten Standardbild-Abmessungen, konsistente Artikel-IDs und absolute Schema-URLs.
- Benannter, korrekt ausgezeichneter Vorbereitungsfortschritt; geprüfte Kontraste und lesbare Formulare.
- Keine neuen Dependencies oder Lockfile-Änderungen.

## Prüfverfahren

Checks laufen in einer isolierten Linux-Arbeitskopie auf dem Webserver, ohne Produktions-Secrets oder produktive Testdienste. Playwright verwendet Chromium; notwendige Browserbibliotheken sind nur im temporären Testverzeichnis entpackt.

Die Regressionstests prüfen Navigation, 320/390/1440-Pixel-Layouts, Kontaktwege, SEO, Weiterleitungen, interne Links, Formulare, Uploads, Onboarding und Änderungsaufträge. Neue Tests ergänzen Tastaturfokus, ausgefallene verzögerte Scripts, dynamisches Reduced Motion, Video-Pause, Vorbereitungsfortschritt und WCAG-Prüfungen.

Die Kauf-Suite simuliert Stripe, GitHub und Mail-Provider. Sie prüft Kontaktversand sowie Kauf → Konfiguration → Bestätigung → spätere Änderung für alle drei Pakete und die Ablehnung einer Session für ein falsches Produkt. Sie löst keine echten Käufe und keinen produktiven Mailversand aus.

Die ergänzende Browserprüfung lädt reale Bilder und führt vollständige axe-Prüfungen auf 13 Seiten bei 390 und 1440 Pixeln aus. Versteckte mobile Blog-Thumbnails werden nicht als defekte Bilder gewertet.

## Ergebnisse

- `pnpm install --frozen-lockfile`: erfolgreich, pnpm 12.6.0.
- `pnpm check`: 0 Fehler, 0 Warnungen; 9 bestehende Hinweise.
- `pnpm lint`: erfolgreich.
- `pnpm test`: 432 Tests erfolgreich.
- `pnpm build`: erfolgreich, zusätzlich durch Playwright vor dem Produktionslauf neu gebaut.
- `pnpm test:e2e --workers=4`: 125 Tests erfolgreich.
- `pnpm test:purchase`: 5 Tests erfolgreich; anschließend UI-Kontrastkorrekturen durch die volle E2E-Suite erneut geprüft.
- Ergänzende Browser-QA: 26 Ansichten, keine axe-Verstöße, defekten sichtbaren Bilder, Überläufe, JavaScript-/Konsolenfehler oder HTTP-Fehler. Gemessener CLS in allen 26 Ansichten: 0.
- UX-, Visual-, Motion-, SEO-, TypeScript-, Code- und QA-Reviews wurden delegiert. Konkrete Befunde wurden umgesetzt und erneut geprüft.

## Lighthouse

Die Projekt-Gates wurden auf elf Seiten geprüft: Startseite, Leistungen, Kontakt, Kanzleien, Privatkliniken, Luxus-Immobilien, docweb, handwerkweb, fahrschulweb, Blog und Kanzlei-Kostenartikel. Accessibility, SEO und Best Practices erreichten jeweils 100; alle konfigurierten Assertions bestanden.

Die abschließende Startseiten-Messung nach den Kontrast-, Beschriftungs- und Navigationskorrekturen: Performance 91, Accessibility 100, Best Practices 100, SEO 100; CLS 0; simulierter mobiler LCP 3,31 Sekunden. Das LCP-Ziel von 2,5 Sekunden ist in diesem Origin-Labortest noch nicht erreicht. Gemessen wurde direkt am Node-Server ohne produktiven Edge-Cache und ohne Textkompression. Das ist keine produktive CrUX-/Core-Web-Vitals- oder Deployment-Bestätigung.

## API- und Dokumentationsprüfung

- [Open Graph](https://ogp.me/): Social-Bild-Metadaten.
- [Schema.org BlogPosting](https://schema.org/BlogPosting): Artikel-IDs, Sprache und URLs.
- [Radix Progress](https://www.radix-ui.com/primitives/docs/components/progress): Wert an Root weitergeben und zugänglichen Namen setzen.
- Installierte Astro-, Base-UI-, Motion- und Playwright-Quellen/Typen sowie bestehende Repository-Muster für die übrigen Änderungen.

Produktionsdeployment und echte Zahlungen sind nicht Teil dieser Verifikation.
