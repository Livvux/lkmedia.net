import { describe, expect, it } from 'vitest';
import { clientIp } from '../../src/lib/client-ip';

const req = (h: Record<string, string>) => new Request('https://x.test', { headers: h });

describe('clientIp', () => {
  it('cf-connecting-ip hat Vorrang', () =>
    expect(clientIp(req({ 'cf-connecting-ip': ' 1.2.3.4 ', 'x-forwarded-for': '9.9.9.9, 172.70.0.1' }), 'fb')).toBe('1.2.3.4'));
  it('sonst letzter X-Forwarded-For-Eintrag', () =>
    expect(clientIp(req({ 'x-forwarded-for': '6.6.6.6, 5.5.5.5' }), 'fb')).toBe('5.5.5.5'));
  it('sonst Fallback', () => expect(clientIp(req({}), 'fb')).toBe('fb'));
});
