import { test, expect, type Page } from '@playwright/test';

const PATH = '/en/grok-bot-wordpress';

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Grok page tests require a local baseURL.');
  const origin = new URL(baseURL).origin;
  await page.route('**/*', (route) => {
    const request = route.request();
    return new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method())
      ? route.continue()
      : route.abort();
  });
});

async function jsonLdTypes(page: Page): Promise<string[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((text) => {
    const parsed: unknown = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.map((item) => String((item as { '@type'?: unknown })['@type']));
  });
}

test('grok page serves English SEO basics without hreflang', async ({ page }) => {
  const response = await page.goto(PATH);
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText('Grok Bot');
  await expect(h1).toContainText('WordPress');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://lkmedia.net/en/grok-bot-wordpress',
  );
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});

test('grok page ships Service, FAQPage and BreadcrumbList JSON-LD', async ({ page }) => {
  await page.goto(PATH);
  const types = await jsonLdTypes(page);
  for (const type of ['Service', 'FAQPage', 'BreadcrumbList']) expect(types).toContain(type);
});

test('grok page states independence from xAI and offers the AI inquiry', async ({ page }) => {
  await page.goto(PATH);
  const notice = page.getByRole('complementary', { name: 'Independence notice' });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('not affiliated with');
  await expect(notice).toContainText('xAI');
  await expect(page.locator('#inquiry select[name="service"]')).toHaveValue('ai');
  await expect(page.locator('#inquiry input[name="source"]')).toHaveValue(PATH);
});

for (const width of [390, 1440]) {
  test(`grok page has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PATH);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
