// Gemeinsamer Stripe-Check für Payment-Link-Produkte (docweb, handwerkweb, fahrschulweb).
import { DOCWEB } from "./docweb";
import { FAHRSCHULWEB } from "./fahrschulweb";
import { HANDWERKWEB } from "./handwerkweb";
import { PRODUKTE, type Produkt } from "./kunden-schema";

export const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;

/**
 * Prüft per Stripe-API, ob die Checkout-Session über genau diesen Payment Link bezahlt ist.
 * Unbekannte Session (400/404) → `paid: false`; Stripe-Ausfall (Netz, 5xx, falscher Key) → wirft.
 */
export async function checkPaidSession(
  id: string,
  secretKey: string,
  paymentLinkId: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ paid: boolean; email?: string }> {
  if (!paymentLinkId || !SESSION_ID.test(id)) return { paid: false };
  const r = await fetchFn(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (r.status === 400 || r.status === 404) return { paid: false };
  if (!r.ok) throw new Error(`Stripe ${r.status}`);
  const s = (await r.json()) as {
    payment_status?: string;
    payment_link?: string | null;
    customer_details?: { email?: string };
  };
  // Nur Käufe über diesen Link zählen, nicht andere Produkte im selben Stripe-Konto.
  const paid = s.payment_status === "paid" && s.payment_link === paymentLinkId;
  return { paid, email: s.customer_details?.email };
}

/**
 * Payment-Link-ID je Produkt (leer = noch nicht eingerichtet). Getter, weil die Produktmodule
 * ihrerseits stripe.ts importieren – so ist die Reihenfolge beim Laden egal.
 */
export const PAYMENT_LINKS: Record<Produkt, string> = {
  get docweb() {
    return DOCWEB.paymentLinkId;
  },
  get handwerkweb() {
    return HANDWERKWEB.paymentLinkId;
  },
  get fahrschulweb() {
    return FAHRSCHULWEB.paymentLinkId;
  },
};

/**
 * Eine Session-Abfrage für alle Produkte: bezahlt über einen unserer Payment Links?
 * Unbekannte Session → `paid: false`; Stripe-Ausfall (Netz, 5xx, falscher Key) → wirft.
 */
export async function checkAnySession(
  id: string,
  secretKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ paid: boolean; produkt?: Produkt; email?: string }> {
  if (!SESSION_ID.test(id)) return { paid: false };
  const r = await fetchFn(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (r.status === 400 || r.status === 404) return { paid: false };
  if (!r.ok) throw new Error(`Stripe ${r.status}`);
  const s = (await r.json()) as {
    payment_status?: string;
    payment_link?: string | null;
    customer_details?: { email?: string };
  };
  const produkt = PRODUKTE.find((p) => PAYMENT_LINKS[p] && PAYMENT_LINKS[p] === s.payment_link);
  if (!produkt || s.payment_status !== "paid") return { paid: false };
  return { paid: true, produkt, email: s.customer_details?.email };
}

/**
 * Bezahlte Sessions unserer Payment Links zu einer E-Mail-Adresse (Stripe-Filter `customer_details[email]`
 * von GET /v1/checkout/sessions; deckt auch Sessions ohne Customer-Objekt ab). Stripe-Ausfall → wirft.
 */
export async function findSessionsByEmail(
  email: string,
  secretKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ id: string; produkt: Produkt }[]> {
  const q = new URLSearchParams({
    "customer_details[email]": email,
    status: "complete",
    limit: "100",
  });
  const r = await fetchFn(`https://api.stripe.com/v1/checkout/sessions?${q}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`Stripe ${r.status}`);
  const { data = [] } = (await r.json()) as {
    data?: {
      id: string;
      payment_status?: string;
      payment_link?: string | null;
      customer_details?: { email?: string | null } | null;
    }[];
  };
  const gesucht = email.trim().toLowerCase();
  return data.flatMap((s) => {
    // Links sind Zugangsdaten: nicht allein auf Stripes Filter verlassen, Käuferadresse selbst prüfen.
    if (s.customer_details?.email?.trim().toLowerCase() !== gesucht) return [];
    const produkt = PRODUKTE.find((p) => PAYMENT_LINKS[p] && PAYMENT_LINKS[p] === s.payment_link);
    return produkt && s.payment_status === "paid" ? [{ id: s.id, produkt }] : [];
  });
}

/** Stripe-Kundenportal (Rechnungen, Zahlungsart, Kündigung). Leer → Portal-Hinweise entfallen. */
export const STRIPE_PORTAL_URL: string = "https://billing.stripe.com/p/login/5kAeXIct123hdcQ9AA";

/** Persönlicher Link der Kundschaft für Änderungen, Bilder und Status. */
export const aenderungUrl = (sessionId: string) =>
  `https://lkmedia.net/aenderung?session_id=${encodeURIComponent(sessionId)}`;
