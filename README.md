# lkmedia.net

Deutschsprachige Marketing-Website mit Astro 6, MDX, React und Tailwind 4. Statische Seiten und einzelne SSR-Routen laufen als Node-Server hinter Traefik/Cloudflare.

Stripe-Payment-Links führen zum Onboarding für Docweb, Handwerkweb und Fahrschulweb. Das Backend schreibt Kundendaten und Uploads in private GitHub-Repositories. Kundenformulare, Onboarding-Bestätigungen und Änderungslinks werden per SMTP verschickt; das Hauptkontaktformular nutzt Resend.

## Setup

Node >=22.12.0 und die in `package.json` festgelegte pnpm-Version verwenden:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
node --env-file=.env ./node_modules/astro/bin/astro.mjs dev
```

Die Entwicklung läuft auf Port 4321. Private Variablen müssen im Node-Prozess verfügbar sein, beispielsweise mit `node --env-file=.env ./node_modules/astro/bin/astro.mjs dev`. Astro ersetzt private Secrets nicht mehr über `import.meta.env` im Build.

## Konfiguration

`.env.example` enthält ausschließlich leere Beispielwerte:

- `RESEND_API_KEY`: Hauptkontaktformular. Fehlende Konfiguration oder Providerfehler liefern 503.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Kundenmails über SMTP/TLS.
- `STRIPE_SECRET_KEY`: bezahlte Checkout-Sessions prüfen und persönliche Links wiederherstellen.
- `GITHUB_KUNDEN_TOKEN`: privates Kundenregister und Kunden-Issues/Dateien; passende Contents-/Issues-Berechtigungen erforderlich.
- `TURNSTILE_SECRET_KEY`: serverseitige Bot-Prüfung; zusammen mit `PUBLIC_TURNSTILE_SITE_KEY` konfigurieren.
- `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_CAL_LINK`: öffentliche Build-Konfiguration.

Private Werte ausschließlich zur Laufzeit injizieren. Keine `.env` oder Zugangsdaten in Images, Artefakte oder Git aufnehmen. Im Dev-Modus kann ohne Stripe-Key die Zahlungsprüfung übersprungen werden; `PIPELINE_FAKE=1` ist ausschließlich für isolierte Tests vorgesehen.

## Prüfen und deployen

```sh
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm test:purchase
```

Schwere Checks und Playwright-Suites auf dem Webserver ausführen. Kauf-E2E verwendet simulierte Stripe-, GitHub- und SMTP-Dienste und löst keine echten Käufe aus.

`Dockerfile` baut `dist/`, entfernt Dev-Abhängigkeiten und startet `dist/server/entry.mjs` als Benutzer `node` auf Port 4321. Produktion benötigt die privaten Variablen als Container-Umgebung. `PUBLIC_TURNSTILE_SITE_KEY` und optional `PUBLIC_CAL_LINK` als öffentliche Docker-Build-Argumente setzen. Dokploy verwaltet Deployment und Routing; für Rollbacks das vorherige Image erhalten. In-Memory-Limits gelten pro Prozess; mehrere Replikate benötigen einen gemeinsamen Limiter.

Öffentliche URLs sind deutsch ohne Sprachpräfix. Onboarding-, Danke-, Änderungsseiten und der bestehende noindex-Blogbeitrag sind aus der Sitemap ausgeschlossen.
