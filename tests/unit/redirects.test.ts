import { describe, expect, it } from 'vitest';
import { exactRedirects } from '../../src/lib/redirects';

describe('exactRedirects', () => {
  it('leitet /impressum auf /imprint, mit und ohne Slash', () => {
    expect(exactRedirects['/impressum']).toBe('/imprint');
    expect(exactRedirects['/impressum/']).toBe('/imprint');
  });
});
