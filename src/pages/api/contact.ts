import type { APIRoute } from "astro";
import { Resend } from "resend";
import { clientIp } from "../../lib/client-ip";
import { routeFor } from "../../lib/i18n";
import {
  DISCOVERY_CHANNELS,
  discoveryChannel,
  leadSource,
  SERVICES,
  serviceInterest,
} from "../../lib/lead-source";

export const prerender = false;

const RESEND_KEY = process.env.RESEND_API_KEY;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const TO = "lucas@lkmedia.net";
const FROM = "lkmedia.net <no-reply@lkmedia.net>";
const TEXT = {
  de: {
    invalid: "Das Absenden hat nicht geklappt. Bitte versuchen Sie es noch einmal.",
    turnstile:
      "Die Sicherheitsprüfung hat nicht geklappt. Bitte bestätigen Sie sie erneut und senden Sie noch einmal.",
    required: "Bitte füllen Sie Name, E-Mail und Nachricht aus.",
    unavailable: "Versand gerade nicht verfügbar. Bitte versuchen Sie es später erneut.",
  },
  en: {
    invalid: "Sending did not work. Please try again.",
    turnstile: "The security check failed. Please confirm it again and resend.",
    required: "Please fill in name, email and message.",
    unavailable: "Sending is unavailable right now. Please try again later.",
  },
} as const;

async function verifyTurnstile(token: string | null, ip: string | null): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // dev fallback
  if (!token) return false;
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip ?? "" }),
  });
  const data = (await r.json()) as { success: boolean };
  return data.success;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return new Response(TEXT.de.invalid, { status: 400 });
  // Sprache nur aus der festen Liste; sie wählt Fehlertexte und die Danke-Seite.
  const lang = form.get("lang") === "en" ? "en" : "de";
  const text = TEXT[lang];
  const thanks = new Response(null, {
    status: 303,
    headers: { Location: routeFor("thanks", lang) },
  });
  // Honeypot: Bots sehen dieselbe Weiterleitung wie echte Anfragen.
  if (form.get("website")) return thanks;
  const token = form.get("cf-turnstile-response")?.toString() ?? null;
  if (!(await verifyTurnstile(token, clientIp(request, clientAddress)))) {
    return new Response(text.turnstile, { status: 400 });
  }
  const name = String(form.get("name") ?? "")
    .slice(0, 120)
    .trim();
  const email = String(form.get("email") ?? "")
    .slice(0, 120)
    .trim();
  const company = String(form.get("company") ?? "")
    .slice(0, 120)
    .trim();
  const budget = String(form.get("budget") ?? "").trim();
  const source = leadSource(String(form.get("source") ?? "/kontakt"));
  const discovery = discoveryChannel(String(form.get("discovery") ?? "unknown"));
  const service = serviceInterest(String(form.get("service") ?? "unknown"));
  const message = String(form.get("message") ?? "")
    .slice(0, 5000)
    .trim();
  if (!name || !email || !message) {
    return new Response(text.required, { status: 400 });
  }

  if (!RESEND_KEY) {
    console.warn("[contact] RESEND_API_KEY unset");
    return new Response(text.unavailable, { status: 503 });
  }
  try {
    const resend = new Resend(RESEND_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `Projektanfrage: ${name} (${budget})`,
      text: `Angebotsseite: ${source}\nAnliegen: ${SERVICES[service].de}\nSprache: ${lang}\nHerkunft (Selbstauskunft): ${DISCOVERY_CHANNELS[discovery]}\nName: ${name}\nEmail: ${email}\nFirma: ${company}\nBudget: ${budget}\n\n${message}`,
    });
    if (error) throw new Error("Resend delivery failed");
  } catch {
    console.error("[contact] Versand fehlgeschlagen");
    return new Response(text.unavailable, { status: 503 });
  }
  console.info(`[seo] lead_received source=${source} service=${service} discovery=${discovery}`);
  return thanks;
};
