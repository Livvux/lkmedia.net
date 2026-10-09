import { defineConfig } from '@playwright/test';

// Onboarding/Änderung brauchen den Dev-Server: ohne Stripe-Key gilt dort jede Session als bezahlt.
const DEV_SPECS = ['**/onboarding.spec.ts', '**/aenderung.spec.ts'];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  projects: [
    { name: 'prod', testIgnore: DEV_SPECS, use: { baseURL: 'http://localhost:4321' } },
    // Seriell: der kalte Dev-Server kompiliert beim ersten Aufruf und lädt Module neu.
    { name: 'dev', testMatch: DEV_SPECS, workers: 1, use: { baseURL: 'http://localhost:4325' } },
  ],
  webServer: [
    {
      // Binaries direkt statt über pnpm: pnpm startet Skripte in einer eigenen Prozessgruppe, die
      // Playwrights Kill (-pgid) nicht erreicht → Server überlebt, stdout bleibt offen, Lauf endet nie.
      command: './node_modules/.bin/astro build && node ./dist/server/entry.mjs',
      url: 'http://localhost:4321',
      env: { HOST: '0.0.0.0', PORT: '4321' },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: './node_modules/.bin/astro dev --port 4325',
      url: 'http://localhost:4325',
      // Leere Werte überdecken eine evtl. vorhandene .env – kein echter Stripe-/GitHub-Zugriff.
      env: { PIPELINE_FAKE: '1', STRIPE_SECRET_KEY: '', GITHUB_KUNDEN_TOKEN: '' },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
