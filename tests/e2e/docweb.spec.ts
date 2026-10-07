import { test, expect, type Locator } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL) throw new Error('Docweb UI tests require a local baseURL.');
  const origin = new URL(baseURL).origin;

  // Exercise the local UI without calling payment, booking, email or analytics services.
  await page.route('**/*', (route) => {
    const request = route.request();
    const localRead = new URL(request.url()).origin === origin
      && ['GET', 'HEAD'].includes(request.method());
    return localRead ? route.continue() : route.abort();
  });
});

async function expectKeyboardAccessible(link: Locator) {
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toBeInViewport();
}

for (const path of ['/docweb', '/docweb/agb', '/docweb/danke', '/docweb/onboarding']) {
  test(`${path} renders without a link to a missing English page`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(new RegExp(`${path}/?$`));
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/\S/);
    await expect(page.locator('a[hreflang="en"]')).toHaveCount(0);
  });
}

test('an existing English translation remains reachable through the language switch', async ({ page }) => {
  await page.goto('/leistungen');
  const languageSwitch = page.getByRole('link', { name: 'Switch to English' });

  await expect(languageSwitch).toHaveAttribute('href', /^\/en\/leistungen\/?$/);
  await expectKeyboardAccessible(languageSwitch);
  await languageSwitch.press('Enter');

  await expect(page).toHaveURL(/\/en\/leistungen\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

for (const device of [
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
]) {
  test.describe(device.name, () => {
    test.use({ viewport: device.viewport });

    test('the package and preparation links work without horizontal overflow', async ({ page }) => {
      await page.goto('/docweb');

      const horizontalOverflow = () => page.evaluate(() =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
          - document.documentElement.clientWidth,
      );
      await expect.poll(horizontalOverflow).toBeLessThanOrEqual(1);

      const demo = page.getByRole('link', { name: 'Demo ansehen', exact: true });
      await expect(demo).toHaveAttribute('href', /^https:\/\/docweb\.lkmedia\.net\/?$/);
      await expectKeyboardAccessible(demo);

      const packageLink = page.getByRole('link', { name: /Paket ansehen/ });
      await expectKeyboardAccessible(packageLink);
      await packageLink.press('Enter');
      await expect(page).toHaveURL(/#preis$/);
      await expect(page.locator('#preis').getByRole('heading', { level: 2 })).toBeInViewport();

      const checkout = page.getByRole('link', { name: /Jetzt starten/ });
      await expect(checkout).toHaveAttribute('href', /^https:\/\/buy\.stripe\.com\//);
      await expectKeyboardAccessible(checkout);

      const checklist = page.getByRole('link', { name: /Checkliste für Ihre Bestellung/ });
      await expectKeyboardAccessible(checklist);
      await checklist.press('Enter');
      await expect(page).toHaveURL(/#vorbereitung$/);
      await expect(page.locator('#vorbereitung').getByRole('heading', { level: 2 })).toBeInViewport();
      await expect.poll(horizontalOverflow).toBeLessThanOrEqual(1);
    });
  });
}

test('the delivery FAQ opens and closes with Enter while retaining focus', async ({ page }) => {
  await page.goto('/docweb');
  const summary = page.locator('summary').filter({ hasText: 'Wie schnell ist meine Website online?' });
  const details = page.locator('details').filter({ has: summary });
  const answer = details.locator(':scope > div');

  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await expect(summary).toBeFocused();
  await expect(details).not.toHaveAttribute('open');
  await expect(answer).toBeHidden();

  await summary.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(answer).toBeVisible();
  await expect(summary).toBeFocused();

  await summary.press('Enter');
  await expect(details).not.toHaveAttribute('open');
  await expect(answer).toBeHidden();
  await expect(summary).toBeFocused();
});
