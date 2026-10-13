import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { parse } from 'yaml';

const CONTROL = 'http://localhost:4328';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const products = [
  {
    id: 'docweb', path: '/docweb', nameField: 'praxis_name', name: 'Praxis Lokaltest',
    fields: { praxis_name: 'Praxis Lokaltest', fachrichtung: 'Allgemeinmedizin', telefon: '072221234', email: 'praxis@example.test', strasse: 'Teststraße 1', plz: '76437', ort: 'Rastatt', oeffnungszeiten: 'Mo–Fr 8–12 Uhr', team: 'Dr. Test', leistungen: 'Vorsorge und Impfungen', kammer: 'Landesärztekammer Baden-Württemberg', berufsbezeichnung: 'Arzt' },
  },
  {
    id: 'handwerkweb', path: '/handwerk', nameField: 'betrieb_name', name: 'Handwerk Lokaltest',
    fields: { betrieb_name: 'Handwerk Lokaltest', telefon: '072221234', email: 'handwerk@example.test', strasse: 'Teststraße 1', plz: '76437', ort: 'Rastatt', oeffnungszeiten: 'Mo–Fr 8–16 Uhr', einsatzgebiet: 'Rastatt und Umgebung', leistungen: 'Wärmepumpen und Heizung', inhaber: 'Max Test', handwerkskammer: 'Handwerkskammer Karlsruhe' },
  },
  {
    id: 'fahrschulweb', path: '/fahrschule-webdesign', nameField: 'fahrschule_name', name: 'Fahrschule Lokaltest',
    fields: { fahrschule_name: 'Fahrschule Lokaltest', telefon: '072221234', email: 'fahrschule@example.test', strasse: 'Teststraße 1', plz: '76437', ort: 'Rastatt', buerozeiten: 'Mo–Fr 8–16 Uhr', theorie: 'Mo und Mi 18 Uhr', inhaber: 'Max Test', erlaubnisbehoerde: 'Landratsamt Rastatt' },
  },
] as const;

type State = {
  products: Record<string, { link: string; linkId: string; session: string }>;
  mail: { to: string; text: string; subject: string; mime: string; attachments: { filename: string; content: string }[] }[];
  files: { path: string; content: string }[];
  issues: { number: number; body: string; title: string; labels: string[] }[];
  comments: Record<string, { body: string }[]>;
  stripeChecks: { id: string; paid: boolean; link?: string }[];
};

