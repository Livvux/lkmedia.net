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
