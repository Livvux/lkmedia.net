import { describe, expect, it, vi } from 'vitest';
import { DEMO_KUNDEN, type Kunde, type Registry } from '../../src/lib/kunden';
import { createRateLimiter, handleSubmission, type SubmitDeps, type SubmitInput } from '../../src/lib/site-submit';

const fakeRegistry = (kunden: Kunde[] | null): Registry => ({
  all: async () => kunden,
  bySiteId: async (id) => kunden?.find((k) => k.id === id),
  bySession: async () => undefined,
});
const FS_ORIGIN = 'https://fahrschule.lkmedia.net';
function anmeldung(): FormData {
  const f = new FormData();
  const v = {
    vorname: 'Anna', nachname: 'Muster', geburtsdatum: '2000-05-01', klasse: 'B',
    standort: 'Rastatt', email: 'anna@kunde.de', einwilligung: 'ja', dauer: '20000',
  };
  for (const [k, x] of Object.entries(v)) f.append(k, x);
  return f;
}

const ORIGIN = 'https://handwerk.lkmedia.net';
function valid(): FormData {
  const f = new FormData();
  const v = {
    anliegen: 'Wallbox', plz: '76437', ort: 'Rastatt', beschreibung: 'Wallbox für E-Auto',
    name: 'Max Kunde', telefon: '0722212345', email: 'max@kunde.de', dauer: '20000',
  };
  for (const [k, x] of Object.entries(v)) f.append(k, x);
  return f;
}
const input = (o: Partial<SubmitInput> = {}): SubmitInput => ({
  siteId: 'demo', produkt: 'handwerkweb', form: 'anfrage', origin: ORIGIN, ip: '1.2.3.4', contentLength: 1000,
  formData: async () => valid(), ...o,
});
const deps = (o: Partial<SubmitDeps> = {}): SubmitDeps => ({
  send: vi.fn(async () => {}), release: vi.fn(), allow: () => true, dev: false, registry: fakeRegistry(DEMO_KUNDEN), ...o,
});

