import { createRequire } from 'node:module';
import { expect, type Page, test } from '@playwright/test';

// Läuft im Projekt `dev` (astro dev mit PIPELINE_FAKE=1): fester Zugang „Fahrschule Test“ und ein
// In-Memory-GitHub je Session mit einem Auftrag im Status „Rückfrage“ (src/lib/aenderung-fake.ts).
let req = createRequire(import.meta.url);
for (const p of ['@lhci/cli', 'lighthouse']) req = createRequire(req.resolve(`${p}/package.json`));
const AXE = req.resolve('axe-core/axe.min.js');
const FRAGE = 'Sollen die neuen Preise nur für Klasse B gelten oder für alle Klassen?';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

// Eigene Session je Test → eigener Fake-Zustand, Tests laufen parallel.
let sid = '';
test.beforeEach(async ({ page, baseURL }, info) => {
  sid = `cs_test_e2e${info.workerIndex}x${Date.now()}`;
  const origin = new URL(baseURL ?? 'http://localhost:4325').origin;
  await page.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  await page.goto(`/aenderung?session_id=${sid}`);
});

const submit = (page: Page) => page.getByRole('button', { name: 'Auftrag absenden' });
const noValidate = (page: Page) =>
  page.locator('form[data-uploads]').evaluate((f: HTMLFormElement) => {
    f.noValidate = true;
  });

test('shows the name and the order in status Rückfrage with the question', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Änderung beauftragen – Fahrschule Test',
  );
  const item = page.getByRole('listitem').filter({ hasText: 'Nr. 1' });
  await expect(item).toContainText('Preise');
  await expect(item).toContainText('Rückfrage');
  await expect(item).toContainText(/\d{2}\.\d{2}\.\d{4}/);
  await expect(item.locator('blockquote')).toHaveText(FRAGE);
  await expect(item.getByLabel('Ihre Antwort')).toBeVisible();
  await expect(page.getByText('Bis zu 30 Minuten Änderungen pro Monat sind enthalten.')).toBeVisible();
});

test('empty submit → error at the text field, focus there, category kept', async ({ page }) => {
  await page.getByRole('radio', { name: 'Preise' }).check();
  await noValidate(page);
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST'),
    submit(page).click(),
  ]);
  expect(res.status()).toBe(400);
  await expect(page.locator('#text-fehler')).toContainText('mindestens 10 Zeichen');
  await expect(page.locator('#text')).toBeFocused();
  await expect(page.locator('#text')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('radio', { name: 'Preise' })).toBeChecked();
});

test('valid submit → success box with number, order appears as Eingegangen', async ({ page }) => {
  await page.getByRole('radio', { name: 'Texte' }).check();
  await page.locator('#text').fill('Bitte den Begrüßungstext auf der Startseite ändern.');
  await expect(page.locator('#text-zaehler')).toHaveText('51 / 5000 Zeichen');
  await submit(page).click();
  await expect(page).toHaveURL(/gesendet=2/);
  await expect(page.getByRole('status')).toContainText('Danke! Ihr Auftrag Nr. 2 ist angekommen.');
  const item = page.getByRole('listitem').filter({ hasText: 'Nr. 2' });
  await expect(item).toContainText('Texte');
  await expect(item).toContainText('Eingegangen');
});

test('double click sends only once', async ({ page }) => {
  await page.getByRole('radio', { name: 'Preise' }).check();
  await page.locator('#text').fill('Bitte Klasse B auf 70 € ändern.');
  await submit(page).dblclick();
  await expect(page.getByRole('status')).toContainText('Ihr Auftrag Nr. 2 ist angekommen.');
  await expect(page.getByRole('status')).toContainText('in der Regel innerhalb von 2 Werktagen');
  await expect(page.getByRole('listitem').filter({ hasText: 'Nr. 3' })).toHaveCount(0);
});

test('answering the question removes the Rückfrage', async ({ page }) => {
  await page.getByLabel('Ihre Antwort').fill('Für alle Klassen, bitte.');
  await page.getByRole('button', { name: 'Antwort senden' }).click();
  await expect(page.getByRole('status')).toContainText('Danke für Ihre Antwort');
  const item = page.getByRole('listitem').filter({ hasText: 'Nr. 1' });
  await expect(item).toContainText('Eingegangen');
  await expect(item.locator('blockquote')).toHaveCount(0);
});

test('answering a closed question shows the general hint', async ({ page }) => {
  await page.locator('form:has([name=action][value=antwort]) [name=nr]').evaluate((i: HTMLInputElement) => {
    i.value = '99';
  });
  await page.getByLabel('Ihre Antwort').fill('Hallo');
  await page.getByRole('button', { name: 'Antwort senden' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Diese Rückfrage ist bereits beantwortet oder abgeschlossen.' }),
  ).toBeFocused();
});

test('cross-site POST is rejected', async ({ request }) => {
  const r = await request.post(`/aenderung?session_id=${sid}`, {
    headers: { origin: 'https://evil.example' },
    multipart: { kategorie: 'preise', text: 'Fremder Auftrag von außen' },
  });
  expect(r.status()).toBe(403);
});

test('has no axe violations', async ({ page }) => {
  await page.addScriptTag({ path: AXE });
  const violations = await page.evaluate(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: axe wird zur Laufzeit eingebunden
    const axe = (window as any).axe;
    const r = await axe.run(
      // Nur der Seiteninhalt: Kopf- und Fußzeile sind seitenweit und nicht Teil dieser Seite.
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

test('no horizontal scrolling at 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.reload();
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
});
