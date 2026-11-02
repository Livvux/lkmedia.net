import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://analytics.rpcrate.com/**', (route) => route.fulfill({ body: '' }));
  await page.route('https://analytics.vertexmods.com/**', (route) => route.fulfill({ body: '' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

const scrollThrough = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 400) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });

test('subpage reveals settle fully visible and switch off with reduced motion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/fahrschule-webdesign');
  await expect(page.locator('main .motion-word').first()).toBeAttached();
  await scrollThrough(page);
  // Regression: früher blieben hier alle Abschnitte trotz .is-visible auf opacity 0.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>('main *')].filter(
            (element) => element.offsetWidth > 0 && getComputedStyle(element).opacity === '0',
          ).length,
      ),
    )
    .toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.motion-word')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test('long articles show reading progress', async ({ page }) => {
  await page.goto('/blog/kanzlei-website-kosten/');
  const bar = page.locator('.read-progress');
  await expect(bar).toBeAttached();
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2));
  await expect
    .poll(() => bar.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a))
    .toBeGreaterThan(0.2);
});
