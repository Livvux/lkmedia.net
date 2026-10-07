import { describe, expect, it } from 'vitest';
import { isBlockedCrossSitePost } from '../../src/lib/csrf';

const base = {
  method: 'POST',
  contentType: 'application/x-www-form-urlencoded',
  origin: 'https://evil.example',
  selfOrigin: 'https://lkmedia.net',
  path: '/api/contact',
};

describe('isBlockedCrossSitePost', () => {
  it('blockt fremde Form-POSTs', () => expect(isBlockedCrossSitePost(base)).toBe(true));
  it('blockt fremde multipart-POSTs', () =>
    expect(isBlockedCrossSitePost({ ...base, contentType: 'multipart/form-data; boundary=x' })).toBe(true));
  it('blockt POST ohne Origin', () => expect(isBlockedCrossSitePost({ ...base, origin: null })).toBe(true));
  it('erlaubt same-origin', () =>
    expect(isBlockedCrossSitePost({ ...base, origin: 'https://lkmedia.net' })).toBe(false));
  it('erlaubt GET', () => expect(isBlockedCrossSitePost({ ...base, method: 'GET' })).toBe(false));
  it('erlaubt JSON (kein Formular, CORS greift)', () =>
    expect(isBlockedCrossSitePost({ ...base, contentType: 'application/json' })).toBe(false));
  it('lässt /api/handwerk/ durch (prüft Origins selbst)', () =>
    expect(isBlockedCrossSitePost({ ...base, path: '/api/handwerk/demo/anfrage' })).toBe(false));
});
