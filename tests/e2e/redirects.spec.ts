import { test, expect } from '@playwright/test';

test('sora redirects to blog', async ({ page }) => {
  await page.goto('/tools/sora-downloader');
  expect(page.url()).toMatch(/\/blog\/?$/);
});

test('unknown legacy path redirects to blog', async ({ page }) => {
  await page.goto('/some/old/legacy/path-xyz');
  expect(page.url()).toMatch(/\/blog\/?$/);
});

test('old English URLs point to the corresponding German pages', async ({ page }) => {
  const cases = [
    ['/en/', '/'],
    ['/en/blog/', '/blog/'],
    ['/en/about/', '/ueber/'],
    ['/en/contact/', '/kontakt/'],
    ['/en/cases/eichhoernchenberger/', '/cases/eichhoernchenberger/'],
  ];
  for (const [from, to] of cases) {
    const response = await page.goto(from);
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(to);
  }
});

test('the public website no longer links to English pages or advertises English hreflang', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header a[href^="/en"]')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});
