import { expect, test } from '@playwright/test';

test('agency homepage connects its branded introduction, services and project enquiry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.nav-brand-name')).toContainText('lk media');
  await expect(page.locator('.nav-logo')).toBeVisible();
  await page.getByRole('link', { name: 'Weiter entdecken' }).click();
  await expect(page).toHaveURL(/#entdecken$/);
  await expect(page.getByRole('heading', { name: 'Ein guter Auftritt ist kein Zufall.' })).toBeInViewport();
  await page.getByRole('link', { name: 'Lokal sichtbar werden. – SEO in Rastatt' }).click();
  await expect(page).toHaveURL(/\/seo-rastatt$/);
  await page.goto('/');
  await page.getByRole('link', { name: 'Individuelles Projekt besprechen' }).click();
  await expect(page).toHaveURL(/\/kontakt#termin$/);
});
