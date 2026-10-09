import type { APIRoute } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { parseOnboarding, toKundeYaml } from '../../src/lib/fahrschulweb';

const { sendMail, checkPaidSession } = vi.hoisted(() => ({ sendMail: vi.fn(), checkPaidSession: vi.fn() }));
vi.mock('../../src/lib/mailer', () => ({ sendMail }));
// paymentLinkId ist bis zum Anlegen des Links leer – Stripe-Check daher direkt mocken.
vi.mock('../../src/lib/stripe', async (orig) => ({
  ...(await orig<typeof import('../../src/lib/stripe')>()),
  checkPaidSession,
}));

const SESSION = 'cs_test_fahrschule123';

function form(o: Record<string, string | string[]> = {}): FormData {
  const base: Record<string, string | string[]> = {
    session_id: SESSION,
    fahrschule_name: 'Fahrschule Muster',
    telefon: '07222 12345',
    email: 'info@fahrschule.de',
    klassen: ['B', 'BE', 'hack'],
    strasse: 'Hauptstraße 1',
    plz: '76437',
    ort: 'Rastatt',
    buerozeiten: 'Mo und Mi 17–19 Uhr',
    theorie: 'Di und Do 18:30–20 Uhr',
    inhaber: 'Max Muster',
    erlaubnisbehoerde: 'Landratsamt Rastatt',
    ...o,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

describe('parseOnboarding', () => {
  it('akzeptiert ein vollständiges Formular und filtert unbekannte Klassen', () => {
    const r = parseOnboarding(form());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.klassen).toEqual(['B', 'BE']);
  });

  it('meldet fehlende Pflichtfelder und Klassen', () => {
    const r = parseOnboarding(form({ fahrschule_name: '', klassen: [], erlaubnisbehoerde: '' }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join(' ')).toMatch(/Name der Fahrschule/);
      expect(r.errors.join(' ')).toMatch(/Führerscheinklasse/);
      expect(r.errors.join(' ')).toMatch(/Erlaubnisbehörde/);
    }
  });

  it('lehnt ungültige PLZ, Farbe, E-Mail und Anmelde-Link ab', () => {
    expect(parseOnboarding(form({ plz: '764370' })).ok).toBe(false);
    expect(parseOnboarding(form({ wunschfarbe: 'red;}' })).ok).toBe(false);
    expect(parseOnboarding(form({ email: 'a@b.de,x@y.de' })).ok).toBe(false);
    expect(parseOnboarding(form({ anmelde_link: 'javascript:alert(1)' })).ok).toBe(false);
  });
});

describe('toKundeYaml', () => {
  it('erzeugt valides YAML auch bei Sonderzeichen und markiert Änderungen', () => {
    const r = parseOnboarding(form({ fahrschule_name: 'Fahrschule: "#1"', preise: 'B: 450 €\n- A: 500 €' }));
    if (!r.ok) throw new Error(r.errors.join());
    const y = parse(toKundeYaml(r.data, '2026-10-09', true));
    expect(y.fahrschule.name).toBe('Fahrschule: "#1"');
    expect(y.preise).toBe('B: 450 €\n- A: 500 €');
    expect(y.klassen).toEqual(['B', 'BE']);
    expect(y.bestellung).toMatchObject({ stripe_session: SESSION, aenderung: true });
  });
});

describe('POST /api/fahrschule-onboarding', () => {
  const submit = async (fd = form()) => {
    const { POST } = await import('../../src/pages/api/fahrschule-onboarding');
    const request = new Request('https://lkmedia.net/api/fahrschule-onboarding', { method: 'POST', body: fd });
    return POST({ request } as Parameters<APIRoute>[0]);
  };

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    sendMail.mockReset().mockResolvedValue(undefined);
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_mock');
    checkPaidSession.mockReset().mockResolvedValue({ paid: true, email: 'kaeufer@example.test' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('nimmt Angaben an und erlaubt spätere Änderungen mit Änderungs-Link', async () => {
    const first = await submit();
    expect(first.status).toBe(303);
    expect(first.headers.get('location')).toBe('/fahrschule-webdesign/danke');
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: 'lucas@lkmedia.net', subject: 'fahrschulweb Onboarding: Fahrschule Muster' });
    const confirmation = sendMail.mock.calls[1][0];
    expect(confirmation.to).toBe('kaeufer@example.test');
    expect(confirmation.text).toContain(`https://lkmedia.net/fahrschule-webdesign/onboarding?session_id=${SESSION}`);

    // Doppelklick → gebremst, keine weitere Mail.
    expect((await submit()).status).toBe(429);
    expect(sendMail).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(61_000);
    expect((await submit(form({ theorie: 'Mo 18 Uhr' }))).status).toBe(303);
    const change = sendMail.mock.calls[2][0];
    expect(change.subject).toBe('fahrschulweb Änderung: Fahrschule Muster');
    expect(parse(change.attachments[0].content.toString('utf8'))).toMatchObject({
      theorie: 'Mo 18 Uhr',
      bestellung: { aenderung: true },
    });
  });

  it('verschickt nichts zu einer unbezahlten Bestellung', async () => {
    checkPaidSession.mockResolvedValueOnce({ paid: false });
    expect((await submit()).status).toBe(403);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('leitet bei Formfehlern mit Meldung zurück zum Onboarding', async () => {
    const r = await submit(form({ plz: 'x' }));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toMatch(/^\/fahrschule-webdesign\/onboarding\?session_id=cs_test_fahrschule123&fehler=/);
  });

  it('meldet 502, wenn die Betreiber-Mail scheitert, und lässt erneutes Senden zu', async () => {
    sendMail.mockRejectedValueOnce(new Error('smtp down'));
    expect((await submit()).status).toBe(502);
    expect((await submit()).status).toBe(303);
  });
});
