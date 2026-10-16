import { expect, test } from '@playwright/test';

test('sitemap pages have working internal links and image sources', async ({ page, request }) => {
  test.setTimeout(180_000);
  const locations = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  const pages: string[] = [];
  for (const sitemap of locations(await index.text())) {
    const response = await request.get(new URL(sitemap).pathname);
    expect(response.status()).toBe(200);
    pages.push(...locations(await response.text()));
  }
  expect(pages.length).toBeGreaterThan(20);
  const sources = new Map<string, Set<string>>();
  for (const url of pages) {
    const path = new URL(url).pathname;
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('meta[name="robots"][content*="noindex"]'), path).toHaveCount(0);
    const schemaErrors = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.flatMap((script) => {
      try { JSON.parse(script.textContent ?? ''); return []; }
      catch { return ['Invalid JSON-LD']; }
    }));
    expect(schemaErrors, path).toEqual([]);
    const refs = await page.evaluate(() => {
      const refs = [...document.querySelectorAll('a[href], img[src], source[src], video[src], video[data-src], [poster], meta[property="og:image"]')]
        .map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? el.getAttribute('data-src') ?? el.getAttribute('poster') ?? el.getAttribute('content'));
      refs.push(...[...document.querySelectorAll('[poster]')].map((el) => el.getAttribute('poster')));
      for (const el of document.querySelectorAll('[srcset]')) {
        refs.push(...(el.getAttribute('srcset') ?? '').split(',').map((src) => src.trim().split(/\s+/)[0]));
      }
      return refs.filter((ref): ref is string => !!ref);
    });
    for (const ref of refs) {
      const target = new URL(ref, url);
      if (target.origin !== 'https://lkmedia.net') continue;
      // Forms and personal links are exercised by the dedicated purchase suites.
      if (/^\/(?:api|aenderung)(?:\/|$)/.test(target.pathname)) continue;
      const key = target.pathname + target.search;
      if (!sources.has(key)) sources.set(key, new Set());
      sources.get(key)?.add(path);
    }
  }
  const entries = [...sources.entries()];
  for (let i = 0; i < entries.length; i += 8) {
    await Promise.all(entries.slice(i, i + 8).map(async ([path, from]) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect.soft(response.status(), `${path} linked from ${[...from].join(', ')}`).toBe(200);
    }));
  }
});
