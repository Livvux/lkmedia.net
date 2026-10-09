// Gemeinsamer Stripe-Check für Payment-Link-Produkte (docweb, handwerkweb, fahrschulweb).
import { DOCWEB } from "./docweb";
import { FAHRSCHULWEB } from "./fahrschulweb";
import { HANDWERKWEB } from "./handwerkweb";
import { PRODUKTE, type Produkt } from "./kunden-schema";

export const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;

/** Prüft per Stripe-API, ob die Checkout-Session über genau diesen Payment Link bezahlt ist. */
export async function checkPaidSession(
  id: string,
  secretKey: string,
  paymentLinkId: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ paid: boolean; email?: string }> {
  if (!paymentLinkId || !SESSION_ID.test(id)) return { paid: false };
  try {
    const r = await fetchFn(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!r.ok) return { paid: false };
    const s = (await r.json()) as {
      payment_status?: string;
      payment_link?: string | null;
      customer_details?: { email?: string };
    };
    // Nur Käufe über diesen Link zählen, nicht andere Produkte im selben Stripe-Konto.
    const paid = s.payment_status === "paid" && s.payment_link === paymentLinkId;
    return { paid, email: s.customer_details?.email };
  } catch (error) {
    console.error("[stripe] session check failed", error);
    return { paid: false };
  }
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

/** Stripe-Kundenportal (Rechnungen, Zahlungsart, Kündigung). Leer → Portal-Hinweise entfallen. */
export const STRIPE_PORTAL_URL: string = "";

/** Persönlicher Link der Kundschaft für Änderungen, Bilder und Status. */
export const aenderungUrl = (sessionId: string) =>
  `https://lkmedia.net/aenderung?session_id=${encodeURIComponent(sessionId)}`;
