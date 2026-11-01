# Azuris-inspirierte Bewegung für die Startseite

## Befund und Umsetzung

Ausgangspunkt ist die gemergte PR #40 (`0a4fe84`). Sie übernimmt die gestalterische Grundrichtung, ergänzt bei Bewegung aber nur einen generischen 8-Pixel-Fade-in. Die im Browser untersuchte Referenz unter https://azuris-nextjs.vercel.app/index-digital-agency lädt GSAP, ScrollTrigger und Lenis. Prägend sind der beim Scrollen feststehende Einstieg mit durchwandernden Bildern, gestaffelte Textauftritte und große Bildflächen.

Die Ergänzung verwendet die bereits installierte Motion-Version 14.1.0 und CSS:

- Desktop: feststehende Hero-Szene über 240 svh mit vier eigenen Projektbildern, deren Position, Größe, Drehung und Transparenz der nativen Scrollposition folgen.
- Direkt ausgelieferter Hero-Text; sein Desktop-Auftritt läuft per CSS. Auf kleinen Displays bleibt die erste Überschrift sofort lesbar.
- Maskierte Wort-Reveals für Abschnittsüberschriften und große Textblöcke; die Einleitung füllt sich beim Scrollen.
- Bildparallax für Projekte und Portrait, versetzte Projektspalten und eine während der Leistungszeilen stehenbleibende Überschrift.
- Großzügiger Abschluss mit bewegter Konturtypografie, deutlicherer Projektaktion und Hover-Feedback.
- Natürliche Linknamen in der Navigation und korrigierter Logo-Linkname im Footer.

Die Umsetzung nutzt native Scrollpositionen. Sie ergänzt keine Canvas-/WebGL-Effekte, React-Inseln, Dependencies oder Lockfile-Änderungen. Texte und Kontaktwege bleiben ohne JavaScript verfügbar. Die lange Hero-Szene wird ausschließlich bei passender Desktopgröße und aktiver Bewegung eingerichtet. Ein dynamischer Wechsel zu `prefers-reduced-motion` entfernt Scrollbindungen, Animationen und die zusätzliche Szenenhöhe.

## Verifikation

Die abschließenden Checks laufen lokal auf dem MacBook.

- `pnpm check`: keine Fehler oder Warnungen, neun vorhandene Hinweise.
- `pnpm lint`: erfolgreich.
- `pnpm test`: 432 Unit-Tests erfolgreich.
- `pnpm test:e2e --workers=4`: 129 Tests erfolgreich, einschließlich der drei neuen Motion-Regressionstests.
- `pnpm test:purchase`: fünf simulierte Kontakt-/Kauf-/Onboarding-Abläufe erfolgreich; keine echten Käufe oder produktiven Mailzustellungen.
- Produktionsbuild erfolgreich, zuletzt ohne Kauf-Testumgebung erstellt.

Die neuen Regressionstests prüfen die Bindung der Projektbilder an die Scrollposition, das feststehende Hero-Verhalten, lesbare Überschriften, echte Kontakt-/SEO-Wege, die Abschaltung bei dynamischem Reduced Motion, die Rückkehr zur Desktopdarstellung, Mobilparallax und fehlenden horizontalen Überlauf. Die bestehende Reduced-Motion-Prüfung wartet auf das Ende kurzer Übergänge, statt den Zustand innerhalb desselben Renderframes auszuwerten.

Die ergänzende visuelle Prüfung nutzt den Produktionsbuild, Chromium und WebKit bei 1440 × 900 und 390 × 844 sowie Chromium bei 1024 × 600. Geprüft werden Hero, Hero beim Scrollen, Einleitung, Projekte, Leistungen, Portrait und Abschluss. Externe Analytics werden bei dieser isolierten Prüfung blockiert. Die Aufzeichnung und Screenshots liegen lokal unter `/tmp/lkmedia-motion-qa/`.

Alle fünf Browser-/Viewport-Konfigurationen ohne horizontale Überläufe, defekte Bilder, JavaScript-/Konsolenfehler oder fehlgeschlagene lokale Ressourcen. Nach dynamischem Reduced Motion jeweils null laufende Animationen und keine zusätzliche Hero-Szenenhöhe. Ein unnötiger Textschatten wurde entfernt, damit WebKit beim Wechsel keine geerbten Textschatten-Übergänge startet. Danach zusätzlich 14 Motion-/Accessibility-Regressionstests erfolgreich.

## Performance-Grenze

Lighthouse am unkomprimierten lokalen Node-Origin: Performance 84, Accessibility 100, Best Practices 100, SEO 100; CLS 0, mobiler simulierter LCP rund 4,06 Sekunden. Der mobile LCP-Zielwert ist damit noch nicht erreicht; der Performance-Warnwert des Repositorys liegt bei 85. Das ist eine lokale Labormessung, keine Produktions-/CrUX-Bestätigung. Beide gefundenen Logo-Namensabweichungen sind im abschließenden Audit behoben. Report: `/tmp/lkmedia-motion-lighthouse.html`.

## API-Prüfung und Review

Motion `animate`, `inView`, `scroll`, `stagger`, Offsets und Cleanup wurden mit den installierten Paketquellen/-typen und den offiziellen Motion-Dokumenten über Context7 geprüft: https://motion.dev/docs/scroll und https://motion.dev/docs/animate.

Der abschließende Diff-Review umfasst Lebensdauer und Abbruch der Animationen, wiederholte Media-Query-Wechsel, statische Fallbacks, Tastaturbedienung, zugängliche Namen, Asset-Ladevorgänge und Beschränkung auf die Startseitengestaltung. Formulare, Zahlungsprüfung und produktive APIs werden nicht verändert.

Ein Produktionsdeployment ist nicht Teil dieser Abnahme.
