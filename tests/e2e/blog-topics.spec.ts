import { expect, test } from '@playwright/test';

test('blog groups existing articles by user topic without indexing noindex content', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('h1')).toContainText('SEO, Webdesign & Marketing');
  for (const id of ['kanzleien', 'fahrschulen', 'arztpraxen', 'handwerk', 'seo-technik']) {
    await expect(page.locator(`nav[aria-label="Themen im Blog"] a[href="#${id}"]`)).toHaveCount(1);
    await expect(page.locator(`section#${id} h2`)).toBeVisible();
  }
  await expect(page.locator('#kanzleien a[href="/blog/kanzlei-website-kosten/"]')).toHaveCount(1);
  await expect(page.locator('#fahrschulen a[href="/marketing-ideen-fahrschule/"]')).toHaveCount(1);
  await expect(page.locator('#arztpraxen a[href="/docweb"]')).toHaveCount(1);
  await expect(page.locator('#handwerk a[href="/handwerk"]')).toHaveCount(1);
  await expect(page.locator('a[href*="real-debrid"]')).toHaveCount(0);
});

test('related articles connect actual sibling URLs and an appropriate offer', async ({ page }) => {
  await page.goto('/blog/kanzlei-website-kosten/');
  const kanzlei = page.locator('article aside[aria-label="Weitere Beiträge zu diesem Thema"]');
  await expect(kanzlei.locator('a[href="/kanzlei-marketing-2026-anwaelte-google/"]')).toHaveCount(1);
  await expect(kanzlei.locator('a[href="/local-seo-anwaelte-google-maps/"]')).toHaveCount(1);
  await expect(kanzlei.locator('a[href="/anwaelte"]')).toHaveCount(1);

  await page.goto('/case-study-patricks-fahrschule-local-seo/');
  const fahrschule = page.locator('article aside[aria-label="Weitere Beiträge zu diesem Thema"]');
  await expect(fahrschule.locator('a[href="/blog/fahrschul-website-kosten-funktionen/"]')).toHaveCount(1);
  await expect(fahrschule.locator('a[href="/marketing-ideen-fahrschule/"]')).toHaveCount(1);
  await expect(fahrschule.locator('a[href="/fahrschule-webdesign"]')).toHaveCount(1);
});

test('the Kanzlei service hub links back to its supporting guides', async ({ page }) => {
  await page.goto('/anwaelte');
  const guides = page.locator('section[aria-labelledby="kanzlei-ratgeber-title"]');
  await expect(guides.locator('a[href="/blog/kanzlei-website-kosten/"]')).toHaveCount(1);
  await expect(guides.locator('a[href="/kanzlei-marketing-2026-anwaelte-google/"]')).toHaveCount(1);
  await expect(guides.locator('a[href="/local-seo-anwaelte-google-maps/"]')).toHaveCount(1);
});
