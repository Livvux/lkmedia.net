import type { APIRoute } from "astro";
import { Resend } from "resend";

export const prerender = false;

const RESEND_KEY = import.meta.env.RESEND_API_KEY;
const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY;
const TO = "lk@lucaskleipoedszus.com";
const FROM = "lkmedia.net <no-reply@lkmedia.net>";

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
  const form = await request.formData();
  if (form.get("website")) return new Response("ok", { status: 200 }); // honeypot
  const token = form.get("cf-turnstile-response")?.toString() ?? null;
  if (!(await verifyTurnstile(token, clientAddress))) {
    return new Response("captcha failed", { status: 400 });
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
  const message = String(form.get("message") ?? "")
    .slice(0, 5000)
    .trim();
  if (!name || !email || !message) return new Response("missing fields", { status: 400 });

  if (!RESEND_KEY) {
    console.warn("[contact] RESEND_API_KEY unset — skipping send. Payload:", {
      name,
      email,
      company,
      budget,
      message,
    });
  } else {
    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `Projektanfrage: ${name} (${budget})`,
      text: `Name: ${name}\nEmail: ${email}\nFirma: ${company}\nBudget: ${budget}\n\n${message}`,
    });
  }
  const origin = new URL(request.url).origin;
  const lang = request.headers.get("accept-language")?.startsWith("en") ? "/en/thanks" : "/danke";
  return Response.redirect(`${origin}${lang}`, 303);
};
