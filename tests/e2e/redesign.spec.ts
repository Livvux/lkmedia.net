import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    axe: {
      run: (context: Document, options: { runOnly: string[] }) => Promise<{
        violations: { id: string; nodes: { target: string[] }[] }[];
      }>;
    };
  }
}

// Keep marketing QA independent of analytics availability and external account state.
test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
});

for (const width of [320, 390, 1440]) {
  test(`core pages remain readable and contained at ${width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of ['/', '/leistungen', '/cases', '/kontakt', '/docweb', '/handwerk', '/fahrschule-webdesign', '/blog']) {
      expect((await page.goto(path))?.status(), path).toBe(200);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
      // Reduced motion must also cancel JavaScript-driven decoration.
      expect(await page.evaluate(() => document.getAnimations().filter((animation) => animation.playState === 'running').length), path).toBe(0);
    }
    expect(errors).toEqual([]);
  });
}

test('desktop navigation connects offers, project evidence and an accessible enquiry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const navigation = page.locator('[data-site-header] nav');
  await navigation.locator('a[href="/leistungen"]').click();
  await expect(page).toHaveURL(/\/leistungen$/);
  await expect(navigation.locator('a[href="/leistungen"]')).toHaveAttribute('aria-current', 'page');
  await page.locator('main a[href="/docweb"]').first().click();
  await expect(page).toHaveURL(/\/docweb$/);
  await navigation.locator('a[href="/cases"]').click();
  await page.locator('main a[href^="/cases/"]').first().click();
  await expect(page.locator('article')).toBeVisible();
  await navigation.locator('a[href="/kontakt"]').click();
  await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
  await expect(page.getByLabel('E-Mail', { exact: true })).toHaveAttribute('type', 'email');
  await expect(page.getByLabel('Nachricht', { exact: true })).toHaveAccessibleDescription(/Website-Adresse/);
  await expect(page.getByRole('button', { name: 'Projektanfrage senden' })).toBeEnabled();
  await expect(page.locator('form[action="/api/contact"]')).toHaveAttribute('method', /post/i);
});

test('mobile menu supports keyboard dismissal, navigation and resize recovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  const panel = page.locator('[data-menu-panel]');
  await expect(panel).toHaveAttribute('inert', '');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Zum Inhalt springen' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).not.toHaveAttribute('inert');
  await expect(page.getByRole('main')).toHaveAttribute('inert', '');
  await panel.locator('a').last().focus();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(panel.locator('a').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await expect(panel).toHaveAttribute('inert', '');
  await toggle.click();
  await panel.locator('a[href="/leistungen"]').click();
  await expect(page).toHaveURL(/\/leistungen$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden');
});

test('social previews and article structured data agree with canonical pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://lkmedia.net/');
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'lkmedia');
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /lkmedia/);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await page.goto('/blog/rankmath-einstellungen-2025/');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  const nodes: Record<string, unknown>[] = structuredData.flatMap((source) => JSON.parse(source));
  const article = nodes.find((node) => node['@type'] === 'BlogPosting');
  expect(article).toMatchObject({
    '@id': `${canonical}#article`,
    url: canonical,
    mainEntityOfPage: canonical,
    inLanguage: 'de-DE',
  });
});

test.describe('progressive enhancement', () => {
  test.use({ javaScriptEnabled: false });

  test('homepage offers and enquiry remain available without JavaScript', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const offers = page.locator('main a[href="/leistungen"]').first();
    await expect(offers).toBeVisible();
    await offers.click();
    await page.locator('main a[href="/docweb"]').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('/kontakt');
    await expect(page.getByLabel('E-Mail', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Projektanfrage senden' })).toBeEnabled();
    await expect(page.getByRole('link', { name: 'Kalender auf Cal.com öffnen' })).toHaveAttribute('href', /^https:\/\/cal\.com\//);
  });
});


test('navigation remains usable when deferred assets fail to load', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/_astro/*.js', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  if (await toggle.isVisible()) {
    // Astro may inline the small navigation script even when deferred islands cannot load.
    await toggle.click();
    await page.locator('[data-menu-panel] a[href="/leistungen"]').click();
  } else {
    const navigation = page.getByRole('navigation', { name: 'Hauptnavigation', exact: true });
    await navigation.getByRole('link', { name: 'Leistungen', exact: true }).click();
  }
  await expect(page).toHaveURL(/\/leistungen$/);
});

test('project preview stops when reduced motion changes during a visit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const video = page.locator('video[data-preview]');
  await video.scrollIntoViewIfNeeded();
  await expect(video).toHaveAttribute('src', '/cases/eichhoernchenberger/walkthrough.mp4');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await page.getByRole('button', { name: 'Vorschau pausieren' }).click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  await page.getByRole('button', { name: 'Vorschau abspielen' }).click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
});


test('preparation progress exposes its value and inbox examples advance on request', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/docweb');
  const progress = page.getByRole('progressbar', { name: 'Vorbereitung Ihrer Website' });
  await progress.scrollIntoViewIfNeeded();
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  await page.locator('#vorbereitung').getByRole('checkbox').first().check();
  await expect.poll(() => progress.getAttribute('aria-valuenow')).not.toBe('0');
  await page.goto('/handwerk');
  const examples = page.getByRole('list', { name: 'Beispiele eingehender Anfragen und Bewerbungen' });
  const before = await examples.innerText();
  await page.getByRole('button', { name: 'Nächstes Beispiel' }).click();
  await expect(examples).not.toHaveText(before);
});


test('marketing pages have no WCAG accessibility violations', async ({ page }) => {
  test.setTimeout(90_000);
  let require = createRequire(import.meta.url);
  for (const dependency of ['@lhci/cli', 'lighthouse']) {
    require = createRequire(require.resolve(`${dependency}/package.json`));
  }
  const axePath = require.resolve('axe-core/axe.min.js');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/leistungen', '/ueber', '/fahrschule-webdesign', '/docweb', '/handwerk']) {
    await page.goto(path);
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const { axe } = window;
      const result = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] });
      return result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }));
    });
    expect(violations, path).toEqual([]);
  }
});
