import { test, expect } from '@playwright/test';

test('missing pages and assets return real 404 responses', async ({ request }) => {
  for (const path of ['/some/old/legacy/path-xyz', '/tools/sora-downloader', '/seo-tools', '/blog/unknown-post', '/cases/unknown-case', '/posts/missing.webp', '/en/unknown-page-xyz', '/en/blog/unknown-post-xyz', '/en/cases/unknown-case-xyz']) {
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

test('real English pages are served and legacy English URLs point to German pages', async ({ page, request }) => {
  for (const path of ['/en', '/en/contact']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
  }
  const cases = [
    ['/en/blog/', '/blog/'],
    ['/en/about/', '/ueber/'],
    ['/en/cases/eichhoernchenberger/', '/cases/eichhoernchenberger/'],
  ];
  for (const [from, to] of cases) {
    const redirect = await request.get(from, { maxRedirects: 0 });
    expect(redirect.status(), from).toBe(301);
    const response = await page.goto(from);
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(to);
  }
});

test('pages with both language versions link each other and advertise hreflang', async ({ page }) => {
  for (const [path, lang, other] of [['/', 'de', '/en'], ['/en', 'en', '/']] as const) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator(`header a.nav-lang[href="${other}"]`)).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute('href', 'https://lkmedia.net/');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://lkmedia.net/en');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://lkmedia.net/');
  }
  await page.goto('/ueber');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});