for (const product of products) {
  test(`${product.id}: purchase → configuration → confirmation → later change`, async ({ page, request }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const state = async (): Promise<State> => (await request.get(`${CONTROL}/state`)).json();
    const config = (await state()).products[product.id];
    const sid = config.session;
    const api = `/api/${product.path.slice(1) === 'fahrschule-webdesign' ? 'fahrschule' : product.path.slice(1)}-onboarding`;
    const multipart = { ...product.fields, session_id: sid,
      ...(product.id === 'docweb' ? { typ: 'arzt', booking_type: 'phone' } :
        product.id === 'handwerkweb' ? { gewerke: 'shk' } : { klassen: 'B' }) };
    const post = () => request.post(api, { multipart, headers: { Origin: 'http://localhost:4327' }, maxRedirects: 0 });
    const hash = createHash('sha256').update(sid).digest('hex').slice(0, 12);
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.href === config.link) {
        const checkout = await request.get(`${CONTROL}/checkout?product=${product.id}`);
        await route.fulfill({ response: checkout });
      } else if (['http://localhost:4327', CONTROL].includes(url.origin)) {
        await route.continue();
      } else {
        await route.abort();
      }
    });

    // An unpaid session must not render configuration or permit a change request.
    await request.get(`${CONTROL}/checkout?product=${product.id}`);
    await page.goto(`${product.path}/onboarding?session_id=${sid}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bestellung nicht gefunden.');
    await expect(page.locator('form#onboarding')).toHaveCount(0);
    const unpaid = await request.get(`/aenderung?session_id=${sid}`);
    expect(unpaid.status()).toBe(403);
    expect((await post()).status()).toBe(403);
    expect((await state()).mail.some(m => m.to === `${product.id}@example.test`)).toBe(false);

    await page.goto('/leistungen');
    await page.locator(`.offer .btn[href="${product.path}"]`).click();
    await page.locator(`a[href="${config.link}"]`).first().click();
    await expect(page.getByRole('heading')).toHaveText('Lokaler Checkout-Test');
    await page.getByRole('button', { name: 'Zahlung im Test bestätigen' }).click();
    await expect(page).toHaveURL(`${testInfo.project.use.baseURL}${product.path}/onboarding?session_id=${sid}`);
    await expect(page.locator('form#onboarding')).toBeVisible();

    for (const [key, value] of Object.entries(product.fields)) {
      await page.locator(`[name="${key}"]`).fill(value);
    }
    if (product.id === 'docweb') {
      await page.locator('[name=typ]').selectOption('arzt');
      await page.locator('[name=booking_type]').selectOption('phone');
    } else if (product.id === 'handwerkweb') {
      await page.locator('[name=gewerke][value=shk]').check();
    } else {
      await page.locator('[name=klassen][value=B]').check();
    }
    await page.locator('[name=wunschfarbe]').fill('#123456');
    await page.locator('[name=wunschdomain]').fill(`${product.id}-test.de`);
    await page.locator('[name=hinweise]').fill('Bitte eine gut lesbare Website erstellen.');
    await page.locator('[name=logo]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG });
    await page.locator('[name=fotos]').setInputFiles({ name: 'team.png', mimeType: 'image/png', buffer: PNG });
    await page.getByRole('button', { name: 'Angaben absenden' }).click();
    await expect(page).toHaveURL(new RegExp(`${product.path}/danke\\?nr=\\d+$`));
    const saved = await state();
    const issue = saved.issues.find(i => i.labels.includes(product.id));
    expect(issue).toBeDefined();
    expect(issue?.title).toContain(product.name);
    const yaml = saved.files.find(f => f.path === `inbox/${product.id}-${hash}/kunde.yaml`);
    expect(yaml).toBeDefined();
    const text = Buffer.from(yaml?.content ?? '', 'base64').toString();
    for (const value of Object.values(product.fields)) expect(text).toContain(value);
    expect(text).toContain('#123456');
    expect(text).toContain(`${product.id}-test.de`);
    expect(text).not.toContain(sid);
    expect(parse(text)).toMatchObject({ bestellung: { stripe_session_hash: hash } });
    for (const suffix of ['logo.png', 'fotos/team.png']) {
      const file = saved.files.find(f => f.path === `inbox/${product.id}-${hash}/${suffix}`);
      expect(Buffer.from(file?.content ?? '', 'base64')).toEqual(PNG);
    }
    const confirmation = saved.mail.find(m => m.to === `${product.id}@example.test`);
    expect(confirmation?.text).toContain(`/aenderung?session_id=${sid}`);
    expect(confirmation?.mime).toContain(`To: ${product.id}@example.test`);
    const operator = saved.mail.find(m => m.subject === `${product.id} Onboarding: ${product.name}`);
    expect(operator?.to).toBe('lucas@lkmedia.net');
    expect(operator?.attachments[0].filename).toBe('kunde.yaml');
    expect(saved.stripeChecks).toContainEqual({ id: sid, paid: false, link: config.linkId });
    expect(saved.stripeChecks).toContainEqual({ id: sid, paid: true, link: config.linkId });

    const beforeDuplicate = saved.mail.length;
    expect((await post()).status()).toBe(429);
    expect((await state()).mail).toHaveLength(beforeDuplicate);

    // The buyer's real personal link opens the real production change endpoint.
    await page.goto(`/aenderung?session_id=${sid}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(product.name);
    await page.locator('[name=kategorie][value=zeiten]').check();
    await page.locator('[name=text]').fill('Bitte unsere Öffnungszeiten auf Montag bis Freitag 9–17 Uhr ändern.');
    await page.locator('[name=bilder]').setInputFiles({ name: 'neu.png', mimeType: 'image/png', buffer: PNG });
    await page.getByRole('button', { name: 'Auftrag absenden' }).click();
    await expect(page.getByRole('status')).toContainText('Ihre Änderung ist angekommen');
    const changed = await state();
    expect(changed.comments[String(issue?.number)]?.some(c => c.body.includes('9–17 Uhr'))).toBe(true);
    expect(changed.files.some(f => f.path.includes(`inbox/${product.id}-${hash}/aenderungen/`) && f.path.endsWith('neu.png'))).toBe(true);
    expect(changed.mail.filter(m => m.to === `${product.id}@example.test`)).toHaveLength(2);
    expect(changed.issues.filter(i => i.labels.includes(product.id))).toHaveLength(1);
    expect(runtimeErrors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`${product.id}-confirmed.png`), fullPage: true });
  });
}

test('paid session for another product cannot open its configuration', async ({ page, request }) => {
  await request.get(`${CONTROL}/checkout?product=docweb`);
  expect((await request.post(`${CONTROL}/pay?product=docweb`, { maxRedirects: 0 })).status()).toBe(303);
  const state: State = await (await request.get(`${CONTROL}/state`)).json();
  const response = await page.goto(`/handwerk/onboarding?session_id=${state.products.docweb.session}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bestellung nicht gefunden.');
  await expect(page.locator('form#onboarding')).toHaveCount(0);
  const checked: State = await (await request.get(`${CONTROL}/state`)).json();
  expect(checked.stripeChecks.at(-1)).toEqual({ id: state.products.docweb.session, paid: true, link: state.products.docweb.linkId });
  const wrongPost = await request.post('/api/handwerk-onboarding', {
    multipart: { ...products[1].fields, gewerke: 'shk', session_id: state.products.docweb.session },
    headers: { Origin: 'http://localhost:4327' }, maxRedirects: 0,
  });
  expect(wrongPost.status()).toBe(403);
  expect((await (await request.get(`${CONTROL}/state`)).json() as State).mail).toHaveLength(state.mail.length);
});
