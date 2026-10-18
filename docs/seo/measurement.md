# SEO-Messung und Betrieb

## Ziele und Zuordnung

- `/`: Webdesign Rastatt und die bestehende lokale SEO-Intent-Gruppe.
- `/leistungen`: Paketpreise, Gesamtkosten und Wahl des Angebotsmodells.
- `/anwaelte`: Webdesign für Anwaltskanzleien.
- `/privatkliniken`: Webdesign für Privatkliniken.
- `/docweb`: Website für Arztpraxis erstellen lassen.
- `/handwerk`: Website für Handwerker erstellen lassen.
- `/fahrschule-webdesign`: Fahrschul-Website erstellen lassen.

Die [Baseline vom 18.10.2026](2026-10-18-audit.md) belegt Suchimpressionen für lokale SEO-/Webdesign-Anfragen auf der Startseite. Andere Themenprioritäten bleiben redaktionelle Hypothesen, keine gemessenen Suchvolumen. Vor einer neuen Route prüfen, ob sie eine bestehende Intent-Gruppe dupliziert.

## Wöchentliche Auswertung

1. In Search Console die letzten 28 vollständigen Tage mit den vorherigen 28 vergleichen; bei saisonalen Themen zusätzlich Vorjahreszeitraum betrachten.
2. Zuerst den Host filtern: `meow.lkmedia.net` aus der Agentur-Auswertung ausschließen. Die Domain-Property enthält alle Subdomains (aktuelle Baseline: 119 von 132 Klicks auf MeowSynth). Markensuchen separat auswerten: `lkmedia`, `lk media` und Varianten des eigenen Namens. Klicks und Impressionen ohne diese Begriffe nach Landingpage betrachten. GSC blendet manche seltenen Suchanfragen aus; Abweichungen zwischen Query- und Seitensummen sind möglich.
3. In der vorhandenen Besuchermessung Besuche der Angebotsseiten und organische Herkunft prüfen. Plausible lädt direkt vom aktuellen Host `analytics.rpcrate.com`; die alten VertexMods-Hosts leiten weiter und dürfen nicht als Skriptquelle verwendet werden.
4. Erfolgreich an den Mailprovider übergebene Kontaktanfragen enthalten `Angebotsseite` und die freiwillige `Herkunft (Selbstauskunft)`. Im Serverlog stehen nur feste Kategorien: `[seo] lead_received source=<bekannter Pfad> discovery=<erlaubte Kategorie>`. Keine Formulardaten oder beliebigen Referrer-URLs ins Analytics übernehmen. Versandfehler und Honeypot-Treffer zählen nicht als Lead.
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

Wenn die Sitzung bereits auf `mini` läuft, `gsc` direkt ausführen. Am 18.10.2026 funktionierte der lokale Wrapper trotz fehlgeschlagenem SSH auf denselben Rechner. Property und vollständige Zeitfenster sind damit aktuell geprüft; die frühere Zugangslücke vom 16.10. ist überholt. Die Sitemap wurde für diesen noch unveröffentlichten Branch nicht erneut eingereicht.

```sh
gsc sites
gsc seo-summary sc-domain:lkmedia.net 28 200
gsc inspect sc-domain:lkmedia.net https://lkmedia.net/handwerk
```

## Ereignisse und Vertriebsabgleich

| Signal | Ort / Eigenschaften | Was es belegt |
|---|---|---|
| Seitenaufruf / Trafficquelle | Plausible; zusätzlich Umami-Seitenaufruf ohne Referrer | Besuch, keine Kaufabsicht oder Personenzuordnung |
| `contact_click` | Umami: Canonical-Seite, Ziel `form`, `appointment` oder `email` | Klick auf Kontaktweg, keine versendete Anfrage oder gebuchter Termin |
| `checkout_click` | Umami: Canonical-Angebotsseite, Ziel `docweb`, `handwerkweb`, `fahrschulweb` | Klick auf Stripe-Link, keine Registrierung oder Zahlung |
| `demo_click` | Umami: Canonical-Seite, festes Produktziel | Demo-Interesse, kein Lead |
| `lead_received` | Serverlog nach Resend-Annahme; erlaubter Angebotspfad und Herkunftskategorie | Provider-Annahme, keine Zustell- oder Qualitätsgarantie |
| Qualifiziert / Auftrag / bezahlt | Bestehender interner Vertriebsprozess und Stripe/Buchhaltung | Passung, Abschluss, tatsächlicher Erlös separat prüfen |

Umami sendet ausschließlich Objekt-Payloads mit festen Zielnamen; keine Formulardaten, Linklabels, Referrer, Querys, Fragmente oder personenbezogenen IDs. Gilt nur für freigegebene öffentliche HTTPS-Produktionsseiten, weiterhin mit DNT/GPC- und Privatpfad-Sperren. Trackingfehler blockieren keine Navigation. Kein Local-/SessionStorage und kein zusätzlicher Cross-Domain-Identifier in dieser Implementierung.

Nach Deployment im Dashboard nach den drei Ereignisnamen filtern und nach Seite/Ziel aufteilen. Die real ausgelieferte Tracker-Datei wird in isolierten Browser-Fixtures getestet; der Empfang im produktiven Collector und das Reporting müssen zusätzlich nach Veröffentlichung bestätigt werden. QA-Aufrufe nicht als echte Leads verwenden.

`discovery` ist eine freiwillige Selbstauskunft mit festen Werten `unknown`, `google`, `bing`, `chatgpt`, `perplexity`, `other_ai`, `referral`, `social`, `other`. Beliebige Werte fallen auf `unknown` zurück. Die Angabe wird in der Anfrage-Mail verarbeitet und nicht an Analytics geschickt. Sie kann falsch sein; ein `google`-Wert trennt insbesondere klassische Suche, Anzeigen und AI Overviews nicht.

Für jede Anfrage im vorhandenen internen Prozess Angebot, Selbstauskunft/„unbekannt“, Passung und Vertriebsstatus erfassen. Bei Abschluss tatsächlichen Netto-Zahlungseingang und Erstattungen zuordnen. Keine Kundendaten ins Repository übernehmen. Es gibt hier keinen Registrierungsprozess und noch keinen signierten, idempotenten Stripe-/CRM-Attributionsabgleich. Danke-Seiten oder wiederholte Onboarding-Aufrufe sind kein Zahlungsereignis. Plausible-Besuchsquellen und Umami-Klicks ohne gemeinsamen Identifier nicht zu einer belastbaren Kanal-Umsatz-Conversionrate verrechnen.

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
