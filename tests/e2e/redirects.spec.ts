import { test, expect } from '@playwright/test';

test('sora redirects to blog', async ({ page }) => {
  await page.goto('/tools/sora-downloader');
  expect(page.url()).toMatch(/\/blog\/?$/);
});

test('unknown legacy path redirects to blog', async ({ page }) => {
  await page.goto('/some/old/legacy/path-xyz');
  expect(page.url()).toMatch(/\/blog\/?$/);
});
