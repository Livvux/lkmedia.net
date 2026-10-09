import { describe, expect, it } from 'vitest';
import { parseAnmeldung } from '../../src/lib/fahrschule-forms';

const NOW = new Date('2026-10-09T12:00:00Z');
function form(o: Record<string, string> = {}): FormData {
  const f = new FormData();
  const v = {
    vorname: 'Anna', nachname: 'Muster', geburtsdatum: '2000-05-01', klasse: 'B',
    standort: 'Rastatt', telefon: '0722212345', email: 'anna@kunde.de', nachricht: 'Hallo',
    einwilligung: 'ja', ...o,
  };
  for (const [k, x] of Object.entries(v)) if (x !== '') f.append(k, x);
  return f;
}
const grund = async (o: Record<string, string>) => {
  const r = await parseAnmeldung(form(o), NOW);
  return r.ok ? 'ok' : r.grund;
};

describe('parseAnmeldung', () => {
  it('baut Betreff, Text und replyTo', async () => {
    const r = await parseAnmeldung(form(), NOW);
    if (!r.ok) throw new Error('nicht ok');
    expect(r.mail.subject).toBe('Neue Anmeldung: Anna Muster, Klasse B, Rastatt');
    expect(r.mail.replyTo).toBe('anna@kunde.de');
    expect(r.mail.text).toContain('Geburtsdatum: 01.05.2000');
    expect(r.mail.text).toContain('Nachricht:\nHallo');
    expect(r.mail.text).toContain('Bitte melden Sie sich innerhalb von zwei Werktagen.');
  });
  it('weder Telefon noch E-Mail → pflichtfelder', async () =>
    expect(await grund({ telefon: '', email: '' })).toBe('pflichtfelder'));
  it('nur Telefon reicht, ohne replyTo', async () => {
    const r = await parseAnmeldung(form({ email: '' }), NOW);
    expect(r.ok && r.mail.replyTo).toBeUndefined();
  });
  it('ohne Einwilligung → pflichtfelder', async () =>
    expect(await grund({ einwilligung: '' })).toBe('pflichtfelder'));
  it('Klasse X → auswahl', async () => expect(await grund({ klasse: 'X' })).toBe('auswahl'));
  it('kaputte E-Mail → email', async () => expect(await grund({ email: 'a@b' })).toBe('email'));
  it('13 Jahre → alter, 14 Jahre am Geburtstag ok', async () => {
    expect(await grund({ geburtsdatum: '2013-10-09' })).toBe('alter');
    expect(await grund({ geburtsdatum: '2012-10-09' })).toBe('ok');
    expect(await grund({ geburtsdatum: '2012-10-10' })).toBe('alter');
  });
  it('über 99 → alter', async () => expect(await grund({ geburtsdatum: '1926-10-09' })).toBe('alter'));
  it('Berliner Datum: 23:30 UTC ist schon der nächste Tag', async () => {
    const r = await parseAnmeldung(form({ geburtsdatum: '2012-10-10' }), new Date('2026-10-09T23:30:00Z'));
    expect(r.ok).toBe(true);
  });
  it('2026-02-30 und Müll → alter', async () => {
    expect(await grund({ geburtsdatum: '2000-02-30' })).toBe('alter');
    expect(await grund({ geburtsdatum: '01.05.2000' })).toBe('alter');
  });
  it('CR/LF in einzeiligen Feldern wird entfernt', async () => {
    const r = await parseAnmeldung(form({ vorname: 'Anna\r\nBcc: x@evil.de' }), NOW);
    if (!r.ok) throw new Error('nicht ok');
    expect(r.mail.subject).not.toMatch(/[\r\n]/);
  });
});
