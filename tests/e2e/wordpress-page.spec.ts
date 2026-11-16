import { expect, test } from '@playwright/test';

const pages = [
  { path: '/wordpress', lang: 'de', heading: 'WordPress, sauber gebaut.' },
  { path: '/en/wordpress', lang: 'en', heading: 'WordPress, built properly.' },
] as const;

const alternates = {
  de: 'https://lkmedia.net/wordpress',
  en: 'https://lkmedia.net/en/wordpress',
  'x-default': 'https://lkmedia.net/wordpress',
};

for (const { path, lang, heading } of pages) {
  test(`${path} renders headings, alternates and structured data`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await page.goto(path))?.status()).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://lkmedia.net${path}`);
    for (const [hreflang, href] of Object.entries(alternates)) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveAttribute('href', href);
    }

    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.flatMap((script) => {
        const parsed: unknown = JSON.parse(script.textContent ?? '{}');
        return (Array.isArray(parsed) ? parsed : [parsed]).map((entity) =>
          typeof entity === 'object' && entity !== null && '@type' in entity ? entity['@type'] : null,
        );
      }),
    );
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');

    const form = page.locator('#anfrage form');
    await expect(form).toBeVisible();
    await expect(form.locator('select[name="service"]')).toHaveValue('wordpress');
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1440]) {
    test(`${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
