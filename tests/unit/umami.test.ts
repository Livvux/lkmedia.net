import { describe, expect, it } from 'vitest';
import { conversionLink, publicUmamiPath, umamiPageAllowed, validUmamiWebsiteId } from '../../src/lib/umami';

const ID = '11111111-1111-4111-8111-111111111111';
const allowed = (url: string, expected = '/', privacy = {}) =>
  umamiPageAllowed(ID, expected, new URL(url), privacy);

describe('public Umami page ownership and privacy', () => {
  it('stays disabled until a real valid website ID is supplied', () => {
    for (const id of ['', 'unset', '00000000-0000-0000-0000-000000000000']) {
      expect(validUmamiWebsiteId(id)).toBe(false);
      expect(umamiPageAllowed(id, '/', new URL('https://lkmedia.net/'), {})).toBe(false);
    }
  });

  it('requires the displayed path to belong to the rendered public page', () => {
    expect(allowed('https://lkmedia.net/')).toBe(true);
    expect(allowed('https://www.lkmedia.net/blog/', '/blog')).toBe(true);
    expect(allowed('https://lkmedia.net/not-an-owned-page')).toBe(false);
    expect(allowed('https://lkmedia.net/blog/private-id', '/blog')).toBe(false);
    expect(allowed('https://lkmedia.net/?q=private-search#private-fragment')).toBe(true);
  });

  it.each(['localhost', 'preview.lkmedia.net', 'handwerk.lkmedia.net', 'client.example'])('excludes %s', (host) => {
    expect(allowed(`https://${host}/`)).toBe(false);
  });

  it.each(['http://lkmedia.net/', 'https://lkmedia.net:4321/', 'https://user:private@lkmedia.net/'])('excludes non-production origin %s', (url) => {
    expect(allowed(url)).toBe(false);
  });

  it.each([
    '/aenderung', '/aenderung/link', '/docweb/onboarding', '/docweb/danke',
    '/handwerk/onboarding', '/handwerk/danke', '/fahrschule-webdesign/onboarding',
    '/fahrschule-webdesign/danke', '/danke', '/admin', '/api/contact',
    '/checkout', '/account', '/token/private', '/session/private', '/link/private', '/%61enderung',
  ])('excludes sensitive route %s even with a matching canonical', (path) => {
    expect(publicUmamiPath(path)).toBeNull();
    expect(allowed(`https://lkmedia.net${path}`, path)).toBe(false);
  });

  it.each(['session_id', 'sessionId', 'TOKEN', 'access_token', 'accessToken', 'code', 'state', 'email', 'order', 'customer_id', 'next'])('excludes sensitive URL parameter %s before loading a script', (key) => {
    expect(allowed(`https://lkmedia.net/?${key}=PRIVATE`)).toBe(false);
  });

  it('honours DNT, legacy DNT and GPC', () => {
    expect(allowed('https://lkmedia.net/', '/', { doNotTrack: '1' })).toBe(false);
    expect(allowed('https://lkmedia.net/', '/', { msDoNotTrack: 'yes' })).toBe(false);
    expect(allowed('https://lkmedia.net/', '/', { globalPrivacyControl: true })).toBe(false);
    expect(umamiPageAllowed(ID, '/', new URL('https://lkmedia.net/'), {}, 1)).toBe(false);
    expect(umamiPageAllowed(ID, '/', new URL('https://lkmedia.net/'), { doNotTrack: '1' }, '0')).toBe(false);
    expect(allowed('https://lkmedia.net/#token=PRIVATE')).toBe(false);
  });

  it.each(['https://example.com/', '//example.com/', '/?q=PRIVATE', '/#PRIVATE', '/bad path', '/%invalid'])('rejects untrusted public-path config %s', (path) => {
    expect(publicUmamiPath(path)).toBeNull();
  });
});

describe('conversion destinations', () => {
  it('reports only fixed goal names and target labels', () => {
    expect(conversionLink('/kontakt?email=PRIVATE#PRIVATE', '/docweb')).toEqual({ name: 'contact_click', data: { target: 'form' } });
    expect(conversionLink('/kontakt#termin', '/')).toEqual({ name: 'contact_click', data: { target: 'appointment' } });
    expect(conversionLink('https://cal.com/lucas-lkmedia/15min?email=PRIVATE', '/kontakt')).toEqual({ name: 'contact_click', data: { target: 'appointment' } });
    expect(conversionLink('mailto:lucas@lkmedia.net?body=PRIVATE', '/')).toEqual({ name: 'contact_click', data: { target: 'email' } });
    expect(conversionLink('https://buy.stripe.com/fixture?prefilled_email=PRIVATE', '/handwerk')).toEqual({ name: 'checkout_click', data: { target: 'handwerkweb' } });
    expect(conversionLink('https://docweb.lkmedia.net/?session_id=PRIVATE', '/docweb')).toEqual({ name: 'demo_click', data: { target: 'docweb' } });
  });

  it.each([
    'https://other.example/kontakt', 'https://lkmedia.net.evil.example/kontakt',
    'javascript:alert(1)', 'https://user:secret@lkmedia.net/kontakt',
    'https://lkmedia.net:4321/kontakt', '/aenderung?session_id=PRIVATE',
    'mailto:other@example.test', 'https://docweb.lkmedia.net/private',
    'https://constructor/', 'https://__proto__/',
  ])('ignores unrelated or sensitive destination %s', (href) => {
    expect(conversionLink(href, '/docweb')).toBeNull();
  });

  it('does not label Stripe links on unrelated pages as a product checkout', () => {
    expect(conversionLink('https://buy.stripe.com/fixture', '/blog')).toBeNull();
  });
});
