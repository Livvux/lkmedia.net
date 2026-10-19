import { expect, test } from '@playwright/test';

const publishedPosts = [
  '/blog/arztpraxis-website-erstellen-lassen/',
  '/case-study-patricks-fahrschule-local-seo/',
  '/e-mails-schreiben-mit-chatgpt/',
  '/blog/fahrschul-website-kosten-funktionen/',
  '/blog/how-its-built-website-technologien-erkennen/',
  '/kanzlei-marketing-2026-anwaelte-google/',
  '/blog/kanzlei-website-kosten/',
  '/blog/ki-coding-modelle-ranking-swe-bench-2025/',
  '/local-seo-anwaelte-google-maps/',
  '/marketing-ideen-fahrschule/',
  '/blog/rankmath-einstellungen-2025/',
  '/blog/webdesign-fuer-handwerker/',
];

const editorialIllustrations = [
  'praxis-website-ablauf.svg',
  'fahrschule-website-anmeldung.svg',
  'handwerk-projektanfrage.svg',
  'kanzlei-website-budget.svg',
  'patricks-fahrschule-struktur.svg',
  'kanzlei-marketing-audit.svg',
  'fahrschule-marketing-ablauf.svg',
];

test('every indexable article has an accessible visible image with a working source', async ({ page, request }) => {
  test.setTimeout(160_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of publishedPosts) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    const images = page.locator('article img');
    expect(await images.count(), path).toBeGreaterThan(0);
    for (const image of await images.all()) {
      const alt = await image.getAttribute('alt');
      expect(alt?.trim().length, `${path}: missing image alt`).toBeGreaterThan(18);
      const src = await image.getAttribute('src');
      expect(src?.startsWith('/'), path).toBe(true);
      const asset = await request.get(src ?? '/');
      expect(asset.status(), `${path} references ${src}`).toBe(200);
      expect(await image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), src ?? path).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
  }
});

test('editorial SVGs describe diagrams, not fabricated clients or search measurements', async ({ request }) => {
  for (const name of editorialIllustrations) {
    const response = await request.get(`/posts/${name}`);
    expect(response.status(), name).toBe(200);
    const source = await response.text();
    expect(source).toContain('<svg');
    expect(source).toContain('<title');
    expect(source).toContain('SCHEMA · KEINE ECHTEN KUNDENDATEN');
    expect(source).not.toMatch(/<script\b/i);
  }
});

test('unverified Fahrschule stats are no longer marketed as current results', async ({ page }) => {
  for (const path of ['/fahrschule-webdesign', '/case-study-patricks-fahrschule-local-seo/', '/cases/patricks-fahrschule']) {
    await page.goto(path);
    const body = await page.locator('main').innerText();
    expect(body, path).not.toContain('671');
    expect(body, path).not.toContain('Position 1 in Rastatt, Durmersheim, Sinzheim');
  }
});
