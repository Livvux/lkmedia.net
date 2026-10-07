import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_BYTES, isBot, parseAnfrage, parseBewerbung } from '../../src/lib/handwerk-forms';

type Val = string | File | (string | File)[];
function fd(fields: Record<string, Val>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
  return f;
}
const img = (name = 'bad.jpg', size = 10, type = 'image/jpeg') => new File([new Uint8Array(size)], name, { type });
const emptyFile = () => new File([], '', { type: 'application/octet-stream' });

const anfrage = (o: Record<string, Val> = {}) =>
  fd({
    anliegen: 'Heizungstausch',
    plz: '76437',
    ort: 'Rastatt',
    objektart: 'Einfamilienhaus',
    zeitrahmen: 'In 1–3 Monaten',
    beschreibung: 'Gasheizung von 1998, soll raus.',
    name: 'Max Kunde',
    telefon: '07222 12345',
    email: 'max@kunde.de',
    fotos: emptyFile(),
    ...o,
  });

describe('parseAnfrage', () => {
  it('akzeptiert eine vollständige Anfrage', async () => {
    const r = await parseAnfrage(anfrage(), ['764']);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mail.subject).toBe('Anfrage: Heizungstausch · 76437 Rastatt · Max Kunde');
    expect(r.mail.replyTo).toBe('max@kunde.de');
    expect(r.mail.text).toContain('Gasheizung von 1998');
    expect(r.mail.attachments).toEqual([]); // leerer File-Input zählt nicht
  });
  it('markiert PLZ außerhalb des Einsatzgebiets', async () => {
    const r = await parseAnfrage(anfrage({ plz: '10115', ort: 'Berlin' }), ['764']);
    expect(r.ok && r.mail.subject.startsWith('[außerhalb Einsatzgebiet] ')).toBe(true);
  });
  it('ohne Präfixe gilt alles als Einsatzgebiet', async () => {
    const r = await parseAnfrage(anfrage({ plz: '10115' }), []);
    expect(r.ok && !r.mail.subject.includes('außerhalb')).toBe(true);
  });
  it('Pflichtfelder', async () =>
    expect(await parseAnfrage(anfrage({ telefon: '' }), [])).toEqual({ ok: false, grund: 'pflichtfelder' }));
  it('PLZ fünfstellig', async () =>
    expect(await parseAnfrage(anfrage({ plz: '7643' }), [])).toEqual({ ok: false, grund: 'plz' }));
  it('E-Mail', async () =>
    expect(await parseAnfrage(anfrage({ email: 'kaputt' }), [])).toEqual({ ok: false, grund: 'email' }));
  it('Anliegen nur aus der Liste', async () =>
    expect(await parseAnfrage(anfrage({ anliegen: 'Hack' }), [])).toEqual({ ok: false, grund: 'auswahl' }));
  it('nimmt Fotos als Anhang', async () => {
    const r = await parseAnfrage(anfrage({ fotos: [img('a.jpg'), img('b.png', 5, 'image/png')] }), []);
    expect(r.ok && r.mail.attachments.map((a) => a.filename)).toEqual(['a.jpg', 'b.png']);
  });
  it('lehnt PDF bei Fotos ab', async () =>
    expect(await parseAnfrage(anfrage({ fotos: img('x.pdf', 5, 'application/pdf') }), [])).toEqual({ ok: false, grund: 'dateien' }));
  it('max. 5 Dateien', async () =>
    expect(await parseAnfrage(anfrage({ fotos: Array.from({ length: 6 }, () => img()) }), [])).toEqual({ ok: false, grund: 'dateien' }));
  it('max. Gesamtgröße', async () =>
    expect(await parseAnfrage(anfrage({ fotos: img('big.jpg', MAX_TOTAL_BYTES + 1) }), [])).toEqual({ ok: false, grund: 'dateien' }));
  it('Zeilenumbrüche aus dem Betreff entfernen', async () => {
    const r = await parseAnfrage(anfrage({ name: 'Max\r\nBcc: x@y.de' }), []);
    expect(r.ok && r.mail.subject).not.toMatch(/[\r\n]/);
  });
  it('Dateinamen entschärfen', async () => {
    const r = await parseAnfrage(anfrage({ fotos: img('../../etc/pass wd.jpg') }), []);
    expect(r.ok && r.mail.attachments[0].filename).toBe('.._.._etc_pass wd.jpg');
  });
});

describe('parseBewerbung', () => {
  const bew = (o: Record<string, Val> = {}) =>
    fd({ stelle: 'Anlagenmechaniker SHK (m/w/d)', name: 'Lea Geselle', telefon: '0171 1234567', erfahrung: 'Geselle/Gesellin', fuehrerschein: 'ja', ...o });
  it('akzeptiert Kurzbewerbung ohne E-Mail und Lebenslauf', async () => {
    const r = await parseBewerbung(bew({ lebenslauf: emptyFile() }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mail.subject).toBe('Bewerbung: Anlagenmechaniker SHK (m/w/d) · Lea Geselle');
    expect(r.mail.replyTo).toBeUndefined();
    expect(r.mail.text).toContain('Führerschein Klasse B: ja');
  });
  it('nimmt PDF-Lebenslauf', async () => {
    const r = await parseBewerbung(bew({ lebenslauf: img('cv.pdf', 20, 'application/pdf') }));
    expect(r.ok && r.mail.attachments[0].contentType).toBe('application/pdf');
  });
  it('E-Mail optional, aber gültig wenn angegeben', async () =>
    expect(await parseBewerbung(bew({ email: 'nope' }))).toEqual({ ok: false, grund: 'email' }));
  it('Erfahrung nur aus der Liste', async () =>
    expect(await parseBewerbung(bew({ erfahrung: 'Chef' }))).toEqual({ ok: false, grund: 'auswahl' }));
  it('Pflichtfelder', async () =>
    expect(await parseBewerbung(bew({ name: '' }))).toEqual({ ok: false, grund: 'pflichtfelder' }));
});

describe('isBot', () => {
  it('Honeypot gefüllt', () => expect(isBot(fd({ website: 'x', dauer: '9000' }))).toBe(true));
  it('zu schnell abgeschickt', () => expect(isBot(fd({ dauer: '800' }))).toBe(true));
  it('ohne JS (kein dauer) ist kein Bot', () => expect(isBot(fd({}))).toBe(false));
  it('normal ausgefüllt', () => expect(isBot(fd({ dauer: '45000' }))).toBe(false));
});
