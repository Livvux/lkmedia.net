import type { APIRoute } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { DOCWEB } from '../../src/lib/docweb';
import { KUNDEN_REPO, sessionHash } from '../../src/lib/pipeline';
import { aenderungUrl } from '../../src/lib/stripe';
import { createGitHubFake } from './helpers/github-fake';

const { sendMail, gh } = vi.hoisted(() => ({
  sendMail: vi.fn(),
  gh: { current: null as ReturnType<typeof createGitHubFake> | null },
}));
vi.mock('../../src/lib/mailer', () => ({ sendMail }));
vi.mock('../../src/lib/github', async (orig) => ({
  ...(await orig<typeof import('../../src/lib/github')>()),
  createGitHub: () => gh.current?.gh,
}));

const SESSION_ID = 'cs_test_onboarding123';
const PRACTICE_NAME = 'Praxis Dr. Beispiel';
const PRACTICE_EMAIL = 'praxis@example.test';
const BUYER_EMAIL = 'buyer@example.test';

function stripeResponse(email: string | null = BUYER_EMAIL, paid = true): Response {
  return new Response(JSON.stringify({
    payment_status: paid ? 'paid' : 'unpaid',
    payment_link: DOCWEB.paymentLinkId,
    customer_details: email ? { email } : {},
  }), { status: 200 });
}

function form(): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    session_id: SESSION_ID,
    praxis_name: PRACTICE_NAME,
    fachrichtung: 'Allgemeinmedizin',
    typ: 'arzt',
    telefon: '+49 721 123456',
    email: PRACTICE_EMAIL,
    booking_type: 'phone',
    strasse: 'Hauptstraße 1',
    plz: '76437',
    ort: 'Rastatt',
    oeffnungszeiten: 'Mo–Fr 8–12 Uhr',
    team: 'Dr. Beispiel, Facharzt für Allgemeinmedizin',
    leistungen: 'Vorsorge\nImpfungen',
    kammer: 'Landesärztekammer Baden-Württemberg',
    berufsbezeichnung: 'Arzt (Deutschland)',
  })) data.set(key, value);
  return data;
}

async function submit(): Promise<Response> {
  const { POST } = await import('../../src/pages/api/docweb-onboarding');
  const request = new Request('https://lkmedia.net/api/docweb-onboarding', {
    method: 'POST',
    body: form(),
  });
  return POST({ request } as Parameters<APIRoute>[0]);
}

beforeEach(() => {
  vi.resetModules();
  gh.current = createGitHubFake();
  sendMail.mockReset().mockResolvedValue(undefined);
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_onboarding_mock');
  vi.stubEnv('GITHUB_KUNDEN_TOKEN', 'ghp_test');
  vi.stubGlobal('fetch', vi.fn(async () => stripeResponse()));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Fehler können Formulardaten enthalten; weder Fehler noch Inhalte gehören ins Log.
  const logs = JSON.stringify([
    ...vi.mocked(console.error).mock.calls,
    ...vi.mocked(console.warn).mock.calls,
  ], (_key, value) => value instanceof Error ? value.message : value);
  try {
    for (const sensitive of [SESSION_ID, PRACTICE_NAME, PRACTICE_EMAIL, BUYER_EMAIL, 'Hauptstraße 1']) {
      expect(logs).not.toContain(sensitive);
    }
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
});

describe('POST /api/docweb-onboarding', () => {
  it('legt das Issue an, sendet YAML ohne Session-ID und bestätigt an die Käufer-Adresse', async () => {
    const result = await submit();

    expect(result.status).toBe(303);
    expect(result.headers.get('location')).toBe('/docweb/danke');
    expect(gh.current?.issues.get(KUNDEN_REPO)?.[0]).toMatchObject({
      title: `Neukunde docweb: ${PRACTICE_NAME}`,
      labels: ['neukunde', 'docweb'],
    });
    expect(sendMail).toHaveBeenCalledTimes(2);
    const [operator] = sendMail.mock.calls[0];
    const [confirmation] = sendMail.mock.calls[1];
    expect(operator).toMatchObject({
      to: 'lucas@lkmedia.net',
      replyTo: PRACTICE_EMAIL,
      subject: `docweb Onboarding: ${PRACTICE_NAME}`,
      attachments: [{ filename: 'kunde.yaml' }],
    });
    const yaml = operator.attachments[0].content.toString('utf8');
    expect(yaml).not.toContain(SESSION_ID);
    expect(parse(yaml)).toMatchObject({
      bestellung: { stripe_session_hash: await sessionHash(SESSION_ID) },
      praxis: { name: PRACTICE_NAME, email: PRACTICE_EMAIL },
      leistungen: expect.stringMatching(/^Vorsorge\r?\nImpfungen$/),
    });
    expect(operator.text).not.toContain('\\n');
    expect(confirmation).toMatchObject({ to: BUYER_EMAIL, replyTo: 'lucas@lkmedia.net' });
    expect(confirmation.text).toContain('Guten Tag,\n\n');
    expect(confirmation.text).toContain(DOCWEB.deliveryPromise);
    expect(confirmation.text).toContain(aenderungUrl(SESSION_ID));

    expect((await submit()).status).toBe(429);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it('meldet ohne Stripe-Key 503 mit Kontaktadresse', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    const failed = await submit();
    expect(failed.status).toBe(503);
    expect(await failed.text()).toContain('lucas@lkmedia.net');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sendet ohne Käufer-Adresse keine Bestätigung an die Formular-Adresse', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(stripeResponse(null));

    expect((await submit()).status).toBe(303);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe('lucas@lkmedia.net');
  });

  it('verschickt keine Angaben zu einer unbezahlten Bestellung', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(stripeResponse(BUYER_EMAIL, false));

    const result = await submit();

    expect(result.status).toBe(403);
    expect(result.headers.get('location')).toBeNull();
    expect(sendMail).not.toHaveBeenCalled();
    expect(gh.current?.commits).toHaveLength(0);
  });
});
