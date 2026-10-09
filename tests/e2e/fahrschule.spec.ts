import { expect, test } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

for (const path of ['/fahrschule-webdesign', '/fahrschule-webdesign/agb', '/fahrschule-webdesign/danke', '/fahrschule-webdesign/onboarding']) {
  test(`${path} renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
}

test('onboarding without paid session shows no form', async ({ page }) => {
  await page.goto('/fahrschule-webdesign/onboarding?session_id=cs_test_unknown');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bestellung nicht gefunden.');
  await expect(page.locator('form#onboarding')).toHaveCount(0);
});

test('package section is reachable from the hero and links to checkout and AGB', async ({ page }) => {
  await page.goto('/fahrschule-webdesign');
  await page.getByRole('link', { name: /Paket ansehen/ }).first().click();
  await expect(page).toHaveURL(/#preis$/);
  const preis = page.locator('#preis');
  await expect(preis.getByRole('heading', { level: 2 })).toBeInViewport();
  await expect(preis.getByRole('link', { name: /Jetzt starten|Gespräch vereinbaren/ })).toHaveAttribute(
    'href',
    /^(https:\/\/buy\.stripe\.com\/|\/kontakt#termin$)/,
  );
  await expect(preis.getByRole('link', { name: /AGB/ })).toHaveAttribute('href', '/fahrschule-webdesign/agb');
});

test('Mehrsprachigkeit ist überall als Extra beschrieben', async ({ page }) => {
  await page.goto('/fahrschule-webdesign');
  const kachel = page.locator('h3', { hasText: 'Mehrsprachig' }).locator('..');
  await expect(kachel).toContainText('Extra');
  const faq = page.locator('details', { hasText: 'Was kostet eine Website für eine Fahrschule?' });
  await expect(faq).toContainText('zusätzlich');
});

test('Demo-Link und Änderungsweg stehen auf der Seite', async ({ page }) => {
  await page.goto('/fahrschule-webdesign');
  await expect(page.getByRole('link', { name: /Demo ansehen/ }).first()).toHaveAttribute('href', 'https://fahrschule.lkmedia.net');
  const faq = page.locator('details', { hasText: 'später ändern?' });
  await expect(faq).toContainText('Änderungs-Link');
  await expect(faq).toContainText('Status');
  await expect(faq).toContainText('ohne Passwort');
});
