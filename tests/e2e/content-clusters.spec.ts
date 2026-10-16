import { expect, test } from '@playwright/test';

const guides = [
  ['kanzlei-website-kosten', '/anwaelte'],
  ['arztpraxis-website-erstellen-lassen', '/docweb'],
  ['webdesign-fuer-handwerker', '/handwerk'],
  ['fahrschul-website-kosten-funktionen', '/fahrschule-webdesign'],
] as const;

test('buying guides connect blog, article and the matching offer', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  for (const [slug, offer] of guides) {
    const path = `/blog/${slug}/`;
    expect(sitemap).toContain(`https://lkmedia.net${path}`);
    await page.goto('/blog');
    await page.locator(`main a[href="${path}"]`).click();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    await page.locator(`article a[href="${offer}"]`).last().click();
    await expect(page.locator(`main a[href="${path}"]`)).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});
