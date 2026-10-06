import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { DOCWEB, checkSession, parseOnboarding, toKundeYaml } from '../../src/lib/docweb';

function form(overrides: Record<string, string | string[]> = {}): FormData {
  const base: Record<string, string | string[]> = {
    session_id: 'cs_live_a1B2c3',
    praxis_name: 'Praxis Dr. Test',
    fachrichtung: 'Allgemeinmedizin',
    typ: 'arzt',
    telefon: '+49 721 123456',
    email: 'praxis@test.de',
    booking_type: 'phone',
    strasse: 'Hauptstraße 1',
    plz: '76437',
    ort: 'Rastatt',
    oeffnungszeiten: 'Mo–Fr 8–12 Uhr',
    team: 'Dr. Test, Facharzt für Allgemeinmedizin',
    leistungen: 'Vorsorge\nImpfungen',
    kammer: 'Landesärztekammer Baden-Württemberg',
    berufsbezeichnung: 'Arzt (Deutschland)',
    kassen: ['gesetzlich', 'privat'],
    ...overrides,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

describe('parseOnboarding', () => {
  it('akzeptiert ein vollständiges Formular', () => {
    const r = parseOnboarding(form());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.praxis.kassen).toEqual(['gesetzlich', 'privat']);
  });

  it('meldet fehlende Pflichtfelder', () => {
    const r = parseOnboarding(form({ praxis_name: '', plz: '' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/Praxisname.*PLZ|PLZ.*Praxisname/);
  });

  it('verlangt eine URL bei Online-Buchung', () => {
    const r = parseOnboarding(form({ booking_type: 'doctolib', booking_url: '' }));
    expect(r.ok).toBe(false);
  });

  it('lehnt Mehrfach-Adressen in der E-Mail ab', () => {
    expect(parseOnboarding(form({ email: 'a@b.de,x@y.de' })).ok).toBe(false);
  });

  it('lehnt ungültige Typen und Farben ab', () => {
    expect(parseOnboarding(form({ typ: 'heiler' })).ok).toBe(false);
    expect(parseOnboarding(form({ wunschfarbe: 'red;}' })).ok).toBe(false);
  });

  it('kürzt überlange Eingaben', () => {
    const r = parseOnboarding(form({ leistungen: 'x'.repeat(20000) }));
    expect(r.ok && r.data.leistungen.length).toBe(5000);
  });
});

describe('toKundeYaml', () => {
  it('erzeugt valides YAML auch bei Sonderzeichen', () => {
    const r = parseOnboarding(
      form({
        praxis_name: 'Praxis: "Dr. #1" – Köln',
        leistungen: 'a: b\n- c\n# d\n{e}',
        hinweise: "'quote' & @at",
      }),
    );
    if (!r.ok) throw new Error(r.errors.join());
    const parsed = parse(toKundeYaml(r.data, '2026-10-06'));
    expect(parsed.praxis.name).toBe('Praxis: "Dr. #1" – Köln');
    expect(parsed.leistungen).toBe('a: b\n- c\n# d\n{e}');
    expect(parsed.hinweise).toBe("'quote' & @at");
    expect(parsed.bestellung.stripe_session).toBe('cs_live_a1B2c3');
    expect(parsed.standorte[0].plz).toBe('76437');
  });
});

describe('checkSession', () => {
  const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));

  it('bezahlte Session → paid + E-Mail', async () => {
    const f = ok({ payment_status: 'paid', payment_link: DOCWEB.paymentLinkId, customer_details: { email: 'a@b.de' } });
    expect(await checkSession('cs_live_abc', 'sk', f)).toEqual({ paid: true, email: 'a@b.de' });
    expect(f).toHaveBeenCalledWith('https://api.stripe.com/v1/checkout/sessions/cs_live_abc', expect.anything());
  });

  it('bezahlte Session eines anderen Produkts → nicht paid', async () => {
    const f = ok({ payment_status: 'paid', payment_link: 'plink_other' });
    expect((await checkSession('cs_live_abc', 'sk', f)).paid).toBe(false);
  });

  it('unbezahlte Session → nicht paid', async () => {
    expect((await checkSession('cs_live_abc', 'sk', ok({ payment_status: 'unpaid' }))).paid).toBe(false);
  });

  it('ungültige ID → kein Request, nicht paid', async () => {
    const f = ok({});
    expect((await checkSession('../../v1/customers', 'sk', f)).paid).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it('Stripe-Fehler → nicht paid', async () => {
    const f = vi.fn(async () => new Response('{}', { status: 404 }));
    expect((await checkSession('cs_live_abc', 'sk', f)).paid).toBe(false);
  });
});
