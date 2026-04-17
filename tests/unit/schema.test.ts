import { describe, it, expect } from 'vitest';
import { blogPosting, faqPage, breadcrumbs, organization } from '../../src/lib/schema';

describe('schema helpers', () => {
  it('organization has required fields', () => {
    const o = organization();
    expect(o['@type']).toBe('Organization');
    expect(o.url).toBe('https://lkmedia.net');
  });
  it('blogPosting serializes dates', () => {
    const p = blogPosting({
      title: 't',
      description: 'd',
      pubDate: new Date('2026-01-01'),
      author: 'A',
      url: 'https://x/y',
    });
    expect(p.datePublished).toBe('2026-01-01T00:00:00.000Z');
    expect(p.dateModified).toBe('2026-01-01T00:00:00.000Z');
  });
  it('faqPage maps questions', () => {
    const f = faqPage([{ q: 'Q', a: 'A' }]);
    expect(f.mainEntity).toHaveLength(1);
    expect(f.mainEntity[0].name).toBe('Q');
  });
  it('breadcrumbs adds positions', () => {
    const b = breadcrumbs([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
    ]);
    expect(b.itemListElement[1].position).toBe(2);
  });
});
