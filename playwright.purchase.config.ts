import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/purchase',
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4327', contextOptions: { reducedMotion: 'reduce' }, trace: 'retain-on-failure' },
  webServer: {
    command: './node_modules/.bin/astro build && node --import ./tests/purchase/runtime.mjs ./dist/server/entry.mjs',
    url: 'http://localhost:4327',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      HOST: '127.0.0.1', PORT: '4327', PURCHASE_E2E: '1', PIPELINE_FAKE: '',
      STRIPE_SECRET_KEY: 'sk_test_local_fixture', GITHUB_KUNDEN_TOKEN: 'local_fixture',
      SMTP_HOST: 'local_fixture', SMTP_USER: 'local_fixture', SMTP_PASS: 'local_fixture',
    },
  },
});
