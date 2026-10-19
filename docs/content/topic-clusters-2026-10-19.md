# Redaktionelle Themencluster für lkmedia.net (19.10.2026)

## Ziel

Nützliche, aktuelle Informationen für **tatsächliche Interessenten** statt Content-Masse: Besucher sollen eine konkrete Entscheidung treffen können, etwa zwischen Website-Paket und individuellem Projekt. Die bestehende Suchintention und URL jeder Seite bleibt erhalten; neue „Pillar“-URLs oder Ortsseiten sind vorerst nicht nötig.

## Bestand (Repo am 19.10.2026)

13 MDX-Beiträge: 12 potenziell indexierbar und ein bestehender `noindex`-Beitrag (Real-Debrid). Zehn Beiträge gehören fünf sinnvollen Gruppen an. Zwei allgemeine KI-Themen bleiben unter „Weitere Einblicke“, ohne eine künstliche Clusterzuordnung. Die Gruppierung betrifft die Navigation, **keine neuen indexierbaren URLs**.

| Thema | Bereits vorhandene Unterbeiträge | Bestehende kommerzielle Zielseite |
| --- | --- | --- |
| Kanzleien | Kanzlei-Marketing; Google-Unternehmensprofil/Local SEO; Kanzlei-Website-Kosten | `/anwaelte` |
| Fahrschulen | Marketingmaßnahmen; Fahrschul-Website-Kosten; Patricks Fahrschule (Fallstudie) | `/fahrschule-webdesign` |
| Arztpraxen | Praxis-Website erstellen lassen | `/docweb` |
| Handwerk | Webdesign für Handwerker | `/handwerk` |
| SEO & Website-Technik | Rank Math; How Its Built | Noch kein eigenständiger informationsorientierter Hub |

Die Hauptseiten verkaufen Leistungen. Die Artikel helfen bei konkreten Teilfragen. Unterbeiträge verweisen zu inhaltlich passenden Nachbarartikeln und zur bestehenden Angebotsseite, ohne Keyword-gestopfte Links.

## Redaktionelle Aufgaben (nach Priorität)

| Priorität | Maßnahme | Warum / Abnahmekriterium |
| --- | --- | --- |
| P0 | **Patricks Fahrschule: Belege auditieren** | Überschrift und Inhalt nennen historische Top-Rankings, 671 Klicks und Wettbewerbsbehauptungen. Vor aktiver Bewerbung Messzeitraum, Suchanfrage, Messmethode und Screenshots gegen Rohdaten abgleichen; unbelegte Absolutbehauptungen abschwächen. Keine aktuellen Rankings aus alten Grafiken ableiten. |
| P0 | **Bestandsartikel auf inhaltliche Überschneidung prüfen** | Kanzlei-Marketing (Überblick), Kanzlei-Local-SEO (Unternehmensprofil) und Kanzlei-Kosten (Projektplanung) müssen unterschiedliche Fragen beantworten. Dasselbe bei Fahrschule-Marketing vs. Fahrschul-Website-Kosten. Bei Doppelungen vorhandenen Artikel aktualisieren, statt einen dritten zu schreiben. |
| P1 | **Praxis-/Handwerks-Guides mit eigenen Belegen ausbauen** | Konkrete Formulare, Screenshots, Prozess und Grenzen der Pakete erklären, sofern verifizierbar und veröffentlichungsfähig. Die bestehenden URLs nutzen. |
| P1 | **Technikartikel regelmäßig auf Gültigkeit prüfen** | Rank Math, How Its Built und Modell-Ranking haben veränderliche Versionen/Benchmarks. Für reine historische Artikel den Zeitstand deutlich nennen, keine künstlich aktualisierten Daten. |
| P2 | **Relaunch / Migration als möglicher Grundlagenbeitrag** | Nur bei eigenständigem Kundenproblem und realen Arbeitsschritten (URL-Inventar, 301, Domain-/E-Mail-Übergabe, Tests). Bestehende Guides bei überschaubarem Umfang erweitern. |

## Potenzielle Unterbeiträge – keine automatische Publikationsliste

1. **Kanzlei-Relaunch ohne URL-Verlust**: Nur wenn eine echte URL- und Inhaltsmigration als anschauliche Checkliste gezeigt werden kann. Abgrenzung zu Kosten- und Local-SEO-Ratgeber nötig.
2. **Fahrschul-Online-Anmeldung planen**: Datenschutzarme Felder, Betriebsvorgang nach Eingang, Fehlerszenarien. Nur ergänzen, wenn die vorhandene Kostenseite das nicht sinnvoll abdecken kann.
3. **Arztpraxis-Website umziehen**: Domain, Erreichbarkeit, Terminlinks und Verantwortlichkeiten – mit echter Migrations-Checkliste.
4. **Projektanfrage mit Bildern für SHK/Elektro**: Nur mit realer Demo, datensparsamer Gestaltung, Datei-/Fehlergrenzen und Freigabe.

Erst vorhandene Search-Console-Daten der **Hauptdomain** und echte Interessentenfragen prüfen (vgl. `docs/seo/2026-10-18-audit.md` und `docs/seo/measurement.md`). Die Domain-Property umfasst außerdem `meow.lkmedia.net`; dessen Klicks nicht als Agenturtraffic ausweisen. Keyword-Volumen oder erwartete Rankings ohne Messung nicht behaupten.

