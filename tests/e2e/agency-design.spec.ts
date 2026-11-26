import { expect, test } from '@playwright/test';

test('homepage connects hero, services, work evidence and the project enquiry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.nav-brand-name')).toContainText('lk media');
  await expect(page.locator('.nav-logo')).toBeVisible();
  const hero = page.locator('main header.hero');
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText(/WordPress & KI. Direkt vom Entwickler\./);
  await hero.getByRole('link', { name: 'Arbeiten ansehen' }).click();
  await expect(page).toHaveURL(/#arbeiten$/);
  await expect(page.getByRole('heading', { name: /Ausgewählte Projekte/ })).toBeInViewport();

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
  await hero.getByRole('link', { name: 'Projekt starten' }).click();
  await expect(page).toHaveURL(/\/kontakt#anfrage$/);
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/WordPress & AI. Built with you\./);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lkmedia.net/en');
  await expect(page.locator('#leistungen a[href="/en/ai-automation"]')).toHaveCount(1);
  await expect(page.locator('main a[href="/leistungen"]')).toHaveCount(0);
  // Case-Seiten sind deutsch und als solche markiert.
  const caseLinks = page.locator('#arbeiten a[href^="/cases/"]');
  await expect(caseLinks).toHaveCount(8);
  await expect(caseLinks.first()).toHaveAttribute('hreflang', 'de');
  await expect(caseLinks.first()).toContainText('(in German)');
  await expect(page.locator('main header.hero').getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/en/contact#anfrage');
});
