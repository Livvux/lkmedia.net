import type { APIRoute } from "astro";
import {
  checkSession,
  FAHRSCHULWEB,
  onboardingUrl,
  parseOnboarding,
  toKundeYaml,
} from "../../lib/fahrschulweb";
import { sendMail } from "../../lib/mailer";

export const prerender = false;

const TO = "lucas@lkmedia.net";
const SITE = "https://lkmedia.net";
const RESUBMIT_MS = 60_000;
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
// ponytail: In-Memory – markiert spätere Einsendungen als Änderung und bremst Doppelklicks.
// Nach Neustart leer: dann kommt eine Änderung als „Onboarding“ an (Datum im YAML zeigt die neueste).
const lastSent = new Map<string, number>();

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Ungültige Anfrage.", { status: 400 });
  }
  if (form.get("website")) return new Response("ok", { status: 200 }); // honeypot

  const parsed = parseOnboarding(form);
  if (!parsed.ok) {
    const back = new URLSearchParams({
      session_id: String(form.get("session_id") ?? ""),
      fehler: parsed.errors.join(" · "),
    });
    return new Response(null, {
      status: 303,
      headers: { Location: `/fahrschule-webdesign/onboarding?${back}` },
    });
  }

  const stripeKey = env("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[fahrschulweb] STRIPE_SECRET_KEY unset – rejecting onboarding");
    return new Response(
      "Onboarding derzeit nicht verfügbar. Bitte schreiben Sie an lucas@lkmedia.net.",
      { status: 503 },
    );
  }
  const d = parsed.data;
  const session = await checkSession(d.sessionId, stripeKey);
  if (!session.paid)
    return new Response("Bestellung nicht gefunden oder nicht bezahlt.", { status: 403 });
  const previous = lastSent.get(d.sessionId);
  if (previous && Date.now() - previous < RESUBMIT_MS) {
    return new Response("Ihre Angaben sind gerade erst angekommen. Bitte in einer Minute erneut.", {
      status: 429,
    });
  }

  const aenderung = previous !== undefined;
  const yaml = toKundeYaml(d, new Date().toISOString().slice(0, 10), aenderung);
  const art = aenderung ? "Änderung" : "Onboarding";
  try {
    await sendMail({
      to: TO,
      replyTo: d.fahrschule.email,
      subject: `fahrschulweb ${art}: ${d.fahrschule.name}`.replace(/\s+/g, " "),
      text: `Neues fahrschulweb-${art}.\n\nFahrschule: ${d.fahrschule.name}\nKäufer (Stripe): ${session.email ?? "–"}\nSession: ${d.sessionId}\n\nkunde.yaml im Anhang – enthält immer den vollständigen aktuellen Stand.`,
      attachments: [
        { filename: "kunde.yaml", contentType: "text/yaml", content: Buffer.from(yaml, "utf8") },
      ],
    });
  } catch (error) {
    console.error("[fahrschulweb] onboarding mail failed", error);
    return new Response("Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.", {
      status: 502,
    });
  }
  lastSent.set(d.sessionId, Date.now());

  // Bestätigung nur an die bei Stripe hinterlegte Käufer-Adresse, nie an Formulareingaben.
  if (session.email) {
    const link = onboardingUrl(SITE, d.sessionId);
    await sendMail({
      to: session.email,
      replyTo: TO,
      subject: aenderung
        ? "Ihre Fahrschul-Website: Änderung erhalten"
        : "Ihre Fahrschul-Website: Angaben erhalten",
      text: aenderung
        ? `Guten Tag,\n\nvielen Dank – wir haben Ihre geänderten Angaben für ${d.fahrschule.name} erhalten und pflegen sie ein.\n\nWeitere Änderungen können Sie jederzeit über diesen Link schicken:\n${link}\n\nViele Grüße\nLucas Kleipödszus\nlkmedia`
        : `Guten Tag,\n\nvielen Dank – wir haben Ihre Angaben für ${d.fahrschule.name} erhalten.\n\nBitte antworten Sie auf diese Mail mit Ihrem Logo (SVG oder PNG) und Fotos: Team, Fahrzeuge, Schulungsraum.\n\n${FAHRSCHULWEB.deliveryPromise}\n\nIhre Angaben können Sie jederzeit ändern – auch nach dem Start. Bewahren Sie diesen Link auf:\n${link}\n\nViele Grüße\nLucas Kleipödszus\nlkmedia`,
      attachments: [],
    }).catch((error: unknown) => console.error("[fahrschulweb] confirmation mail failed", error));
  }

  return new Response(null, {
    status: 303,
    headers: { Location: "/fahrschule-webdesign/danke" },
  });
};
