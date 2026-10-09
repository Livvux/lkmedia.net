import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

// Läuft im Projekt `dev` (astro dev ohne Stripe-Key): dort gilt jede Session als bezahlt.
// axe-core kommt transitiv über @lhci/cli → lighthouse; keine eigene Dependency.
let req = createRequire(import.meta.url);
for (const p of ['@lhci/cli', 'lighthouse']) req = createRequire(req.resolve(`${p}/package.json`));
const AXE = req.resolve('axe-core/axe.min.js');

const SID = 'cs_test_abc';
const MB = 1024 * 1024;

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
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64',
      );
      await page
        .locator('input[type=file][name=logo]')
        .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
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

test('large photos are shrunk to 2560 px, transparent PNGs stay PNG', async ({ page }) => {
  await page.goto(`/docweb/onboarding?session_id=${SID}`);
  const result = await page.evaluate(async () => {
    const make = async (type: string, alpha: boolean) => {
      const c = new OffscreenCanvas(3000, 1500);
      const ctx = c.getContext('2d') as OffscreenCanvasRenderingContext2D;
      ctx.fillStyle = alpha ? 'rgba(255,0,0,0.5)' : '#f00';
      ctx.fillRect(0, 0, 3000, 1500);
      return new File([await c.convertToBlob({ type })], alpha ? 'logo.webp' : 'foto.png', { type });
    };
    const input = document.querySelector<HTMLInputElement>('input[name=fotos]') as HTMLInputElement;
    const dt = new DataTransfer();
    dt.items.add(await make('image/png', false));
    dt.items.add(await make('image/webp', true));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    for (let i = 0; i < 100 && input.files?.[0]?.name !== 'foto.jpg'; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return Promise.all(
      [...(input.files ?? [])].map(async (f) => {
        const b = await createImageBitmap(f);
        return { name: f.name, type: f.type, w: b.width, h: b.height };
      }),
    );
  });
  expect(result).toEqual([
    { name: 'foto.jpg', type: 'image/jpeg', w: 2560, h: 1280 },
    { name: 'logo.png', type: 'image/png', w: 2560, h: 1280 },
  ]);
});
