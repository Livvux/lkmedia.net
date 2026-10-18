import { expect, test } from '@playwright/test';

test('AI discovery links to the main offers and supporting evidence', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);
  const body = await response.text();
  for (const path of ['/docweb', '/handwerk', '/fahrschule-webdesign', '/leistungen', '/cases', '/ueber']) {
    expect(body).toContain(`https://lkmedia.net${path})`);
  }
  expect(body).toContain('does not contain full article text');

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-agent: OAI-SearchBot\nAllow: /');
});

test('editorial discovery index contains abstracts and no raw MDX', async ({ request }) => {
  const response = await request.get('/llms-full.txt');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('does not contain full article text');
  expect(body).toContain('Abstract:');
  expect(body).toContain('https://lkmedia.net/blog/arztpraxis-website-erstellen-lassen/');
  expect(body).toContain('https://lkmedia.net/marketing-ideen-fahrschule/');
  expect(body).not.toMatch(/^import\s/m);
  expect(body).not.toMatch(/\{(?:DOCWEB|HANDWERKWEB|FAHRSCHULWEB)\./);
  expect(body).not.toContain('real-debrid-review');
});

test('updated articles expose the editorial date to readers and machines', async ({ page }) => {
  await page.goto('/blog/rankmath-einstellungen-2025/');
  const published = page.locator('article time').first();
  await expect(published).toHaveAttribute('datetime', '2025-12-18T00:00:00.000Z');
  const updated = page.locator('article time').nth(1);
  await expect(updated).toHaveText('2026-10-16');
  await expect(updated).toHaveAttribute('datetime', '2026-10-16T00:00:00.000Z');
  await expect(updated).toBeVisible();
  await expect(updated.locator('..')).toContainText('Aktualisiert:');
});
