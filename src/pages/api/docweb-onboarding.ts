import type { APIRoute } from "astro";
import { Resend } from "resend";
import { checkSession, parseOnboarding, toKundeYaml } from "../../lib/docweb";

export const prerender = false;

const TO = "lucas@lkmedia.net";
const FROM = "lkmedia.net <no-reply@lkmedia.net>";
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];

export const POST: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const form = await request.formData();
  if (form.get("website")) return new Response("ok", { status: 200 }); // honeypot

  const parsed = parseOnboarding(form);
  const sessionId = String(form.get("session_id") ?? "");
  if (!parsed.ok) {
    const back = new URL("/docweb/onboarding", origin);
    back.searchParams.set("session_id", sessionId);
    back.searchParams.set("fehler", parsed.errors.join(" · "));
    return Response.redirect(back.href, 303);
  }

  const stripeKey = env("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[docweb] STRIPE_SECRET_KEY unset – rejecting onboarding");
    return new Response(
      "Onboarding derzeit nicht verfügbar. Bitte schreiben Sie an lucas@lkmedia.net.",
      { status: 503 },
    );
  }
  const session = await checkSession(parsed.data.sessionId, stripeKey);
  if (!session.paid)
    return new Response("Bestellung nicht gefunden oder nicht bezahlt.", { status: 403 });

  const d = parsed.data;
  const yaml = toKundeYaml(d, new Date().toISOString().slice(0, 10));
  const resendKey = env("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("[docweb] RESEND_API_KEY unset – onboarding not mailed:\n", yaml);
  } else {
    const resend = new Resend(resendKey);
    const sent = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: d.praxis.email,
      subject: `docweb Onboarding: ${d.praxis.name}`,
      text: `Neues docweb-Onboarding.\n\nPraxis: ${d.praxis.name}\nKäufer (Stripe): ${session.email ?? "–"}\nSession: ${d.sessionId}\n\nkunde.yaml im Anhang → an den Agent geben (docweb/AGENTS.md).`,
      attachments: [{ filename: "kunde.yaml", content: Buffer.from(yaml, "utf8") }],
    });
    if (sent.error) {
      // Daten nicht verlieren: Payload loggen, Kunde bekommt trotzdem eine Fehlermeldung mit Kontakt.
      console.error("[docweb] Resend failed", sent.error, "\n", yaml);
      return new Response("Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.", {
        status: 502,
      });
    }
    const customer = session.email ?? d.praxis.email;
    await resend.emails
      .send({
        from: FROM,
        to: customer,
        replyTo: TO,
        subject: "Ihre docweb-Website: Angaben erhalten",
        text: `Guten Tag,\n\nvielen Dank – wir haben Ihre Angaben für ${d.praxis.name} erhalten.\n\nBitte antworten Sie auf diese Mail mit Ihrem Logo (SVG oder PNG) und, falls vorhanden, Fotos von Team und Praxisräumen.\n\nSie erhalten in der Regel innerhalb von 7 Werktagen einen Vorschau-Link.\n\nViele Grüße\nLucas Kleipödszus\nlkmedia`,
      })
      .catch((error: unknown) => console.error("[docweb] confirmation mail failed", error));
  }

  return Response.redirect(`${origin}/docweb/danke`, 303);
};
