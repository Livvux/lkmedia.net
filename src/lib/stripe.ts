// Gemeinsamer Stripe-Check für Payment-Link-Produkte (docweb, handwerkweb).
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
