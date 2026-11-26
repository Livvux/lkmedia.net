import { expect, test } from '@playwright/test';

test('homepage connects hero, services, work evidence and the project enquiry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.nav-brand-name')).toContainText('lk media');
  await expect(page.locator('.nav-logo')).toBeVisible();
  const hero = page.locator('main header.hero');
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText('WordPress und KI für Ihr Unternehmen.');
  await hero.getByRole('link', { name: /Projekt ansehen/ }).click();
  await expect(page).toHaveURL(/#arbeit$/);
  await expect(page.locator('#arbeit h2')).toBeInViewport();

  await page.locator('#arbeiten summary').click();
  await expect(page.locator('#arbeiten details a').first()).toBeVisible();

  const services = page.locator('#leistungen');
  for (const [name, href] of [
    ['WordPress', '/wordpress'],
    ['KI-Automatisierung', '/ki-automatisierung'],
    ['Webentwicklung', '/webentwicklung'],
    ['Optimierung & Wartung', '/seo-rastatt'],
  ]) {
    await expect(services.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  }
  await services.getByRole('link', { name: 'Optimierung & Wartung', exact: true }).click();
  await expect(page).toHaveURL(/\/seo-rastatt$/);

  await page.goto('/');
  await hero.getByRole('link', { name: 'Mein Vorhaben besprechen' }).click();
  await page.getByRole('button', { name: 'KI & Automation' }).click();
  await page.getByRole('link', { name: /KI-Ablauf besprechen/ }).click();
  await expect(page.locator('select[name=service]')).toHaveValue('ai');
  await expect(page).toHaveURL(/\/kontakt\?service=ai#anfrage$/);
  await expect(page.locator("#anfrage h2")).toBeInViewport();
  await page.goto('/');
  await page.locator('main section[aria-labelledby="close-title"]').getByRole('link', { name: '15-Minuten-Call buchen' }).click();
  await expect(page).toHaveURL(/\/kontakt#termin$/);
});

test('English homepage mirrors the German one without German-only offers', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = await page.goto('/en');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('WordPress and AI for your business.');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lkmedia.net/en');
  await expect(page.locator('#leistungen a[href="/en/ai-automation"]')).toHaveCount(1);
  await expect(page.locator('main a[href="/leistungen"]')).toHaveCount(0);
  // Case-Seiten sind deutsch und als solche markiert.
  const caseLinks = page.locator('#arbeiten a[href^="/cases/"]');
  await expect(caseLinks).toHaveCount(8);
  await expect(caseLinks.first()).toHaveAttribute('hreflang', 'de');
  await expect(caseLinks.first()).toContainText('(in German)');
  await expect(page.locator('main header.hero').getByRole('link', { name: 'Discuss my project' })).toHaveAttribute('href', '#vorhaben');
});

test('English WordPress enquiry opens with the chosen service', async ({ page }) => {
  await page.goto('/en#vorhaben');
  await page.getByRole('link', { name: /Discuss a WordPress project/ }).click();
  await expect(page).toHaveURL(/\/en\/contact\?service=wordpress#anfrage$/);
  await expect(page.locator('select[name=service]')).toHaveValue('wordpress');
});

test('the project screen follows scrolling in both directions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const progress = () => page.locator('[data-project-scene]').evaluate(el => Number(getComputedStyle(el).getPropertyValue('--p')));
  await page.evaluate(() => scrollTo({ top: 160, behavior: 'instant' }));
  await expect.poll(progress).toBeGreaterThan(0.2);
  await page.evaluate(() => scrollTo({ top: 360, behavior: 'instant' }));
  await expect(page.locator('.hero .copy')).toHaveCSS('pointer-events', 'none');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('.hero .copy')).toHaveCSS('pointer-events', 'auto');
  await expect.poll(progress).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.laptop')).toHaveCSS('transform', 'none');
});
