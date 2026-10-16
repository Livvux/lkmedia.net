# SEO-Messung und Betrieb

## Ziele und Zuordnung

- `/`: Webdesign Rastatt.
- `/anwaelte`: Webdesign für Anwaltskanzleien.
- `/privatkliniken`: Webdesign für Privatkliniken.
- `/docweb`: Website für Arztpraxis erstellen lassen.
- `/handwerk`: Website für Handwerker erstellen lassen.
- `/fahrschule-webdesign`: Fahrschul-Website erstellen lassen.

Diese Zuordnung ist eine redaktionelle Ausgangshypothese. Suchvolumen und aktuelle Positionen sind damit nicht belegt. In GSC tatsächliche Suchanfragen, Landingpages und Anfragen gemeinsam auswerten; bei abweichender Suchintention korrigieren.

## Wöchentliche Auswertung

1. In Search Console die letzten 28 vollständigen Tage mit den vorherigen 28 vergleichen; bei saisonalen Themen zusätzlich Vorjahreszeitraum betrachten.
2. Markensuchen separat auswerten: `lkmedia`, `lk media` und Varianten des eigenen Namens. Klicks und Impressionen ohne diese Begriffe nach Landingpage betrachten. GSC blendet manche seltenen Suchanfragen aus; Abweichungen zwischen Query- und Seitensummen sind möglich.
3. In der vorhandenen Besuchermessung Besuche der Angebotsseiten und organische Herkunft prüfen. Plausible lädt direkt vom aktuellen Host `analytics.rpcrate.com`; die alten VertexMods-Hosts leiten weiter und dürfen nicht als Skriptquelle verwendet werden.
4. Erfolgreich an den Mailprovider übergebene Kontaktanfragen sind im Anfragetext mit `Angebotsseite` versehen. Im Serverlog steht ausschließlich `[seo] lead_received source=<bekannter Pfad>`. Keine Formulardaten oder beliebigen Referrer-URLs ins Analytics übernehmen.
5. Quelle ist die unmittelbar vorherige bekannte Seite bei Navigation zur Kontaktseite. Ohne passenden Referrer steht `/kontakt`. Kein First-Touch-Tracking, keine Attribution über mehrere Sitzungen und kein Herkunftsnachweis. Eine Quelle kann manipuliert werden.
6. Anfragen intern als passend/unpassend einordnen (Leistung, Region, Budget, realistischer Bedarf). Provider-Annahme, tatsächliche Mailzustellung, qualifizierte Anfrage und Auftrag getrennt zählen. Spam, Duplikate und eigene Tests ausschließen.
7. Für jede Landingpage getrennt berichten: organische Klicks, Besuche, zugeordnete Formularanfragen, qualifizierte Anfragen. Quotienten nur mit passendem Zeitraum und Nenner verwenden. Die einfache Referrer-Zuordnung liefert keinen belastbaren Kanal-Conversion-Wert. Telefon, Terminbuchung und Paketkäufe sind zusätzliche, hier nicht automatisiert als Lead erfasste Wege.

## Search Console und Indexierung

Der vorhandene Wrapper auf `mini` ist der bevorzugte Zugang:

```sh
ssh mini "gsc sites"
ssh mini "gsc sitemaps sc-domain:lkmedia.net"
ssh mini "gsc analytics sc-domain:lkmedia.net 30"
ssh mini "gsc inspect sc-domain:lkmedia.net https://lkmedia.net/"
ssh mini "gsc inspect sc-domain:lkmedia.net https://lkmedia.net/en/blog/"
```

Property erst nach `gsc sites` auswählen. Bei vorhandener Berechtigung die aktuelle Sitemap einreichen:

```sh
ssh mini "gsc submit sc-domain:lkmedia.net https://lkmedia.net/sitemap-index.xml"
```

Nach Veröffentlichung die vier neuen Artikel prüfen. Alte englische URLs sollen zur passenden deutschen Seite weiterleiten; unbekannte URLs müssen 404 liefern. Alte Sammel-301 können in Browsern und Zwischen-Caches länger vorhanden sein. Keine Massenentfernung in GSC veranlassen.

Am 16.10.2026 war der Wrapper aus dieser Umgebung wegen `Permission denied (publickey)` nicht erreichbar. Deshalb wurde weder eine GSC-Baseline behauptet noch eine Sitemap-Einreichung als erledigt markiert.

## Core Web Vitals

Lighthouse-CI prüft Startseite, Branchen- und Paketangebote, Blog und einen Kaufberater mit mobiler Standardemulation. HTML-/JSON-Berichte sind Laborwerte. Sie ersetzen keine Felddaten; insbesondere ist TBT kein gemessener INP.

In PageSpeed Insights beziehungsweise im GSC-Bericht zu Core Web Vitals verfügbare mobile Felddaten über 28 Tage prüfen: LCP, INP, CLS und den jeweiligen Messumfang (URL oder Origin). Bei zu wenig Besuchern ist fehlende Felddatenabdeckung kein bestandener Test.

Die öffentliche PageSpeed-API lieferte am 16.10.2026 HTTP 429 (`Quota exceeded`). In diesem Durchlauf waren deshalb keine aktuellen Felddaten abrufbar. Beworbene Werte von Kundenprojekten sind kein Performance-Nachweis für lkmedia.net.

## Local SEO und Referenzen

Unternehmensdaten aus dem Impressum sind die Referenz für Schema und Verzeichnisse: lkmedia, Felchenstraße 21, 76437 Rastatt, lucas@lkmedia.net. Keine Telefonnummer, Öffnungszeiten, Bewertungen oder Koordinaten erfinden.

Ein Google-Unternehmensprofil nur mit geprüfter Berechtigung und nach Prüfung eines vorhandenen Eintrags bearbeiten. Keine zusätzlichen Profile oder künstlichen Ortsstandorte erzeugen. Regionale Verlinkungen aus realen Kooperationen, Kundenbeziehungen oder relevanten Unternehmensverzeichnissen entwickeln. Keine Links kaufen und keine ungefragten Nachrichten versenden.

Für Kanzleien, Privatkliniken und Luxus-Immobilien liegen derzeit keine veröffentlichten Branchenreferenzen in der Sammlung vor. Andere Projekte sind als solche eingeordnet; Produktdemos sind keine Kundenprojekte. Neue Branchenergebnisse erst nach belegtem Projekt und Freigabe veröffentlichen.

## Automatische Qualitätskontrolle

`pnpm test:e2e` prüft sämtliche Sitemap-Seiten im gebauten Node-Server, interne Linkziele ohne Weiterleitungsverfolgung, Bilder einschließlich `srcset` und OG, gültiges JSON-LD, echte 404 und gezielte Legacy-301. Weitere Tests prüfen sichtbare H1 und Überläufe bei 390/1280 px sowie die Verbindung von Ratgebern und Angeboten. `pnpm test:purchase` prüft den Kontaktversand mit simulierten Diensten einschließlich Quellenzuordnung. Keine echten Käufe oder Anfragen für QA auslösen.
