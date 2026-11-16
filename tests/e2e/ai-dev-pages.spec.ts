import { expect, test } from '@playwright/test';

const SITE = 'https://lkmedia.net';
const pages = [
  { path: '/ki-automatisierung', de: '/ki-automatisierung', en: '/en/ai-automation', service: 'ai', heading: 'KI-Automatisierung' },
  { path: '/en/ai-automation', de: '/ki-automatisierung', en: '/en/ai-automation', service: 'ai', heading: 'AI automation' },
  { path: '/webentwicklung', de: '/webentwicklung', en: '/en/web-development', service: 'development', heading: 'Webentwicklung' },
  { path: '/en/web-development', de: '/webentwicklung', en: '/en/web-development', service: 'development', heading: 'Custom web development' },
] as const;

for (const p of pages) {
  test(`${p.path} renders SEO metadata, structured data and the preselected inquiry form`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    expect((await page.goto(p.path))?.status()).toBe(200);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(p.heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${p.path}`);
    await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute('href', `${SITE}${p.de}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${SITE}${p.en}`);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${SITE}${p.de}`);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = blocks.flatMap((text) => {
      const data: unknown = JSON.parse(text);
      return Array.isArray(data) ? data : [data];
    }) as { '@type'?: string; url?: string; mainEntity?: unknown[]; itemListElement?: unknown[] }[];
    const byType = (type: string) => nodes.find((node) => node['@type'] === type);
    expect(byType('Service')?.url).toBe(`${SITE}${p.path}`);
    expect(byType('FAQPage')?.mainEntity?.length).toBeGreaterThan(0);
    expect(byType('BreadcrumbList')?.itemListElement).toHaveLength(2);

    await expect(page.locator('#anfrage select[name="service"]')).toHaveValue(p.service);
    expect(errors).toEqual([]);
  });
}

test('the AI pages anchor the brief-to-draft demo from the hero', async ({ page }) => {
  await page.goto('/ki-automatisierung');
  await expect(page.locator('a[href="#demo"]')).toBeVisible();
  await expect(page.locator('#demo h2')).toBeVisible();
  await page.goto('/en/ai-automation');
  await expect(page.locator('#demo h2')).toBeVisible();
  await expect(page.locator('a[href="/en/grok-bot-wordpress"]').first()).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`service pages have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const { path } of pages) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
  });
}