describe('handleSubmission', () => {
  it('versendet an die Register-Adresse und leitet auf /danke', async () => {
    const d = deps();
    const r = await handleSubmission(input(), d);
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/danke?f=anfrage` });
    expect(d.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'lucas@lkmedia.net' }));
  });
  it('unbekannte siteId → 404', async () =>
    expect((await handleSubmission(input({ siteId: 'nope' }), deps())).status).toBe(404));
  it('unbekanntes Formular → 404', async () =>
    expect((await handleSubmission(input({ form: 'admin' }), deps())).status).toBe(404));
  it('fremder Origin → 403, kein Versand', async () => {
    const d = deps();
    expect((await handleSubmission(input({ origin: 'https://evil.example' }), d)).status).toBe(403);
    expect(d.send).not.toHaveBeenCalled();
  });
  it('localhost nur im dev', async () => {
    expect((await handleSubmission(input({ origin: 'http://localhost:4321' }), deps())).status).toBe(403);
    expect((await handleSubmission(input({ origin: 'http://localhost:4321' }), deps({ dev: true }))).status).toBe(303);
  });
  it('Rate-Limit → /fehler?grund=limit', async () =>
    expect(await handleSubmission(input(), deps({ allow: () => false }))).toEqual({
      status: 303, location: `${ORIGIN}/fehler?grund=limit&f=anfrage`,
    }));
  it('zu großer Body → /fehler?grund=dateien, ohne zu parsen', async () => {
    const formData = vi.fn(async () => valid());
    const r = await handleSubmission(input({ contentLength: 50 * 1024 * 1024, formData }), deps());
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=dateien&f=anfrage` });
    expect(formData).not.toHaveBeenCalled();
  });
  it('Bot → /danke ohne Versand', async () => {
    const d = deps();
    const f = valid();
    f.set('website', 'spam');
    expect(await handleSubmission(input({ formData: async () => f }), d)).toEqual({
      status: 303, location: `${ORIGIN}/danke?f=anfrage`,
    });
    expect(d.send).not.toHaveBeenCalled();
  });
  it('Validierungsfehler → /fehler mit Grund', async () => {
    const f = valid();
    f.set('plz', 'abc');
    expect(await handleSubmission(input({ formData: async () => f }), deps())).toEqual({
      status: 303, location: `${ORIGIN}/fehler?grund=plz&f=anfrage`,
    });
  });
  it('SMTP-Fehler → /fehler?grund=versand', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await handleSubmission(input(), deps({ send: async () => { throw new Error('smtp down'); } }));
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=versand&f=anfrage` });
    expect(spy).toHaveBeenCalled();
    expect(JSON.stringify(spy.mock.calls)).not.toContain('Max Kunde');
  });
});

describe('handleSubmission – Register', () => {
  it('Fahrschul-Anmeldung → 303 /danke?f=anmeldung, Mail an Register-Adresse', async () => {
    const d = deps();
    const r = await handleSubmission(
      input({ siteId: 'fahrschule-demo', produkt: 'fahrschulweb', form: 'anmeldung', origin: FS_ORIGIN, formData: async () => anmeldung() }), d);
    expect(r).toEqual({ status: 303, location: `${FS_ORIGIN}/danke?f=anmeldung` });
    expect(d.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'lucas@lkmedia.net' }));
  });
  it('Handwerk-siteId über Fahrschul-Endpoint → 404', async () =>
    expect((await handleSubmission(input({ produkt: 'fahrschulweb', form: 'anmeldung' }), deps())).status).toBe(404));
  it('Formular eines anderen Produkts → 404', async () =>
    expect((await handleSubmission(input({ form: 'anmeldung' }), deps())).status).toBe(404));
  it('gekündigter Kunde → 404', async () => {
    const k = DEMO_KUNDEN.map((x) => (x.id === 'demo' ? { ...x, status: 'gekuendigt' as const } : x));
    expect((await handleSubmission(input(), deps({ registry: fakeRegistry(k) }))).status).toBe(404);
  });
  it('Kunde ohne formulare → 404', async () => {
    const k = DEMO_KUNDEN.map((x) => (x.id === 'demo' ? { ...x, formulare: undefined } : x));
    expect((await handleSubmission(input(), deps({ registry: fakeRegistry(k) }))).status).toBe(404);
  });
  it('Register nicht erreichbar → 503', async () =>
    expect(await handleSubmission(input(), deps({ registry: fakeRegistry(null) }))).toEqual({
      status: 503, body: 'Formular gerade nicht verfügbar. Bitte rufen Sie uns an.',
    }));
  it('Prototyp-Schlüssel als Formular → 404', async () =>
    expect((await handleSubmission(input({ form: 'constructor' }), deps())).status).toBe(404));
});

describe('createRateLimiter', () => {
  it('erlaubt max Treffer pro Fenster', () => {
    let t = 0;
    const allow = createRateLimiter(2, 1000, () => t);
    expect([allow('a'), allow('a'), allow('a'), allow('b')]).toEqual([true, true, false, true]);
    t = 1001;
    expect(allow('a')).toBe(true);
  });
});

describe('failure recovery and limiter capacity', () => {
  it('releases failed delivery attempts so a retry can succeed', async () => {
    const allow = createRateLimiter(1, 60_000);
    const d = deps({ allow, release: allow.release, send: vi.fn().mockRejectedValueOnce(new Error('smtp')).mockResolvedValue(undefined) });
    expect(await handleSubmission(input(), d)).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=versand&f=anfrage` });
    expect(await handleSubmission(input(), d)).toEqual({ status: 303, location: `${ORIGIN}/danke?f=anfrage` });
    expect(await handleSubmission(input(), d)).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=limit&f=anfrage` });
  });
  it('evicts only the oldest key at capacity and retains other counters', () => {
    const allow = createRateLimiter(1, 60_000);
    for (let n = 0; n < 10_000; n++) expect(allow(`ip-${n}`)).toBe(true);
    expect(allow('new-ip')).toBe(true);
    expect(allow('ip-1')).toBe(false);
    expect(allow('ip-9999')).toBe(false);
    expect(allow('ip-0')).toBe(true);
  });
});
