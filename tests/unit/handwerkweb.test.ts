import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { HANDWERKWEB, parseOnboarding, toKundeYaml } from '../../src/lib/handwerkweb';
import { checkPaidSession } from '../../src/lib/stripe';

function form(o: Record<string, string | string[]> = {}): FormData {
  const base: Record<string, string | string[]> = {
    session_id: 'cs_live_a1B2c3',
    betrieb_name: 'Muster Haustechnik GmbH',
    gewerke: ['shk'],
    meisterbetrieb: 'ja',
    telefon: '07222 12345',
    email: 'info@betrieb.de',
    strasse: 'Hauptstraße 1',
    plz: '76437',
    ort: 'Rastatt',
    oeffnungszeiten: 'Mo–Fr 7–16 Uhr',
    einsatzgebiet: 'Rastatt, Baden-Baden, Gaggenau (ca. 30 km)',
    leistungen: 'Heizungstausch\nBadsanierung',
    inhaber: 'Max Meister',
    handwerkskammer: 'Handwerkskammer Karlsruhe',
    ...o,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

describe('parseOnboarding', () => {
  it('akzeptiert ein vollständiges Formular', () => {
    const r = parseOnboarding(form({ gewerke: ['shk', 'elektro', 'hack'] }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.betrieb.gewerke).toEqual(['shk', 'elektro']);
  });
  it('splittet kommagetrennte Gewerke (Radio "Beides")', () => {
    const r = parseOnboarding(form({ gewerke: 'shk,elektro' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.betrieb.gewerke).toEqual(['shk', 'elektro']);
  });
  it('lehnt zu lange PLZ und Wunschfarbe ab (kein Abschneiden)', () => {
    const a = parseOnboarding(form({ plz: '761234' }));
    expect(!a.ok && a.errors.join()).toMatch(/PLZ/);
    const b = parseOnboarding(form({ wunschfarbe: '#1234567890' }));
    expect(!b.ok && b.errors.join()).toMatch(/Wunschfarbe/);
  });
  it('verlangt mindestens ein Gewerk', () => {
    const r = parseOnboarding(form({ gewerke: [] }));
    expect(!r.ok && r.errors.join()).toMatch(/Gewerk/);
  });
  it('meldet fehlende Pflichtfelder', () => {
    const r = parseOnboarding(form({ betrieb_name: '', handwerkskammer: '' }));
    expect(!r.ok && r.errors.join(' ')).toMatch(/Betriebsname/);
    expect(!r.ok && r.errors.join(' ')).toMatch(/Handwerkskammer/);
  });
  it('prüft session_id, PLZ, E-Mail, Farbe', () => {
    const r = parseOnboarding(form({ session_id: 'x', plz: '123', email: 'a', wunschfarbe: 'rot' }));
    expect(!r.ok && r.errors.length).toBe(4);
  });
});

describe('toKundeYaml', () => {
  it('erzeugt gültiges YAML auch mit Sonderzeichen', () => {
    const r = parseOnboarding(form({ hinweise: 'Achtung: "#1"\nzweite Zeile' }));
    if (!r.ok) throw new Error(r.errors.join());
    const y = parse(toKundeYaml(r.data, { datum: '2026-10-07', sessionHash: 'abc123def456' }));
    expect(y.betrieb.name).toBe('Muster Haustechnik GmbH');
    expect(y.betrieb.gewerke).toEqual(['shk']);
    expect(y.betrieb.meisterbetrieb).toBe(true);
    expect(y.hinweise).toBe('Achtung: "#1"\nzweite Zeile');
    expect(y.bestellung.datum).toBe('2026-10-07');
  });
});

describe('checkPaidSession', () => {
  const ok = (body: object) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  it('bezahlt über den richtigen Link', async () => {
    const f = ok({ payment_status: 'paid', payment_link: 'plink_x', customer_details: { email: 'k@b.de' } });
    expect(await checkPaidSession('cs_test_abc', 'sk', 'plink_x', f)).toEqual({ paid: true, email: 'k@b.de' });
  });
  it('anderer Link zählt nicht', async () => {
    const f = ok({ payment_status: 'paid', payment_link: 'plink_other' });
    expect((await checkPaidSession('cs_test_abc', 'sk', 'plink_x', f)).paid).toBe(false);
  });
  it('leere Link-ID (noch nicht eingerichtet) ist nie bezahlt, ohne Request', async () => {
    const f = ok({ payment_status: 'paid', payment_link: '' });
    expect((await checkPaidSession('cs_test_abc', 'sk', '', f)).paid).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('toKundeYaml ohne Session-ID', () => {
  it('YAML enthält die Session-ID nicht, nur den Hash', () => {
    const r = parseOnboarding(form());
    if (!r.ok) throw new Error(r.errors.join());
    const yaml = toKundeYaml(r.data, { datum: '2026-10-09', sessionHash: 'abc123def456' });
    expect(yaml).not.toContain('cs_live_a1B2c3');
    expect(yaml).toContain('stripe_session_hash: "abc123def456"');
  });
});

describe('HANDWERKWEB Payment Link', () => {
  it('ist eingetragen', () => {
    expect(HANDWERKWEB.paymentLinkId).toMatch(/^plink_/);
    expect(HANDWERKWEB.paymentLink.startsWith('https://buy.stripe.com/')).toBe(true);
  });
});
