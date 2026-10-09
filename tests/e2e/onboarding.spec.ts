import { createRequire } from 'node:module';
import { expect, type Page, test } from '@playwright/test';

// Läuft im Projekt `dev` (astro dev ohne Stripe-Key): dort gilt jede Session als bezahlt.
// axe-core kommt transitiv über @lhci/cli → lighthouse; keine eigene Dependency.
let req = createRequire(import.meta.url);
for (const p of ['@lhci/cli', 'lighthouse']) req = createRequire(req.resolve(`${p}/package.json`));
const AXE = req.resolve('axe-core/axe.min.js');

const SID = 'cs_test_abc';
const MB = 1024 * 1024;
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:4325').origin;
  await page.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
});

for (const path of ['/fahrschule-webdesign/onboarding', '/docweb/onboarding', '/handwerk/onboarding']) {
  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${path}?session_id=${SID}`);
    });

    test('has upload fields and a progress list', async ({ page }) => {
      const form = page.locator('form[data-onboarding]');
      await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
      await expect(form.locator('input[type=file][name=logo]')).toHaveCount(1);
      await expect(form.locator('input[type=file][name=logo]')).not.toHaveAttribute('multiple');
      await expect(form.locator('input[type=file][name=fotos][multiple]')).toHaveCount(1);
      await expect(page.getByLabel('Logo', { exact: false }).first()).toBeVisible();

      const nav = page.getByRole('navigation', { name: 'Abschnitte' });
      await expect(nav).toContainText('ca. 15 Minuten');
      const links = nav.getByRole('link');
      expect(await links.count()).toBeGreaterThanOrEqual(4);
      for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
        await expect(page.locator(href ?? '#fehlt')).toHaveCount(1);
      }
    });

    test('rejects a 9 MB file at the field and blocks submitting', async ({ page }) => {
      const fotos = page.locator('input[type=file][name=fotos]');
      await fotos.setInputFiles({
        name: 'gross.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(9 * MB, 1),
      });
      const fehler = page.locator('#fotos-fehler');
      await expect(fehler).toHaveAttribute('role', 'alert');
      await expect(fehler).toContainText('größer als 8 MB');
      await expect(fotos).toHaveAttribute('aria-describedby', /fotos-fehler/);

      // Browser-Pflichtfeldprüfung aus, damit nur die Dateiprüfung das Absenden aufhält.
      await page.locator('form[data-onboarding]').evaluate((f: HTMLFormElement) => {
        f.noValidate = true;
      });
      await page.getByRole('button', { name: 'Angaben absenden' }).click();
      await expect(fotos).toBeFocused();
      await expect(page).toHaveURL(new RegExp(`${path}\\?session_id=${SID}$`));
    });

    test('shows a thumbnail with the file name as alt text', async ({ page }) => {
      await page
        .locator('input[type=file][name=logo]')
        .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG_1PX });
      await expect(page.getByRole('img', { name: 'logo.png' })).toBeVisible();
      await expect(page.locator('#logo-fehler')).toBeEmpty();
    });

    test('has no axe violations', async ({ page }) => {
      await page.addScriptTag({ path: AXE });
      const violations = await page.evaluate(async () => {
        // biome-ignore lint/suspicious/noExplicitAny: axe wird zur Laufzeit eingebunden
        const axe = (window as any).axe;
        const r = await axe.run(
          // Nur der Seiteninhalt: Kopf- und Fußzeile sind seitenweit und nicht Teil dieser Seiten.
          { include: [['main']] },
          { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        );
        return r.violations.map((v: { id: string; nodes: { target: string[] }[] }) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target.join(' ')),
        }));
      });
      expect(violations).toEqual([]);
    });
  });
}

test('error from the server receives focus', async ({ page }) => {
  await page.goto(`/handwerk/onboarding?session_id=${SID}&fehler=Bitte+Telefon+angeben.`);
  await expect(page.getByRole('alert').filter({ hasText: 'Bitte Telefon angeben.' })).toBeFocused();
});

test('text fields survive a reload, file inputs are skipped', async ({ page }) => {
  await page.goto(`/docweb/onboarding?session_id=${SID}`);
  await page.locator('[name=praxis_name]').fill('Praxis Test');
  await page.locator('[name=typ]').selectOption('zahnarzt');
  await page.locator('form[data-onboarding]').evaluate((f: HTMLFormElement) => {
    f.noValidate = true;
    f.addEventListener('submit', (e) => e.preventDefault());
  });
  await page.getByRole('button', { name: 'Angaben absenden' }).click();
  const saved = await page.evaluate((k) => localStorage.getItem(k), `docweb:${SID}`);
  expect(JSON.parse(saved ?? '{}')).toMatchObject({ praxis_name: ['Praxis Test'], typ: ['zahnarzt'] });
  expect(saved).not.toContain('"logo"');
  await page.reload();
  await expect(page.locator('[name=praxis_name]')).toHaveValue('Praxis Test');
  await expect(page.locator('[name=typ]')).toHaveValue('zahnarzt');
});

// Erzeugt im Browser Bilder und legt sie ins Fotos-Feld. `noise`: zufällige Pixel (groß als Datei).
async function pickPhotos(
  page: Page,
  specs: {
    name: string;
    type: string;
    w: number;
    h: number;
    noise: boolean;
    alpha: boolean;
    quality?: number;
  }[],
) {
  await page.evaluate(async (specs) => {
    const dt = new DataTransfer();
    for (const s of specs) {
      const c = new OffscreenCanvas(s.w, s.h);
      const ctx = c.getContext('2d') as OffscreenCanvasRenderingContext2D;
      if (s.noise) {
        const img = ctx.createImageData(s.w, s.h);
        for (let i = 0; i < img.data.length; i += 65536) {
          crypto.getRandomValues(img.data.subarray(i, i + 65536));
        }
        if (!s.alpha) for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
        ctx.putImageData(img, 0, 0);
      } else {
        ctx.fillStyle = s.alpha ? 'rgba(255,0,0,0.5)' : '#f00';
        ctx.fillRect(0, 0, s.w, s.h);
      }
      dt.items.add(new File([await c.convertToBlob({ type: s.type, quality: s.quality })], s.name, { type: s.type }));
    }
    const input = document.querySelector('input[name=fotos]') as HTMLInputElement;
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, specs);
}

const fotoInfo = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      [...((document.querySelector('input[name=fotos]') as HTMLInputElement).files ?? [])].map(
        async (f) => {
          const b = await createImageBitmap(f);
          return { name: f.name, type: f.type, w: b.width, h: b.height };
        },
      ),
    ),
  );

// Verlangsamt das Dekodieren, damit der Zwischenzustand prüfbar ist.
const slowDecode = (page: Page) =>
  page.addInitScript(() => {
    const orig = window.createImageBitmap.bind(window);
    // biome-ignore lint/suspicious/noExplicitAny: Test-Stub
    (window as any).createImageBitmap = async (...a: any[]) => {
      await new Promise((r) => setTimeout(r, 1500));
      // biome-ignore lint/suspicious/noExplicitAny: Test-Stub
      return (orig as any)(...a);
    };
  });

const status = (page: Page) => page.locator('#fotos-status');
const submit = (page: Page) => page.locator('form[data-onboarding] button[type=submit]');

test('large photos are shrunk to 2560 px, transparent PNGs stay PNG', async ({ page }) => {
  await page.goto(`/docweb/onboarding?session_id=${SID}`);
  await pickPhotos(page, [
    { name: 'foto.png', type: 'image/png', w: 3000, h: 1500, noise: true, alpha: false },
    { name: 'logo.png', type: 'image/png', w: 3000, h: 1500, noise: true, alpha: true },
  ]);
  await expect(page.locator('#fotos-vorschau img')).toHaveCount(2);
  await expect(submit(page)).toBeEnabled();
  expect(await fotoInfo(page)).toEqual([
    { name: 'foto.jpg', type: 'image/jpeg', w: 2560, h: 1280 },
    { name: 'logo.png', type: 'image/png', w: 2560, h: 1280 },
  ]);
});

test('keeps the original when the shrunk file would be larger', async ({ page }) => {
  await page.goto(`/docweb/onboarding?session_id=${SID}`);
  await pickPhotos(page, [
    // Stark komprimiertes JPEG: bei Qualität 0.85 neu kodiert würde es größer.
    { name: 'klein.jpg', type: 'image/jpeg', w: 3000, h: 1500, noise: true, alpha: false, quality: 0.05 },
  ]);
  await expect(page.locator('#fotos-vorschau img')).toHaveCount(1);
  await expect(submit(page)).toBeEnabled();
  expect(await fotoInfo(page)).toEqual([{ name: 'klein.jpg', type: 'image/jpeg', w: 3000, h: 1500 }]);
});

test('while shrinking: status text and disabled submit button', async ({ page }) => {
  await slowDecode(page);
  await page.goto(`/docweb/onboarding?session_id=${SID}`);
  await expect(status(page)).toHaveAttribute('aria-live', 'polite');
  await pickPhotos(page, [
    { name: 'a.png', type: 'image/png', w: 3000, h: 1500, noise: true, alpha: false },
    { name: 'b.png', type: 'image/png', w: 3000, h: 1500, noise: true, alpha: false },
  ]);
  await expect(status(page)).toHaveText('Bilder werden vorbereitet …');
  await expect(submit(page)).toBeDisabled();
  await expect(submit(page)).toHaveText('Bilder werden vorbereitet …');
  // Vorschau erscheint je Datei, sobald sie fertig ist.
  await expect(page.locator('#fotos-vorschau img')).toHaveCount(1);
  await expect(page.locator('#fotos-vorschau img')).toHaveCount(2);
  await expect(submit(page)).toBeEnabled();
  await expect(submit(page)).toHaveText('Angaben absenden');
  await expect(status(page)).toBeEmpty();
});

test('a newer selection is not overwritten by a late shrink', async ({ page }) => {
  await slowDecode(page);
  await page.goto(`/docweb/onboarding?session_id=${SID}`);
  await pickPhotos(page, [
    { name: 'alt.png', type: 'image/png', w: 3000, h: 1500, noise: true, alpha: false },
  ]);
  await expect(submit(page)).toBeDisabled();
  await page
    .locator('input[name=fotos]')
    .setInputFiles({ name: 'neu.png', mimeType: 'image/png', buffer: PNG_1PX });
  await expect(submit(page)).toBeEnabled({ timeout: 10_000 });
  await page.waitForTimeout(2000); // alter Lauf wäre jetzt fertig
  expect(await page.locator('input[name=fotos]').evaluate((i: HTMLInputElement) =>
    [...(i.files ?? [])].map((f) => f.name),
  )).toEqual(['neu.png']);
  await expect(page.getByRole('img', { name: 'neu.png' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'alt.png' })).toHaveCount(0);
});

test('danke page shows the Vorgangsnummer only for a plain number', async ({ page }) => {
  await page.goto('/fahrschule-webdesign/danke?nr=12');
  await expect(page.getByText('Ihre Vorgangsnummer: Nr. 12')).toBeVisible();
  await page.goto('/fahrschule-webdesign/danke?nr=%3Cscript%3E');
  await expect(page.getByText('Vorgangsnummer')).toHaveCount(0);
  await expect(page.locator('main script')).toHaveCount(0);
});
