import type { APIRoute } from "astro";
import { checkSession, parseOnboarding, toKundeYaml } from "../../lib/handwerkweb";
import { sendMail } from "../../lib/mailer";

export const prerender = false;

const TO = "lucas@lkmedia.net";
const env = (k: string): string | undefined => process.env[k] ?? import.meta.env[k];
// ponytail: In-Memory-Sperre gegen Mehrfach-Einsendung einer Session; nach Neustart leer.
const processed = new Set<string>();

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
      headers: { Location: `/handwerk/onboarding?${back}` },
    });
  }

  const stripeKey = env("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[handwerkweb] STRIPE_SECRET_KEY unset – rejecting onboarding");
    return new Response(
      "Onboarding derzeit nicht verfügbar. Bitte schreiben Sie an lucas@lkmedia.net.",
      {
        status: 503,
      },
    );
  }
  const d = parsed.data;
  const session = await checkSession(d.sessionId, stripeKey);
  if (!session.paid)
    return new Response("Bestellung nicht gefunden oder nicht bezahlt.", { status: 403 });
  if (processed.has(d.sessionId)) {
    return new Response(
      "Angaben zu dieser Bestellung wurden bereits übermittelt. Änderungen bitte per Mail an lucas@lkmedia.net.",
      { status: 409 },
    );
  }

  const yaml = toKundeYaml(d, new Date().toISOString().slice(0, 10));
  try {
    await sendMail({
      to: TO,
      replyTo: d.betrieb.email,
      subject: `handwerkweb Onboarding: ${d.betrieb.name}`.replace(/\s+/g, " "),
      text: `Neues handwerkweb-Onboarding.\n\nBetrieb: ${d.betrieb.name}\nKäufer (Stripe): ${session.email ?? "–"}\nSession: ${d.sessionId}\n\nkunde.yaml im Anhang → an den Agent geben (handwerkweb/AGENTS.md).`,
      attachments: [
        { filename: "kunde.yaml", contentType: "text/yaml", content: Buffer.from(yaml, "utf8") },
      ],
    });
  } catch (error) {
    console.error("[handwerkweb] onboarding mail failed", error, "\n", yaml);
    return new Response("Senden fehlgeschlagen. Bitte schreiben Sie an lucas@lkmedia.net.", {
      status: 502,
    });
  }
  processed.add(d.sessionId);

  // Bestätigung nur an die bei Stripe hinterlegte Käufer-Adresse, nie an Formulareingaben.
  if (session.email) {
    await sendMail({
      to: session.email,
      replyTo: TO,
      subject: "Ihre handwerkweb-Website: Angaben erhalten",
      text: `Guten Tag,\n\nvielen Dank – wir haben Ihre Angaben für ${d.betrieb.name} erhalten.\n\nBitte antworten Sie auf diese Mail mit Ihrem Logo (SVG oder PNG) und Fotos: Team, Fahrzeuge, Werkstatt und vor allem fertige Projekte (gern mit Ort und Jahr).\n\nSie erhalten in der Regel innerhalb von 7 Werktagen einen Vorschau-Link.\n\nViele Grüße\nLucas Kleipödszus\nlkmedia`,
      attachments: [],
    }).catch((error: unknown) => console.error("[handwerkweb] confirmation mail failed", error));
  }

  return new Response(null, { status: 303, headers: { Location: "/handwerk/danke" } });
};
