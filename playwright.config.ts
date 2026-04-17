import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'pnpm build && node ./dist/server/entry.mjs',
    url: 'http://localhost:4321',
    env: { HOST: '0.0.0.0', PORT: '4321' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
