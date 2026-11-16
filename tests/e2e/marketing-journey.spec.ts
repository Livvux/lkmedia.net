import { expect, test } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('home connects services, fixed-price packages and portfolio evidence', async ({ page }) => {
  await page.goto('/');
  const packages = page.locator('#leistungen aside');
  await expect(packages).toContainText('Website-Pakete zum Festpreis');
  for (const href of ['/docweb', '/handwerk', '/fahrschule-webdesign']) {
    await expect(packages.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  await packages.getByRole('link', { name: 'Pakete vergleichen' }).click();
  await expect(page).toHaveURL(/\/leistungen$/);
  await expect(page.locator('main')).toContainText('2.498 €');
  await page.goto('/');
  await expect(page.locator('section[aria-labelledby="close-title"]').getByRole('link', { name: '15-Minuten-Call buchen' })).toHaveAttribute('href', '/kontakt#termin');
  await expect(page.locator('#arbeiten a[href^="/cases/"]')).toHaveCount(8);
  await expect(page.locator('#arbeiten')).toContainText('Ergebnis');
  for (const path of ['/', '/cases/klavierbau-milde']) {
    await page.goto(path);
    await expect(page.locator('main')).not.toContainText(/Position 1–2|Klickrate über 16|0,7 s|Lighthouse 100|Handgeschriebener Code statt 40 Plugins/);
  }
});

test('driving-school tour connects a real project, a labelled demo and the enquiry guide', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fahrschule-webdesign');
  await page.getByRole('link', { name: 'Website-Rundgang ansehen', exact: true }).click();
  await expect(page).toHaveURL(/#rundgang$/);
  const tour = page.locator('#rundgang');
  await expect(tour.getByRole('link', { name: /Kundenprojekt: Standort/ })).toHaveAttribute('href', 'https://patricks-fahrschule.de/standorte/fahrschule-durmersheim/');
  await expect(tour.getByRole('link', { name: /Musterwebsite: Demo/ })).toHaveAttribute('href', 'https://fahrschule.lkmedia.net');
  await expect(tour).toContainText('kein unverändertes fahrschulweb-Paket');
  await tour.getByRole('link', { name: 'Ablauf nach der Anfrage lesen →' }).click();
  await expect(page.getByRole('heading', { name: 'Was passiert nach der Online-Anmeldung?' })).toBeInViewport();
  expect(errors).toEqual([]);
});

test('case video is playable on demand without an autoplaying third-party embed', async ({ page, request }) => {
  await page.goto('/case-study-patricks-fahrschule-local-seo/');
  const video = page.locator('article video');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).not.toHaveAttribute('autoplay');
  const src = await video.locator('source').getAttribute('src');
  const response = await request.get(src!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('video/mp4');
  await video.evaluate((el: HTMLVideoElement) => el.play());
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(0);
});

for (const width of [390, 1280]) {
  test(`marketing paths remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/en', '/fahrschule-webdesign', '/kontakt', '/case-study-patricks-fahrschule-local-seo/']) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
    }
    await page.goto('/kontakt');
    await expect(page.getByRole('button', { name: 'Projektanfrage senden' })).toBeVisible();
    await expect(page.getByLabel('Firma', { exact: true })).not.toHaveAttribute('required');
    await expect(page.getByLabel('Budget', { exact: true })).not.toHaveAttribute('required');
    await expect(page.getByLabel('Nachricht', { exact: true })).toHaveAccessibleDescription(/Website-Adresse/);
  });
}
