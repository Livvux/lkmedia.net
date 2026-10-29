# Lokale SEO-Anfragen: Umsetzung und Auswertung

Stand: 29.10.2026. Verantwortlich: Lucas. Angebot: SEO-Analyse und Optimierung bestehender Websites, auch anderer Anbieter. Keine verbindlichen Preise oder neuen Ergebnisversprechen festgelegt.

## Angebot und Anfrageweg

- `/seo-rastatt`: kostenloses 15-Minuten-Erstgespräch, bezahlte Analyse zum vereinbarten Festpreis, separates Umsetzungsangebot, optionale weitere Betreuung.
- Umfang vor Beauftragung festlegen: Website, Einzugsgebiet, relevante Leistungsseiten, Zugänge und mögliche Änderungen am bestehenden System.
- CLEO Coaching als dokumentiertes Beispiel für Arbeiten an einer bestehenden Website. Kundenstimme ist qualitatives Feedback, keine quantitative Rankingmessung.
- Eigener Anfragebereich mit Website-Adresse, Leistung und Einzugsgebiet als Hilfetext. Keine neuen Pflichtfelder. Serverseitige Herkunft `/seo-rastatt` bleibt ohne JavaScript erhalten.
- Die 25.000-€-Untergrenze individueller Website-Projekte gilt nicht für SEO-Aufträge. Analyse- und Umsetzungspreise werden separat angeboten.

## Vorher und nachher messen

Ausgangszeitraum: 30.09.–27.10.2026, Google-Websuche, Search Console, Domain-Property `sc-domain:lkmedia.net`. Im Planungsgespräch direkt erhoben:

- Agentur-Hauptdomain: 11 Klicks einschließlich Blog, Cases und Impressum. Nicht als qualifizierte Anfragen zählen.
- `meow.lkmedia.net`: 107 Klicks, vom Agenturgeschäft getrennt betrachten.
- Suchanfrage `seo agentur rastatt`: 125 Einblendungen, 0 Klicks, durchschnittliche Position 8,21; Zielseite bisher `/`.
- Das ist weder eine Suchvolumenmessung noch eine feste Platzierung aus Rastatt. Eigene Prüfungen, Suchstandort und Geräte können die Beobachtung beeinflussen.

Release-Datum und Commit bei Veröffentlichung ergänzen. Zwei vollständige 28-Tage-Zeiträume nach Veröffentlichung auswerten und die Startseite sowie `/seo-rastatt` gemeinsam nach Suchanfrage betrachten. Kleine Fallzahlen absolut berichten. Ein Vorher-nachher-Vergleich beweist keine Kausalität.

Wöchentlich erfassen:

1. Indexierungsstatus und von Google gewählte kanonische URL der neuen Seite.
2. Suchanfragen, Zielseiten, Einblendungen, Klicks und Positionen für das lokale SEO-Angebot. Markenanfragen getrennt betrachten.
3. Kontakteinstiege in Umami getrennt von tatsächlich eingegangenen Formularen und Kalenderbuchungen. Das bestehende Tracking zählt Klicks, keine bestätigten Buchungen oder Zustellungen.
4. Qualifizierte Anfragen, Angebote, gewonnene Aufträge, tatsächliche Zahlungen und Zeitaufwand in der privaten Vertriebsablage. Selbstauskunft zur Herkunft ist keine lückenlose Attribution.

Keine Interessentendaten im Repository speichern. Der bestehende Kontakt-Endpunkt protokolliert erfolgreiche Providerannahme mit erlaubtem Angebotsseitenpfad; das beweist keine Inbox-Zustellung. Formulartests simulieren den Versand.

## Google-Unternehmensprofil: noch zu prüfen

Öffentliche Drittanbieter-Snapshots liefern unterschiedliche historische Bewertungszahlen und Öffnungszeiten. Diese nicht als aktuellen Google-Profilstand übernehmen.

- Tatsächliches Profil und Verwaltungszugriff feststellen; aktuelles öffentliches Profil dokumentieren.
- Name, passende Hauptkategorie, Leistungen, Telefonnummer, Website-Link, Erreichbarkeit und Kundenempfang/Vor-Ort-Service abgleichen.
- Daten mit Website und vorhandenen relevanten Verzeichniseinträgen vergleichen. Nur belegte Abweichungen korrigieren.
- Aktuelle Rezensionen, Antworten und verfügbare Profil-Leistungsdaten prüfen.
- Echte Kunden neutral um ehrliches Feedback bitten, ohne Anreiz oder Bewertungsvorgabe. Keine Nachrichten wurden im Rahmen der Website-Umsetzung versendet.
- Tatsächlich angezeigten Google-Titel für die lokale Suche auf Mobilgerät und Desktop mit Datum und Suchstandort festhalten. Exa-Suchergebnisse sind kein Google-Rankingbeleg.

Quellen: [Google-Profilrichtlinien](https://support.google.com/business/answer/3038177?hl=de), [Bewertungen anfragen](https://support.google.com/business/answer/3474122?hl=de), [Suchergebnistitel](https://developers.google.com/search/docs/appearance/title-link).

## Reihenfolge nach dem Website-Release

- Woche 1: Indexierung und Suchdarstellung prüfen, Unternehmensprofil abgleichen, Preise aus dem tatsächlichen Analyseaufwand kalkulieren.
- Wochen 2–4: Echte Rückfragen und Einwände sammeln. Fehler in Kontaktwegen sofort korrigieren. Keine wöchentlichen Titelwechsel bei geringen Fallzahlen.
- Wochen 5–8: Vollständige Zeiträume auswerten. Bei Einblendungen ohne Klicks Suchdarstellung und Suchintention prüfen; bei Besuchen ohne Anfragen Angebot und Einstieg; bei unpassenden Anfragen Zielgruppe und Leistungsumfang.
- Danach entscheiden, welche konkrete Änderung durch die Beobachtungen gestützt wird. Keine automatische Veröffentlichung weiterer Ortsseiten oder bezahlter Kampagnen.

## Prüfbeleg vor Veröffentlichung

- `webserver`: temporäre systemd-Sandbox mit eigenem Benutzer, schreibgeschütztem Hostsystem, abgeschirmten Home-Verzeichnissen und begrenztem RAM-Dateisystem. Keine Produktions-Umgebungsdateien, keine Host-Paketinstallation und kein Produktions-Docker verwendet.
- `pnpm install --frozen-lockfile`, `pnpm check` (0 Fehler, 0 Warnungen, 9 vorhandene Hinweise), `pnpm lint`, 432 Unit-Tests und Produktionsbuild bestanden. Lockfile unverändert.
- `pnpm test:e2e --workers=2`: 114 Tests bestanden. SEO-Seite bei 320, 390 und 1280 px einschließlich Formular-POST, Herkunftszuordnung, Sitemap, Laufzeitfehlern und lokalen HTTP-Fehlern geprüft. Screenshots visuell geprüft; mobiler Überschriftenumbruch korrigiert.
- `pnpm test:purchase --workers=2`: 5 Tests mit simulierten Stripe-, GitHub- und SMTP-Diensten bestanden. Kein echter Kauf und keine echte Kontaktanfrage ausgelöst.
- Unabhängige Code- und TypeScript-Reviews ohne offene Findings. Framework-Schnittstellen anhand vorhandener Astro-Muster und lokaler Typen geprüft.
- Diese Belege betreffen den isolierten Build. Öffentliches Deployment, aktuelle Google-Suchdarstellung, Unternehmensprofil und echte Zustellung sind gesonderte Prüfschritte.
