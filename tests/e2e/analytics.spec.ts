import { expect, test } from '@playwright/test';

// Seiten mit session_id in der URL: kein Plausible und kein Referrer, sonst geht der Link an Dritte.
const PLAUSIBLE = 'script[src*="vertexmods"]';
const REFERRER = 'meta[name="referrer"][content="same-origin"]';

for (const path of ['/aenderung?session_id=cs_test_x', '/fahrschule-webdesign/onboarding?session_id=cs_test_x']) {
  test(`${path} loads no analytics and sends no referrer`, async ({ page }) => {
    await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
    await page.goto(path);
    await expect(page.locator(PLAUSIBLE)).toHaveCount(0);
    await expect(page.locator(REFERRER)).toHaveCount(1);
  });
}

test('homepage still loads analytics', async ({ page }) => {
  await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
  await page.goto('/');
  await expect(page.locator(PLAUSIBLE)).toHaveCount(1);
  await expect(page.locator(REFERRER)).toHaveCount(0);
});
