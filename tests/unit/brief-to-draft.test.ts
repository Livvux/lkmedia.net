import { describe, expect, it } from 'vitest';
import {
  buildDraft,
  clean,
  defaultBrief,
  META_MAX,
} from '../../src/components/showcase/brief-to-draft';

describe('buildDraft', () => {
  it('inserts the brief into every part of the draft (de)', () => {
    const draft = buildDraft(defaultBrief('de'), 'de');
    expect(draft.h1).toContain('Förderung für Wärmepumpen im Bestand');
    expect(draft.outline).toHaveLength(4);
    expect(draft.outline[0]).toBe('Passende Förderprogramme');
    expect(draft.intro).toContain('Eigentümer von Einfamilienhäusern');
    expect(draft.questions.some((q) => q.includes('Ablauf vom Antrag'))).toBe(true);
  });

  it('is deterministic, so server and client render the same example', () => {
    expect(buildDraft(defaultBrief('en'), 'en')).toEqual(buildDraft(defaultBrief('en'), 'en'));
  });

  it('falls back to placeholders for empty inputs', () => {
    const draft = buildDraft(
      { topic: '  ', audience: '', tone: 'factual', points: ['', ' ', ''] },
      'en',
    );
    expect(draft.h1).toBe('[Topic]: a guide for [Audience]');
    expect(draft.outline.slice(0, 3)).toEqual(['[Key point 1]', '[Key point 2]', '[Key point 3]']);
  });

  it('keeps the meta description within 160 characters', () => {
    const long = 'Wort '.repeat(40);
    const draft = buildDraft(
      { topic: long, audience: long, tone: 'expert', points: [long, long, long] },
      'de',
    );
    expect(draft.meta.length).toBeLessThanOrEqual(META_MAX);
    expect(draft.meta.endsWith('…')).toBe(true);
  });

  it('treats markup as plain text and caps length', () => {
    expect(clean('<b>x</b>\n\n  y', 100)).toBe('<b>x</b> y');
    expect(clean('a'.repeat(200), 10)).toHaveLength(10);
  });
});
