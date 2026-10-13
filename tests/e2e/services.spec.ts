import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Services tests require a local baseURL.');
  const origin = new URL(baseURL).origin;
  await page.route('**/*', (route) => {
    const request = route.request();
    return new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method())
      ? route.continue()
      : route.abort();
  });
});

const offers = [
  { title: 'Arztpraxen & Therapie', href: '/docweb' },
  { title: 'Fahrschulen', href: '/fahrschule-webdesign' },
  { title: 'Handwerksbetriebe', href: '/handwerk' },
];

for (const offer of offers) {
  test(`services leads to the ${offer.title} checkout`, async ({ page }) => {
    await page.goto('/leistungen');
    const card = page.locator('article').filter({ has: page.getByRole('heading', { name: offer.title, exact: true }) });
    await card.getByRole('link', { name: 'Paket ansehen & bestellen' }).click();
    await expect(page).toHaveURL(new RegExp(`${offer.href}/?$`));
    const checkout = page.locator('a[href^="https://buy.stripe.com/"]').first();
    await expect(checkout).toBeVisible();
    await expect(checkout).toHaveAttribute('href', /^https:\/\/buy\.stripe\.com\/[a-zA-Z0-9]+$/);
  });
}

test('services shows three packages without mobile overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/leistungen');
  await expect(page.locator('#branchen article')).toHaveCount(3);
  await expect(page.locator('#branchen')).toContainText('1.490 €');
  await expect(page.locator('#branchen')).toContainText('1.790 €');
  await expect(page.locator('#branchen')).toContainText('1.990 €');
  const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  expect(size.content).toBeLessThanOrEqual(size.viewport);
});

for (const width of [320, 768, 1280]) {
  test(`services assets and layout render at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/leistungen');
    expect(response?.status()).toBe(200);
    const images = page.locator('#branchen img');
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/services-${width}.png`, fullPage: true });
  });
}
