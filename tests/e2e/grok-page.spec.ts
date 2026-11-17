import { test, expect, type Page } from '@playwright/test';

const PATH = '/en/grok-bot-wordpress';
const PATH_DE = '/grok-bot-wordpress';

for (const path of [PATH, PATH_DE]) {
  test(`hero bot stays fixed while its eyes follow the mouse on ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    const bot = page.locator('[data-grok-hero]');
    const eyes = bot.locator('[data-grok-eyes]');
    await expect(bot).toBeVisible();
    const initial = await bot.boundingBox();
    await page.mouse.move(100, 300);
    await expect(eyes).toHaveAttribute('transform', /translate/);
    const left = await eyes.getAttribute('transform');
    await page.mouse.move(1200, 300);
    await expect.poll(() => eyes.getAttribute('transform')).not.toBe(left);
    expect(await bot.boundingBox()).toEqual(initial);
    expect(await bot.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    const section = path === PATH_DE ? '#wege' : '#routes';
    await page.locator(`.hero a[href="${section}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${section}$`));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(400, 400);
    await expect(eyes).not.toHaveAttribute('transform');
    expect(errors).toEqual([]);
  });
}

test.describe('touch hero', () => {
  test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
  test('shows a static bot for touch input', async ({ page }) => {
    await page.goto(PATH_DE);
    await page.touchscreen.tap(200, 300);
    await expect(page.locator('[data-grok-hero]')).toBeVisible();
    await expect(page.locator('[data-grok-eyes]')).not.toHaveAttribute('transform');
  });
});

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

test('grok page serves English SEO basics and a German hreflang', async ({ page }) => {
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
  await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
    'href',
    'https://lkmedia.net/grok-bot-wordpress',
  );
});

test('grok pages link the Add Grok Bot invite in both languages', async ({ page }) => {
  const invite = 'https://x.ai/bot/0LStaAgvBFXULZi3OuifT';
  for (const [path, label] of [
    [PATH, 'Add Grok Bot'],
    [PATH_DE, 'Grok Bot hinzufügen'],
  ]) {
    await page.goto(path);
    const button = page.getByRole('link', { name: label });
    await expect(button).toHaveAttribute('href', invite);
    await expect(button).toHaveAttribute('target', '_blank');
    await expect(button).toHaveAttribute('rel', /noopener/);
  }
});

test('german grok page serves SEO basics, JSON-LD and the AI inquiry', async ({ page }) => {
  const response = await page.goto(PATH_DE);
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText('Grok Bot für WordPress');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://lkmedia.net/grok-bot-wordpress',
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://lkmedia.net/en/grok-bot-wordpress',
  );
  const types = await jsonLdTypes(page);
  for (const type of ['Service', 'FAQPage', 'BreadcrumbList']) expect(types).toContain(type);
  await expect(page.locator('#anfrage select[name="service"]')).toHaveValue('ai');
  await expect(page.locator('#anfrage input[name="source"]')).toHaveValue(PATH_DE);
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

for (const [width, path] of [[390, PATH], [1440, PATH], [390, PATH_DE], [1440, PATH_DE]] as const) {
  test(`grok page ${path} has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
