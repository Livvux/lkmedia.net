import { expect, test } from '@playwright/test';

test('handwerk price section links to Stripe checkout', async ({ page }) => {
  await page.goto('/handwerk');
  await expect(page.getByRole('link', { name: /Jetzt starten/ }).first()).toHaveAttribute('href', /^https:\/\/buy\.stripe\.com\//);
});
