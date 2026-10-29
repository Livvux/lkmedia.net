import { describe, expect, it } from 'vitest';
import { leadSource } from '../../src/lib/lead-source';
import { buildSeo } from '../../src/lib/seo';
import { blogPosting, organization, professionalService } from '../../src/lib/schema';

describe('SEO metadata', () => {
  it('resolves article images and exposes publication metadata', () => {
    const seo = buildSeo({ title: 'Ratgeber', description: 'Beschreibung', canonical: '/blog/ratgeber/', lang: 'de', ogImage: '/posts/image.png', type: 'article', publishedTime: '2026-10-16T00:00:00.000Z' });
    expect(seo.ogImage).toBe('https://lkmedia.net/posts/image.png');
    expect(seo.canonical).toBe('https://lkmedia.net/blog/ratgeber/');
    expect(seo.type).toBe('article');
    expect(seo.publishedTime).toBe('2026-10-16T00:00:00.000Z');
  });
  it('appends the brand suffix only while the title stays within 60 characters', () => {
    const base = { description: 'Beschreibung', canonical: '/x', lang: 'de' as const };
    expect(buildSeo({ ...base, title: 'Kontakt' }).title).toBe('Kontakt · lkmedia');
    const long = 'A'.repeat(55);
    expect(buildSeo({ ...base, title: long }).title).toBe(long);
  });
  it('uses absolute images in BlogPosting data', () => {
    const data = blogPosting({ title: 'Ratgeber', description: 'Text', pubDate: new Date('2026-10-16'), author: 'Lucas Kleipoedszus', image: '/posts/image.png', url: 'https://lkmedia.net/blog/ratgeber/' });
    expect(data.image).toBe('https://lkmedia.net/posts/image.png');
    expect(data.publisher['@id']).toBe(organization()['@id']);
  });
  it('uses the published business identity consistently', () => {
    expect(professionalService().address).toEqual(organization().address);
    expect(professionalService().name).toBe(organization().name);
    expect(professionalService().address.addressLocality).toBe('Rastatt');
  });
});

describe('lead source privacy', () => {
  it('retains only known public landing paths', () => {
    expect(leadSource('/anwaelte/')).toBe('/anwaelte');
    expect(leadSource('/seo-rastatt/')).toBe('/seo-rastatt');
    expect(leadSource('/')).toBe('/');
    for (const value of ['/api/contact', '/anwaelte?email=private', 'https://lkmedia.net/anwaelte', '/aenderung/private', '/arbitrary-private-name']) {
      expect(leadSource(value)).toBe('/kontakt');
    }
  });
});
