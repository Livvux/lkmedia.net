import { describe, it, expect } from 'vitest';
import { getLangFromUrl, pathFor, useTranslations } from '../../src/lib/i18n';

describe('i18n', () => {
  it('detects en from /en/...', () => expect(getLangFromUrl(new URL('https://x.dev/en/leistungen'))).toBe('en'));
  it('detects de default', () => expect(getLangFromUrl(new URL('https://x.dev/leistungen'))).toBe('de'));
  it('builds path for lang', () => {
    expect(pathFor('leistungen', 'de')).toBe('/leistungen');
    expect(pathFor('leistungen', 'en')).toBe('/en/leistungen');
  });
  it('translates keys', () => {
    const t = useTranslations('de');
    expect(t('nav.services')).toBe('Leistungen');
  });
});
