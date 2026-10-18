import { expect, test } from '@playwright/test';

test('built contact form sends with runtime keys and redirects directly to /danke', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://localhost:4327' ? route.continue() : route.abort());
  await page.goto('/anwaelte');
  await page.locator('main a[href="/kontakt"]').first().click();
  await expect(page.locator('input[name="source"]')).toHaveValue('/anwaelte');
  await expect(page.locator('.cf-turnstile')).toHaveAttribute('data-sitekey', 'local_public_fixture');
  await expect(page.locator('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]')).toHaveCount(1);
  await page.locator('[name="name"]').fill('Contact fixture');
  await page.locator('[name="email"]').fill('contact@example.test');
  await page.getByLabel('Wie haben Sie uns gefunden? (optional)').selectOption('chatgpt');
  await page.locator('[name="message"]').fill('Isolated runtime delivery check');
  await page.locator('form[action="/api/contact"]').evaluate(form => {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = 'cf-turnstile-response'; input.value = 'local_captcha_token';
    form.append(input);
  });
  const response = page.waitForResponse(r => r.url().endsWith('/api/contact'));
  await page.locator('#contact-submit').click();
  expect((await response).status()).toBe(303);
  await expect(page).toHaveURL('http://localhost:4327/danke');
  const state = await (await request.get('http://localhost:4328/state')).json();
  expect(state.mail).toContainEqual(expect.objectContaining({ subject: 'Projektanfrage: Contact fixture ()', text: expect.stringContaining('Isolated runtime delivery check') }));
  expect(state.mail).toContainEqual(expect.objectContaining({ text: expect.stringContaining('Angebotsseite: /anwaelte') }));
  expect(state.mail).toContainEqual(expect.objectContaining({ text: expect.stringContaining('Herkunft (Selbstauskunft): ChatGPT') }));
  expect(errors).toEqual([]);
});
