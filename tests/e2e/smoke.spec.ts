import { test, expect } from '@playwright/test';

test('home renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Webdesign Rastatt: Websites, WordPress & KI-Systeme');
  await page.goto('/en');
  await expect(page).toHaveTitle('Websites, WordPress & AI systems for growing businesses');
});
