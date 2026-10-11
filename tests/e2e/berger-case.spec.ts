import { expect, test } from '@playwright/test';

for (const locale of ['de', 'en'] as const) {
  for (const width of [1280, 390]) {
    test(`Berger case: ${locale}, ${width}px, working media and project links`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const runtimeErrors: string[] = [];
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      const path = `${locale === 'en' ? '/en' : ''}/cases/eichhoernchenberger`;
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://lkmedia.net${path}`);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://lkmedia.net/cases/eichhoernchenberger/desktop.webp');

      const images = page.locator('article img');
      await expect(images).toHaveCount(3);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
        await expect(image).not.toHaveAttribute('alt', '');
      }

      const video = page.locator('article video');
      await video.scrollIntoViewIfNeeded();
      await expect(video).toHaveAttribute('preload', 'none');
      await expect(video).not.toHaveAttribute('autoplay');
      await video.evaluate((element: HTMLVideoElement) => element.play());
      await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
      expect(await video.evaluate((element: HTMLVideoElement) => element.error)).toBeNull();
      await video.evaluate((element: HTMLVideoElement) => element.pause());

      const contact = page.locator(`article a[href="${locale === 'en' ? '/en/contact' : '/kontakt'}"]`);
      await contact.click();
      await expect(page).toHaveURL(new RegExp(`${locale === 'en' ? '/en/contact' : '/kontakt'}$`));
      await page.goto(path);
      await expect(page.locator('article a[href="https://pfotenweb.de/"]')).toHaveCount(locale === 'en' ? 1 : 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(runtimeErrors).toEqual([]);
    });
  }
}
