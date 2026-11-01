import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://analytics.rpcrate.com/**', (route) => route.fulfill({ body: '' }));
  await page.route('https://analytics.vertexmods.com/**', (route) => route.fulfill({ body: '' }));
});

test('hero projects follow scroll while the headline stays pinned and links work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  const scene = page.locator('[data-hero-scene]');
  await expect(scene).toHaveClass(/is-motion/);
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveAccessibleName('Design, Technik & ein klarer Auftritt.');
  await expect(page.locator('.nav-brand')).toHaveAccessibleName(/lk media\s*Webdesign & SEO/);
  await expect(page.locator('.footer-name')).toHaveAccessibleName('lk media – Startseite');
  const project = page.locator('[data-hero-project]').first();
  const initial = await project.evaluate((element) => getComputedStyle(element).transform);
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await expect.poll(() => project.evaluate((element) => getComputedStyle(element).transform)).not.toBe(initial);
  await expect.poll(() => project.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.8);
  expect(await page.locator('.hero').evaluate((element) => Math.abs(element.getBoundingClientRect().top))).toBeLessThan(1);
  await expect(title).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.getByRole('link', { name: 'Weiter entdecken' }).click();
  await expect(page).toHaveURL(/#entdecken$/);
  await expect(page.getByRole('heading', { name: 'Ein guter Auftritt ist kein Zufall.' })).toBeInViewport();
  const statement = page.locator('.intro-statement');
  await statement.scrollIntoViewIfNeeded();
  await expect.poll(() => statement.locator('.motion-word').first().evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  await page.locator('.services').scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Lokal sichtbar werden. – SEO in Rastatt' })).toBeVisible();
  await page.getByRole('link', { name: 'Lokal sichtbar werden. – SEO in Rastatt' }).click();
  await expect(page).toHaveURL(/\/seo-rastatt$/);
  expect(errors).toEqual([]);
});

test('reduced motion toggles remove pinning and all animation without hiding content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-hero-scene]')).toHaveClass(/is-motion/);
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-hero-scene]')).not.toHaveClass(/is-motion/);
  await expect(page.locator('.motion-word')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  await expect(page.getByRole('heading', { name: 'Ein guter Auftritt ist kein Zufall.' })).toBeVisible();
  const image = page.locator('[data-motion-image] img').first();
  expect(await image.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('[data-hero-scene]')).toHaveClass(/is-motion/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-hero-scene]')).not.toHaveClass(/is-motion/);
  await expect(page.locator('.hero-projects')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('mobile text reveals settle and project images respond to scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.motion-word').first()).toBeVisible();
  const heading = page.getByRole('heading', { name: 'Ein guter Auftritt ist kein Zufall.' });
  await heading.scrollIntoViewIfNeeded();
  await expect.poll(() => heading.locator('.motion-word').last().evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  const frame = page.locator('[data-motion-image]').first();
  await frame.scrollIntoViewIfNeeded();
  const image = frame.locator('img, video');
  const before = await image.evaluate((element) => getComputedStyle(element).transform);
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
  await expect.poll(() => image.evaluate((element) => getComputedStyle(element).transform)).not.toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
