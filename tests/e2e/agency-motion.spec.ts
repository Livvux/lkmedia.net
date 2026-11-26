import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://analytics.rpcrate.com/**', (route) => route.fulfill({ body: '' }));
  await page.route('https://analytics.vertexmods.com/**', (route) => route.fulfill({ body: '' }));
});

const heroAnimations = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.getAnimations().filter((animation) => {
    const target = (animation.effect as KeyframeEffect | null)?.target;
    return target instanceof Element && !!target.closest('.schnitt');
  }).map((animation) => animation.playState));

test('hero cut-away plays once, then rests in its final state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('WordPress und KI für Ihr Unternehmen.');
  await expect(page.locator('.nav-brand')).toHaveAccessibleName(/lk media\s*Web · WordPress · KI/);
  await expect(page.locator('.footer-name')).toHaveAccessibleName('lk media – Startseite');
  await page.goto('/ki-automatisierung');
  const visual = page.locator('.schnitt');
  await expect(visual).toHaveAccessibleName(/Sie prüfen und geben frei/);
  expect((await heroAnimations(page)).length).toBeGreaterThan(0);
  // Einmalig: keine Endlosschleife, nach dem Ablauf keine laufende Animation mehr.
  await expect.poll(() => heroAnimations(page).then((states) => states.filter((s) => s === 'running').length), { timeout: 6000 }).toBe(0);
  await expect.poll(() => page.locator('.s-result').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  expect(errors).toEqual([]);
});

test('reduced motion shows the final state and cancels reveals without hiding content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.home .is-pending').first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.home .is-pending')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  await expect(page.locator('.hero img')).toBeVisible();
  await expect(page.getByRole('heading', { name: /So läuft ein Projekt/ })).toBeAttached();
  await page.setViewportSize({ width: 390, height: 844 });
  // Die Größenänderung kommt asynchron im Dokument an.
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('sections below the fold reveal on scroll and settle fully visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const row = page.locator('#leistungen .row').last();
  await expect(row).toHaveClass(/is-pending/);
  await row.scrollIntoViewIfNeeded();
  await expect(row).not.toHaveClass(/is-pending/);
  await expect.poll(() => row.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

for (const native of [true, false]) {
  test(`article progress tracks its bounds with ${native ? 'native CSS' : 'the fallback'}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    if (!native) {
      await page.addInitScript(() => {
        const supports = CSS.supports.bind(CSS);
        CSS.supports = (property: string, value?: string) =>
          property === 'timeline-scope' ? false : value === undefined ? supports(property) : supports(property, value);
      });
    }
    await page.goto('/blog/kanzlei-website-kosten/');
    const bar = page.locator('.read-progress');
    await expect(bar).toBeAttached();
    await expect(page.locator('.read-progress-source')).toHaveCount(native ? 1 : 0);
    for (const fraction of [0, 0.5, 1]) {
      await page.locator('article').evaluate((article, progress) => {
        const top = article.getBoundingClientRect().top + window.scrollY;
        const distance = article.getBoundingClientRect().height - window.innerHeight;
        window.scrollTo({ top: top + distance * progress, behavior: 'instant' });
      }, fraction);
      await expect.poll(() => bar.evaluate((element) =>
        new DOMMatrix(getComputedStyle(element).transform).a,
      )).toBeCloseTo(fraction, 2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(bar).toHaveCount(0);
    await expect(page.locator('.read-progress-source')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(bar).toHaveCount(1);
  });
}
