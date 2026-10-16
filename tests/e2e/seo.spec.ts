import { expect, test } from '@playwright/test';

const pages = [
  ['/', 'Webdesign aus Rastatt'],
  ['/anwaelte', 'Webdesign für Anwaltskanzleien'],
  ['/privatkliniken', 'Webdesign für Privatkliniken'],
  ['/luxus-immobilien', 'Webdesign für Luxus-Immobilien'],
  ['/docweb', 'Website für Ihre Arztpraxis erstellen lassen'],
  ['/handwerk', 'Website für Handwerker erstellen lassen'],
  ['/fahrschule-webdesign', 'Fahrschul-Website erstellen lassen'],
  ['/blog', 'SEO, Webdesign & Marketing'],
  ['/cases', 'Webdesign-Referenzen & SEO-Ergebnisse'],
] as const;

for (const width of [390, 1280]) {
  test(`commercial pages have visible search headings at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [path, heading] of pages) {
      expect((await page.goto(path))?.status(), path).toBe(200);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(heading);
      await expect(h1).toBeVisible();
      expect(await h1.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(20);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://lkmedia.net${path}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('articles have absolute social images and article metadata', async ({ page, request }) => {
  await page.goto('/blog/rankmath-einstellungen-2025/');
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/lkmedia.net\//);
  await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute('content', /T/);
  await page.goto('/blog');
  await expect(page.locator('main a[href*="real-debrid"]')).toHaveCount(0);
  expect(await (await request.get('/rss.xml')).text()).not.toContain('real-debrid-review');
});
