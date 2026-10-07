import { describe, expect, it, vi } from 'vitest';
import { createRateLimiter, handleSubmission, type SubmitDeps, type SubmitInput } from '../../src/lib/handwerk-submit';

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
  siteId: 'demo', form: 'anfrage', origin: ORIGIN, ip: '1.2.3.4', contentLength: 1000,
  formData: async () => valid(), ...o,
});
const deps = (o: Partial<SubmitDeps> = {}): SubmitDeps => ({
  send: vi.fn(async () => {}), allow: () => true, dev: false, ...o,
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
      status: 303, location: `${ORIGIN}/fehler?grund=limit`,
    }));
  it('zu großer Body → /fehler?grund=dateien, ohne zu parsen', async () => {
    const formData = vi.fn(async () => valid());
    const r = await handleSubmission(input({ contentLength: 50 * 1024 * 1024, formData }), deps());
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=dateien` });
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
      status: 303, location: `${ORIGIN}/fehler?grund=plz`,
    });
  });
  it('SMTP-Fehler → /fehler?grund=versand', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await handleSubmission(input(), deps({ send: async () => { throw new Error('smtp down'); } }));
    expect(r).toEqual({ status: 303, location: `${ORIGIN}/fehler?grund=versand` });
  });
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
