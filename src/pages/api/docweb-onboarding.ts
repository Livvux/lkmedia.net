import type { APIRoute } from "astro";
import { Resend } from "resend";
import { checkSession, DOCWEB, parseOnboarding, toKundeYaml } from "../../lib/docweb";

export const prerender = false;

const TO = "lucas@lkmedia.net";
const FROM = "lkmedia.net <no-reply@lkmedia.net>";
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
// ponytail: In-Memory-Sperre gegen Mehrfach-Einsendung einer Session; nach Neustart leer.
// Bei Bedarf persistent machen (z. B. Stripe-Metadata der Session setzen).
const processed = new Set<string>();

export const POST: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Ungültige Anfrage.", { status: 400 });
  }
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
  const resendKey = env("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[docweb] RESEND_API_KEY unset – rejecting onboarding");
    return new Response(
      "Onboarding derzeit nicht verfügbar. Bitte schreiben Sie an lucas@lkmedia.net.",
      { status: 503 },
    );
  }
  const session = await checkSession(parsed.data.sessionId, stripeKey);
  if (!session.paid)
    return new Response("Bestellung nicht gefunden oder nicht bezahlt.", { status: 403 });
  if (processed.has(parsed.data.sessionId)) {
    return new Response(
      "Angaben zu dieser Bestellung wurden bereits übermittelt. Änderungen bitte per Mail an lucas@lkmedia.net.",
      { status: 409 },
    );
  }

  const d = parsed.data;
  const yaml = toKundeYaml(d, new Date().toISOString().slice(0, 10));
  let resend: Resend;
  try {
    resend = new Resend(resendKey);
    const sent = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: d.praxis.email,
      subject: `docweb Onboarding: ${d.praxis.name}`,
      text: `Neues docweb-Onboarding.\n\nPraxis: ${d.praxis.name}\nKäufer (Stripe): ${session.email ?? "–"}\nSession: ${d.sessionId}\n\nkunde.yaml im Anhang → an den Agent geben (docweb/AGENTS.md).`,
      attachments: [{ filename: "kunde.yaml", content: Buffer.from(yaml, "utf8") }],
    });
    if (sent.error) {
      console.error("[docweb] onboarding mail rejected by provider");
      return new Response("Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.", {
        status: 502,
      });
    }
  } catch {
    console.error("[docweb] onboarding mail request failed");
    return new Response("Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.", {
      status: 502,
    });
  }

  processed.add(d.sessionId);
  // Bestätigung ist sekundär und geht nur an die bei Stripe hinterlegte Käufer-Adresse.
  if (session.email) {
    try {
      const confirmation = await resend.emails.send({
        from: FROM,
        to: session.email,
        replyTo: TO,
        subject: "Ihre docweb-Website: Angaben erhalten",
        text: `Guten Tag,\n\nvielen Dank – wir haben Ihre Angaben für ${d.praxis.name} erhalten.\n\nBitte antworten Sie auf diese Mail mit Ihrem Logo (SVG oder PNG) und, falls vorhanden, Fotos von Team und Praxisräumen.\n\n${DOCWEB.deliveryPromise}\n\nViele Grüße\nLucas Kleipödszus\nlkmedia`,
      });
      if (confirmation.error) {
        console.error("[docweb] confirmation mail rejected by provider");
      }
    } catch {
      console.error("[docweb] confirmation mail request failed");
    }
  }

  return Response.redirect(`${origin}/docweb/danke`, 303);
};
