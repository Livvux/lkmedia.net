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
  { title: 'Arztpraxen & Therapie', href: '/docweb', total: '2.078 €', initial: '1.539 €', schemaPrice: '1539.00', monthly: '49 €' },
  { title: 'Fahrschulen', href: '/fahrschule-webdesign', total: '2.498 €', initial: '1.849 €', schemaPrice: '1849.00', monthly: '59 €' },
  { title: 'Handwerksbetriebe', href: '/handwerk', total: '2.818 €', initial: '2.059 €', schemaPrice: '2059.00', monthly: '69 €' },
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

test('services discloses the minimum cost and excluded domain for every package', async ({ page }) => {
  await page.goto('/leistungen');
  for (const offer of offers) {
    const card = page.locator('#branchen article').filter({ has: page.getByRole('heading', { name: offer.title, exact: true }) });
    await expect(card).toContainText(`Mindestens ${offer.total}`);
    await expect(card).toContainText('12 Monate Mindestlaufzeit ab Bestellung');
    await expect(card).toContainText('zuzüglich Domainkosten');
  }
});

test('services explains the buying alternatives and links to existing planning guides', async ({ page }) => {
  await page.goto('/leistungen');
  const decision = page.locator('#entscheidungshilfe');
  for (const name of ['Ein Branchenpaket passt, wenn …', 'Eine individuelle Website passt, wenn …', 'Selbst erstellen passt, wenn …']) {
    await expect(decision.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(decision).toContainText('25.000 €');
  await expect(decision).toContainText('Kontaktformulare gehören nicht zum Paket');
  for (const slug of ['arztpraxis-website-erstellen-lassen', 'fahrschul-website-kosten-funktionen', 'webdesign-fuer-handwerker', 'kanzlei-website-kosten']) {
    const guide = decision.locator(`a[href="/blog/${slug}/"]`);
    await expect(guide).toBeVisible();
    const response = await page.request.get(await guide.getAttribute('href') ?? '');
    expect(response.status()).toBe(200);
  }
});

for (const offer of offers) {
  test(`${offer.href} keeps visible payment terms consistent with its structured offer`, async ({ page }) => {
    await page.goto(offer.href);
    const pricing = page.locator('#preis');
    await expect(pricing).toContainText(offer.initial);
    await expect(pricing).toContainText(offer.total);
    const productOffer = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => {
      const entities: unknown[] = scripts.flatMap((script) => {
        const parsed: unknown = JSON.parse(script.textContent ?? '{}');
        return Array.isArray(parsed) ? parsed : [parsed];
      });
      for (const entity of entities) {
        if (typeof entity !== 'object' || entity === null || !('offers' in entity)) continue;
        const structuredOffer = entity.offers;
        if (typeof structuredOffer !== 'object' || structuredOffer === null) continue;
        return { type: '@type' in entity ? entity['@type'] : null, offer: structuredOffer };
      }
      return null;
    });
    expect(productOffer?.type).toBe('Service');
    expect(productOffer?.offer).toMatchObject({
      price: offer.schemaPrice,
      priceCurrency: 'EUR',
      name: 'Einrichtung und erster Betriebsmonat',
      description: expect.stringContaining(offer.total),
    });
    expect(productOffer?.offer).toHaveProperty('description', expect.stringContaining(offer.monthly));
    expect(productOffer?.offer).toHaveProperty('description', expect.stringContaining('Domainkosten'));
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
