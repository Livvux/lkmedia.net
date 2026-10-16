import { test, expect } from '@playwright/test';

test('missing pages and assets return real 404 responses', async ({ request }) => {
  for (const path of ['/some/old/legacy/path-xyz', '/tools/sora-downloader', '/seo-tools', '/blog/unknown-post', '/cases/unknown-case', '/posts/missing.webp']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
    expect(response.headers().location, path).toBeUndefined();
  }
});

test('legacy service URLs redirect directly to existing successors', async ({ request }) => {
  const redirects = [
    ['/webdesign-fahrschulen', '/fahrschule-webdesign'],
    ['/online-marketing-fahrschulen', '/marketing-ideen-fahrschule/'],
    ['/blog/digital-marketing-fahrschulen', '/marketing-ideen-fahrschule/'],
    ['/blog/marketing-ideen-fahrschule/', '/marketing-ideen-fahrschule/'],
  ];
  for (const [from, to] of redirects) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(301);
    expect(new URL(response.headers().location).pathname).toBe(to);
    expect((await request.get(to)).status(), to).toBe(200);
  }
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
