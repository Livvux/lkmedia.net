import type { APIRoute } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { DOCWEB } from '../../src/lib/docweb';

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMail };
  },
}));

const SESSION_ID = 'cs_test_onboarding123';
const PRACTICE_NAME = 'Praxis Dr. Beispiel';
const PRACTICE_EMAIL = 'praxis@example.test';
const BUYER_EMAIL = 'buyer@example.test';
const SENT = { data: { id: 'mail_test_123' }, error: null };
const PROVIDER_ERROR = {
  name: 'validation_error',
  message: `Rejected ${PRACTICE_EMAIL} for ${SESSION_ID}`,
};

function stripeResponse(email: string | undefined = BUYER_EMAIL, paid = true): Response {
  return new Response(JSON.stringify({
    payment_status: paid ? 'paid' : 'unpaid',
    payment_link: DOCWEB.paymentLinkId,
    customer_details: { email },
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

function failNextMail(mode: 'response' | 'throw'): void {
  if (mode === 'response') {
    sendMail.mockResolvedValueOnce({ data: null, error: PROVIDER_ERROR });
  } else {
    sendMail.mockRejectedValueOnce(new Error(PROVIDER_ERROR.message));
  }
}

beforeEach(() => {
  vi.resetModules();
  sendMail.mockReset().mockResolvedValue(SENT);
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_onboarding_mock');
  vi.stubEnv('RESEND_API_KEY', 're_onboarding_mock');
  vi.stubGlobal('fetch', vi.fn(async () => stripeResponse()));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Provider errors may contain submitted data; neither errors nor payloads belong in logs.
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
  it('lehnt fehlende Mailkonfiguration mit 503 ab und erlaubt einen späteren Versuch', async () => {
    vi.stubEnv('RESEND_API_KEY', undefined);

    const failed = await submit();

    expect(failed.status).toBe(503);
    expect(failed.headers.get('location')).toBeNull();
    expect(await failed.text()).toContain('lucas@lkmedia.net');
    expect(sendMail).not.toHaveBeenCalled();

    vi.stubEnv('RESEND_API_KEY', 're_onboarding_mock');
    expect((await submit()).status).toBe(303);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it.each(['response', 'throw'] as const)(
    'antwortet bei Hauptmail-Fehler (%s) mit 502 und erlaubt erneutes Senden',
    async (mode) => {
      failNextMail(mode);

      const failed = await submit();

      expect(failed.status).toBe(502);
      expect(failed.headers.get('location')).toBeNull();
      expect(await failed.text()).toContain('lucas@lkmedia.net');
      expect(sendMail).toHaveBeenCalledTimes(1);

      expect((await submit()).status).toBe(303);
      expect(sendMail).toHaveBeenCalledTimes(3);
    },
  );

  it('sendet YAML und Bestätigung mit echten Zeilenumbrüchen und sperrt bereits erhaltene Angaben', async () => {
    const result = await submit();

    expect(result.status).toBe(303);
    expect(result.headers.get('location')).toBe('https://lkmedia.net/docweb/danke');
    expect(sendMail).toHaveBeenCalledTimes(2);
    const operator = sendMail.mock.calls[0][0];
    const confirmation = sendMail.mock.calls[1][0];
    expect(operator).toMatchObject({
      to: 'lucas@lkmedia.net',
      replyTo: PRACTICE_EMAIL,
      attachments: [{ filename: 'kunde.yaml' }],
    });
    expect(parse(operator.attachments[0].content.toString('utf8'))).toMatchObject({
      bestellung: { stripe_session: SESSION_ID },
      praxis: { name: PRACTICE_NAME, email: PRACTICE_EMAIL },
      leistungen: expect.stringMatching(/^Vorsorge\r?\nImpfungen$/),
    });
    expect(operator.text).toContain(`Praxis: ${PRACTICE_NAME}\nKäufer (Stripe): ${BUYER_EMAIL}`);
    expect(operator.text).not.toContain('\\n');
    expect(confirmation).toMatchObject({ to: BUYER_EMAIL, replyTo: 'lucas@lkmedia.net' });
    expect(confirmation.text).toContain('Guten Tag,\n\n');
    expect(confirmation.text).toContain('Sobald Ihre Angaben und die benötigten Bilder vollständig vorliegen');
    expect(confirmation.text).toContain(DOCWEB.deliveryPromise);
    expect(confirmation.text).not.toContain('\\n');

    expect((await submit()).status).toBe(409);
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it.each(['response', 'throw'] as const)(
    'behält bei Bestätigungsfehler (%s) den Erfolg der Betreiber-Mail und die Deduplizierung',
    async (mode) => {
      sendMail.mockResolvedValueOnce(SENT);
      failNextMail(mode);

      const result = await submit();

      expect(result.status).toBe(303);
      expect(result.headers.get('location')).toBe('https://lkmedia.net/docweb/danke');
      expect(sendMail).toHaveBeenCalledTimes(2);
      expect((await submit()).status).toBe(409);
      expect(sendMail).toHaveBeenCalledTimes(2);
    },
  );

  it('sendet ohne Käufer-Adresse keine Bestätigung an die Formular-Adresse', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      payment_status: 'paid',
      payment_link: DOCWEB.paymentLinkId,
      customer_details: {},
    }), { status: 200 }));

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
  });
});
