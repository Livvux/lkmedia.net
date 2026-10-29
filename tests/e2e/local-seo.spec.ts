import { expect, test } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

for (const width of [320, 390, 1280]) {
  test(`local SEO offer and enquiry work at ${width}px`, async ({ page, request }, testInfo) => {
    const errors: string[] = [];
    const failedResponses: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (new URL(response.url()).hostname === 'localhost' && response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('link', { name: 'SEO für Ihre bestehende Website ansehen →' }).click();
    await expect(page).toHaveURL(/\/seo-rastatt$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Suchmaschinenoptimierung für Unternehmen in Rastatt');
    await expect(page.getByRole('link', { name: 'SEO-Erstgespräch vereinbaren', exact: true })).toHaveAttribute('href', '/kontakt#termin');
    await expect(page.locator('main')).toContainText('Bezahlte Analyse zum Festpreis');
    await expect(page.getByRole('link', { name: 'Projekt und vollständige Kundenstimme ansehen →' })).toHaveAttribute('href', '/cases/cleo-coaching');
    await page.getByRole('link', { name: 'Website und Anliegen senden' }).click();
    await expect(page.getByRole('heading', { name: 'Wo bleiben die Anfragen aus?' })).toBeInViewport();
    await expect(page.getByLabel('Nachricht', { exact: true })).toHaveAccessibleDescription(/Einzugsgebiet/);
    await expect(page.locator('input[name="source"]')).toHaveValue('/seo-rastatt');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`seo-rastatt-${width}.png`), fullPage: true });

    let posted: URLSearchParams | undefined;
    await page.route('**/api/contact', async route => {
      posted = new URLSearchParams(route.request().postData() ?? '');
      await route.fulfill({ status: 303, headers: { location: '/danke' }, body: '' });
    });
    await page.getByLabel('Name', { exact: true }).fill('SEO Test');
    await page.getByLabel('E-Mail', { exact: true }).fill('seo@example.test');
    await page.getByLabel('Nachricht', { exact: true }).fill('Website: https://example.test. Leistung: Beratung. Einzugsgebiet: Rastatt.');
    await page.getByRole('button', { name: 'Projektanfrage senden' }).click();
    await expect(page).toHaveURL(/\/danke$/);
    expect(posted?.get('source')).toBe('/seo-rastatt');
    expect(posted?.get('website')).toBe('');
    expect(posted?.get('message')).toContain('Rastatt');

    await page.goto('/seo-rastatt');
    await page.getByRole('link', { name: 'SEO-Erstgespräch vereinbaren', exact: true }).click();
    await expect(page).toHaveURL(/\/kontakt#termin$/);
    await expect(page.locator('input[name="source"]')).toHaveValue('/seo-rastatt');
    await expect(page.locator('main')).toContainText('Die Website-Preisuntergrenze gilt dafür nicht.');
    for (const path of ['/seo-rastatt', '/leistungen', '/kontakt']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
    expect(await (await request.get('/sitemap-0.xml')).text()).toContain('https://lkmedia.net/seo-rastatt');
    expect(errors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
}

test('SEO enquiry keeps its source when JavaScript is unavailable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/seo-rastatt');
  await expect(page.locator('input[name="source"]')).toHaveValue('/seo-rastatt');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Projektanfrage senden' })).toBeVisible();
  await context.close();
});
