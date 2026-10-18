import { expect, test } from '@playwright/test';

test('contact calendar loads only after a deliberate click, with a working fallback link', async ({ page }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost') return route.continue();
    if (url.href === 'https://app.cal.com/embed/embed.js') {
      requests.push(url.href);
      return route.fulfill({ contentType: 'text/javascript', body: '' });
    }
    return route.abort();
  });
  await page.goto('/kontakt');
  await expect(page.getByRole('link', { name: 'Kalender auf Cal.com öffnen' })).toHaveAttribute('href', 'https://cal.com/lucas-lkmedia/15min');
  const calendar = page.locator('[aria-label="Terminkalender"]');
  await expect(calendar).toBeHidden();
  expect(requests).toEqual([]);
  await page.getByRole('button', { name: 'Call buchen', exact: true }).click();
  await expect(calendar).toBeVisible();
  await expect(calendar).toBeFocused();
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.getByRole('button', { name: 'Call buchen', exact: true })).toBeHidden();
  expect(errors).toEqual([]);
});
