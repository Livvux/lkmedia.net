import { describe, expect, it } from 'vitest';
import { allowedOrigins, findSite } from '../../src/lib/handwerk-sites';

describe('findSite', () => {
  it('findet die Demo', () => expect(findSite('demo')?.origins).toContain('https://handwerk.lkmedia.net'));
  it('unbekannt → undefined', () => expect(findSite('gibtsnicht')).toBeUndefined());
  it('Prototyp-Schlüssel treffen nicht', () => {
    expect(findSite('__proto__')).toBeUndefined();
    expect(findSite('constructor')).toBeUndefined();
    expect(findSite('toString')).toBeUndefined();
  });
});

describe('allowedOrigins', () => {
  it('ohne dev nur Register-Origins', () =>
    expect(allowedOrigins(findSite('demo')!, false)).toEqual(['https://handwerk.lkmedia.net']));
  it('mit dev zusätzlich localhost', () =>
    expect(allowedOrigins(findSite('demo')!, true)).toContain('http://localhost:4321'));
});