## Veröffentlichungsregeln gegen SEO-Spam

- **Ein Hauptintent pro URL.** Überschneidende Inhalte zusammenführen/überarbeiten, nicht für minimale Keywordvarianten duplizieren.
- **Eigener Informationsgewinn.** Eine konkrete Entscheidung, nachvollziehbarer Ablauf, originale Screenshots, echte Kosten oder überprüfbare Fallbelege. Ohne diese Substanz keine neue Seite.
- **Keine Doorway-Seiten.** Keine massenhaft variierenden Ortsnamen, Branchen oder KI-generierten „Bestenlisten“.
- **Zahlen belegen.** Quellen und Zeitpunkt nennen; keine erfundenen Kunden, Tests, Rankings, Preise oder Garantien.
- **Interne Links nach Nutzerbedarf.** Zur fachlich nächsten Seite und maximal einem passenden Angebot im Themenmodul. Bestehende Canonicals und Root-/Blog-Routen beibehalten.
- **Artikelpflege statt Kalenderzwang.** `updatedDate` nur bei substanziellen Aktualisierungen setzen; veraltete Modelle/Tools als historischen Stand kennzeichnen.
- **Messung statt Textquote.** Alle 28 vollständigen Tage prüfen: Impressionen, Klicks zur passenden Seite, qualifizierte Anfragen. Keine Mindestwortzahl und keine verpflichtende Veröffentlichungsfrequenz.

## Stand dieser Umsetzung

Die Blog-Übersicht zeigt fünf Gruppen; `topic` ist ein optionales, typisiertes Feld im bestehenden Content-Schema. Auf Artikelunterseiten werden thematisch verwandte Texte und nur ein passendes Angebot verlinkt. Noindex-/Draft-Seiten erscheinen nicht in der Navigation. Keine vorhandene Artikel-URL, kein Canonical und keine Weiterleitung wird geändert.

Die Artikel sind damit **strukturiert**, aber die oben genannte fachliche Nachprüfung und inhaltliche Erweiterung ist nicht automatisch erledigt. Diese Checkliste bestimmt den nächsten redaktionellen Durchgang.

## Redaktionelle Umsetzung am 19.10.2026

- Vier vorhandene Kaufberater wurden substanziell überarbeitet: docweb/Praxis, fahrschulweb, handwerkweb und individuelle Kanzlei-Websites. Kein zusätzlicher Suchintent und keine neue Artikel-URL.
- Sieben eigene SVG-Erklärgrafiken unter `public/posts/`: Praxisweg, Fahrschulanmeldung, Handwerker-Projektanfrage, Kanzlei-Budget, Kanzlei-Marketing-Audit, Fahrschul-Marketing-Ablauf und standortbezogene Fallstudie. Alle sind **als schematisch gekennzeichnet**, nicht als verifizierte Screenshots oder Statistik.
- Alle zwölf indexierbaren MDX-Beiträge besitzen ein sichtbares Bild mit aussagekräftigem Alternativtext. Bereits vorhandene Rank-Math-/How-Its-Built-Illustrationen und Bilder der Local-SEO-Anleitung bleiben bestehen. Historische KI-/ChatGPT-Beiträge nutzen vorhandene Titelgrafiken zusätzlich im Artikel.
- Die Fallstudie „Patricks Fahrschule“ wurde in der Blogroute und im Case-Eintrag auf den nachprüfbaren Prozess und die tatsächliche Websiteansicht ausgerichtet. Frühere absolute Platzierungs- und Klickbehauptungen sind ohne nachvollziehbare Rohdaten/Zeitraum nicht mehr als aktuelle Ergebnisse veröffentlicht. Dasselbe gilt für die Fahrschul-Angebotsseite und die Ergebniszeile auf der Startseite.
- Preise und Paketgrenzen stammen aus den `DOCWEB`, `FAHRSCHULWEB` und `HANDWERKWEB` Konstanten, keine selbst erfundenen Marktpreisvergleiche. **Die Angebotspreise im Bestellprozess bleiben die maßgeblichen Konditionen.**
- Die bestehende Blogübersicht zeigt Themencluster und künftig OG-/Beitragsgrafiken als dekorative Vorschau. Im vollständigen Artikel gibt es beschreibenden Alt-Text.

**Ausstehende Redaktionsnachweise:** Datierte Search-Console-Exporte je Stadt/URL/Suchanfrage sowie schriftliche Freigaben für alte Kundenresultate wurden nicht bereitgestellt. Die vorher veröffentlichten Ergebnis-PNGs bleiben aus Gründen der Historie im Git-Repository, werden aber nicht mehr in Live-Artikel/Angebot eingebunden; **nicht als aktuelle Rankings wiederverwenden**. Die Bilder auf echten Kundenwebsites ersetzen keine schriftlich dokumentierten Nutzungsrechte.

**Bildredaktion:** Vor Veröffentlichungen reale Kundenbilder/Fotos nur mit bestätigten Nutzungsrechten und sachlicher Beschriftung übernehmen. Schemata dienen zur Erklärung. Sichtbare Formeln, Standorte und Stichproben müssen fachlich kontrolliert werden. Keine dekorativen KI-Screenshots als vermeintliche Kundenarbeit.
